
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using OpsInsight.Api.Data;
using OpsInsight.Api.Models;

namespace OpsInsight.Api.Endpoints;

public static class AssignmentEndpoints
{
    public static IEndpointRouteBuilder MapAssignmentEndpoints(
        this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/assignments")
            .RequireAuthorization();

        // =====================================================
        // GET ASSIGNMENTS
        // Administrators: all assignments
        // Viewers: their own assignments and history
        // =====================================================

        group.MapGet("/", async (
            ClaimsPrincipal principal,
            OpsInsightDbContext db) =>
        {
            var isAdmin = principal.IsInRole("Administrator");

            if (!TryGetUserId(principal, out var currentUserId))
                return Results.Unauthorized();

            var query = db.Assignments
                .AsNoTracking()
                .Include(item => item.User)
                .Include(item => item.AssignedByUser)
                .Include(item => item.Incident)
                    .ThenInclude(incident => incident!.Service)
                .AsQueryable();

            if (!isAdmin)
                query = query.Where(item => item.UserId == currentUserId);

            var assignments = await query
                .OrderByDescending(item => item.AssignedAt)
                .Select(item => new
                {
                    item.Id,
                    item.UserId,
                    UserName = item.User!.Name + " " + item.User.Surname,

                    item.IncidentId,
                    IncidentTitle = item.Incident!.Title,
                    ServiceName = item.Incident.Service!.Name,
                    IncidentStatus = item.Incident.Status,

                    AssignedBy = item.AssignedByUser == null
                        ? "System"
                        : item.AssignedByUser.Name + " " +
                          item.AssignedByUser.Surname,

                    item.AssignedAt,
                    item.UnassignedAt,
                    item.Status,
                    item.ClosureReason,
                    item.ClosureNotes,
                    item.PreviousAssignmentId,

                    IsActive = item.Status != "Closed",

                    PendingAbandonmentRequest = db.AbandonmentRequests
                        .Where(request =>
                            request.AssignmentId == item.Id &&
                            request.Status == "Pending")
                        .Select(request => new
                        {
                            request.Id,
                            request.Reason,
                            request.RequestedAt
                        })
                        .FirstOrDefault()
                })
                .ToListAsync();

            return Results.Ok(assignments);
        });


        // =====================================================
        // CREATE ASSIGNMENT
        // Administrator only
        // Does not change the incident status
        // =====================================================

        group.MapPost("/", async (
            CreateAssignmentRequest request,
            ClaimsPrincipal principal,
            OpsInsightDbContext db) =>
        {
            if (!TryGetUserId(principal, out var adminId))
                return Results.Unauthorized();

            if (request.UserId <= 0 || request.IncidentId <= 0)
                return Results.BadRequest(new
                {
                    message = "A valid user and incident are required."
                });

            var userExists = await db.Users.AnyAsync(
                user => user.Id == request.UserId);

            if (!userExists)
                return Results.BadRequest(new
                {
                    message = "User not found."
                });

            var incident = await db.Incidents.FindAsync(
                request.IncidentId);

            if (incident is null)
                return Results.NotFound(new
                {
                    message = "Incident not found."
                });

            if (incident.Status == "Resolved")
                return Results.BadRequest(new
                {
                    message = "A resolved incident cannot be assigned."
                });

            var existingAssignment = await db.Assignments.AnyAsync(item =>
                item.IncidentId == request.IncidentId &&
                item.UnassignedAt == null);

            if (existingAssignment)
                return Results.Conflict(new
                {
                    message = "This incident already has an active assignment."
                });

            var assignment = new Assignment
            {
                UserId = request.UserId,
                IncidentId = request.IncidentId,
                AssignedByUserId = adminId,
                AssignedAt = DateTime.UtcNow,
                Status = "Active"
            };

            db.Assignments.Add(assignment);

            await db.SaveChangesAsync();

            return Results.Created(
                $"/api/assignments/{assignment.Id}",
                new
                {
                    assignment.Id,
                    assignment.UserId,
                    assignment.IncidentId,
                    assignment.Status
                });
        })
        .RequireAuthorization("AdministratorOnly");


        // =====================================================
        // VIEWER REQUESTS ABANDONMENT
        // Assignment remains active but becomes pending
        // =====================================================

        group.MapPost("/{id:int}/abandonment-requests", async (
            int id,
            SubmitAbandonmentRequest request,
            ClaimsPrincipal principal,
            OpsInsightDbContext db) =>
        {
            if (!TryGetUserId(principal, out var userId))
                return Results.Unauthorized();

            if (principal.IsInRole("Administrator"))
                return Results.BadRequest(new
                {
                    message = "Administrators do not need to request abandonment."
                });

            if (string.IsNullOrWhiteSpace(request.Reason))
                return Results.BadRequest(new
                {
                    message = "Please provide a reason."
                });

            if (request.Reason.Trim().Length > 1000)
                return Results.BadRequest(new
                {
                    message = "The reason cannot exceed 1000 characters."
                });

            var assignment = await db.Assignments
                .FirstOrDefaultAsync(item => item.Id == id);

            if (assignment is null)
                return Results.NotFound();

            if (assignment.UserId != userId)
                return Results.Forbid();

            if (assignment.Status == "Closed")
                return Results.BadRequest(new
                {
                    message = "This assignment is already closed."
                });

            if (assignment.Status == "PendingAbandonment")
                return Results.Conflict(new
                {
                    message = "An abandonment request is already pending."
                });

            var abandonmentRequest = new AbandonmentRequest
            {
                AssignmentId = assignment.Id,
                RequestedByUserId = userId,
                Reason = request.Reason.Trim(),
                RequestedAt = DateTime.UtcNow,
                Status = "Pending"
            };

            assignment.Status = "PendingAbandonment";

            db.AbandonmentRequests.Add(abandonmentRequest);

            await db.SaveChangesAsync();

            return Results.Created(
                $"/api/assignments/abandonment-requests/{abandonmentRequest.Id}",
                new
                {
                    abandonmentRequest.Id,
                    abandonmentRequest.AssignmentId,
                    abandonmentRequest.Status,
                    abandonmentRequest.RequestedAt
                });
        });


        // =====================================================
        // ADMIN: VIEW ABANDONMENT REQUESTS
        // =====================================================

        group.MapGet("/abandonment-requests", async (
            OpsInsightDbContext db) =>
        {
            var requests = await db.AbandonmentRequests
                .AsNoTracking()
                .Include(request => request.Assignment)
                    .ThenInclude(assignment => assignment!.Incident)
                        .ThenInclude(incident => incident!.Service)
                .Include(request => request.Assignment)
                    .ThenInclude(assignment => assignment!.User)
                .Include(request => request.RequestedByUser)
                .Include(request => request.ReviewedByUser)
                .OrderByDescending(request => request.RequestedAt)
                .Select(request => new
                {
                    request.Id,
                    request.AssignmentId,

                    request.Reason,
                    request.RequestedAt,
                    request.Status,

                    request.ReviewedAt,
                    request.AdminNote,

                    RequestedBy = request.RequestedByUser!.Name +
                        " " + request.RequestedByUser.Surname,

                    ReviewedBy = request.ReviewedByUser == null
                        ? null
                        : request.ReviewedByUser.Name +
                          " " + request.ReviewedByUser.Surname,

                    AssignedTo = request.Assignment!.User!.Name +
                        " " + request.Assignment.User.Surname,

                    request.Assignment.IncidentId,
                    IncidentTitle = request.Assignment.Incident!.Title,
                    ServiceName = request.Assignment.Incident.Service!.Name
                })
                .ToListAsync();

            return Results.Ok(requests);
        })
        .RequireAuthorization("AdministratorOnly");


        // =====================================================
        // ADMIN: APPROVE ABANDONMENT
        // Closes assignment and returns incident to Open
        // =====================================================

        group.MapPost("/abandonment-requests/{requestId:int}/approve",
            async (
                int requestId,
                ReviewAbandonmentRequest review,
                ClaimsPrincipal principal,
                OpsInsightDbContext db) =>
            {
                if (!TryGetUserId(principal, out var adminId))
                    return Results.Unauthorized();

                var abandonmentRequest = await db.AbandonmentRequests
                    .Include(item => item.Assignment)
                        .ThenInclude(assignment => assignment!.Incident)
                    .FirstOrDefaultAsync(item => item.Id == requestId);

                if (abandonmentRequest is null)
                    return Results.NotFound();

                if (abandonmentRequest.Status != "Pending")
                    return Results.Conflict(new
                    {
                        message = "This request has already been reviewed."
                    });

                var assignment = abandonmentRequest.Assignment!;

                if (assignment.Status != "PendingAbandonment")
                    return Results.Conflict(new
                    {
                        message = "The assignment is no longer awaiting abandonment."
                    });

                await using var transaction =
                    await db.Database.BeginTransactionAsync();

                var now = DateTime.UtcNow;

                assignment.Status = "Closed";
                assignment.ClosureReason = "Abandoned";
                assignment.UnassignedAt = now;
                assignment.ClosureNotes = string.IsNullOrWhiteSpace(review.AdminNote)
                    ? "Abandonment request approved by an administrator."
                    : review.AdminNote.Trim();

                abandonmentRequest.Status = "Approved";
                abandonmentRequest.ReviewedByUserId = adminId;
                abandonmentRequest.ReviewedAt = now;
                abandonmentRequest.AdminNote = review.AdminNote?.Trim();

                if (assignment.Incident is not null &&
                    assignment.Incident.Status != "Resolved")
                {
                    assignment.Incident.Status = "Open";
                    assignment.Incident.ResolvedAt = null;
                }

                await db.SaveChangesAsync();
                await transaction.CommitAsync();

                return Results.Ok(new
                {
                    message = "Abandonment approved.",
                    assignment.Id,
                    assignment.Status,
                    assignment.ClosureReason
                });
            })
            .RequireAuthorization("AdministratorOnly");


        // =====================================================
        // ADMIN: REJECT ABANDONMENT
        // Assignment returns to Active
        // Request remains in the audit history
        // =====================================================

        group.MapPost("/abandonment-requests/{requestId:int}/reject",
            async (
                int requestId,
                ReviewAbandonmentRequest review,
                ClaimsPrincipal principal,
                OpsInsightDbContext db) =>
            {
                if (!TryGetUserId(principal, out var adminId))
                    return Results.Unauthorized();

                var abandonmentRequest = await db.AbandonmentRequests
                    .Include(item => item.Assignment)
                    .FirstOrDefaultAsync(item => item.Id == requestId);

                if (abandonmentRequest is null)
                    return Results.NotFound();

                if (abandonmentRequest.Status != "Pending")
                    return Results.Conflict(new
                    {
                        message = "This request has already been reviewed."
                    });

                var assignment = abandonmentRequest.Assignment!;

                if (assignment.Status != "PendingAbandonment")
                    return Results.Conflict(new
                    {
                        message = "The assignment is no longer awaiting review."
                    });

                var now = DateTime.UtcNow;

                assignment.Status = "Active";

                abandonmentRequest.Status = "Rejected";
                abandonmentRequest.ReviewedByUserId = adminId;
                abandonmentRequest.ReviewedAt = now;
                abandonmentRequest.AdminNote = review.AdminNote?.Trim();

                await db.SaveChangesAsync();

                return Results.Ok(new
                {
                    message = "Abandonment request rejected. Assignment is active again.",
                    assignment.Id,
                    assignment.Status
                });
            })
            .RequireAuthorization("AdministratorOnly");


        // =====================================================
        // ADMIN: REASSIGN AFTER ABANDONMENT REQUEST
        // Old assignment closes as Reassigned
        // New assignment points to the previous assignment
        // Incident status is preserved
        // =====================================================

        group.MapPost("/abandonment-requests/{requestId:int}/reassign",
            async (
                int requestId,
                ReassignAssignmentRequest request,
                ClaimsPrincipal principal,
                OpsInsightDbContext db) =>
            {
                if (!TryGetUserId(principal, out var adminId))
                    return Results.Unauthorized();

                if (request.NewUserId <= 0)
                    return Results.BadRequest(new
                    {
                        message = "Select a valid user."
                    });

                var abandonmentRequest = await db.AbandonmentRequests
                    .Include(item => item.Assignment)
                        .ThenInclude(assignment => assignment!.Incident)
                    .FirstOrDefaultAsync(item => item.Id == requestId);

                if (abandonmentRequest is null)
                    return Results.NotFound();

                if (abandonmentRequest.Status != "Pending")
                    return Results.Conflict(new
                    {
                        message = "This request has already been reviewed."
                    });

                var oldAssignment = abandonmentRequest.Assignment!;

                if (oldAssignment.Status != "PendingAbandonment")
                    return Results.Conflict(new
                    {
                        message = "The assignment is no longer awaiting review."
                    });

                var newUserExists = await db.Users.AnyAsync(
                    user => user.Id == request.NewUserId);

                if (!newUserExists)
                    return Results.BadRequest(new
                    {
                        message = "The selected user does not exist."
                    });

                if (request.NewUserId == oldAssignment.UserId)
                    return Results.BadRequest(new
                    {
                        message = "Choose a different user for reassignment."
                    });

                await using var transaction =
                    await db.Database.BeginTransactionAsync();

                var now = DateTime.UtcNow;

                oldAssignment.Status = "Closed";
                oldAssignment.ClosureReason = "Reassigned";
                oldAssignment.UnassignedAt = now;
                oldAssignment.ClosureNotes =
                    $"Reassigned by an administrator to user {request.NewUserId}.";

                abandonmentRequest.Status = "Reassigned";
                abandonmentRequest.ReviewedByUserId = adminId;
                abandonmentRequest.ReviewedAt = now;
                abandonmentRequest.AdminNote = request.AdminNote?.Trim();

                // Save the closure first so the filtered unique index
                // allows the replacement assignment to be inserted.
                await db.SaveChangesAsync();

                var newAssignment = new Assignment
                {
                    UserId = request.NewUserId,
                    IncidentId = oldAssignment.IncidentId,
                    AssignedByUserId = adminId,
                    AssignedAt = now,
                    Status = "Active",
                    PreviousAssignmentId = oldAssignment.Id
                };

                db.Assignments.Add(newAssignment);

                await db.SaveChangesAsync();
                await transaction.CommitAsync();

                return Results.Created(
                    $"/api/assignments/{newAssignment.Id}",
                    new
                    {
                        message = "Incident reassigned successfully.",
                        PreviousAssignmentId = oldAssignment.Id,
                        NewAssignmentId = newAssignment.Id,
                        newAssignment.UserId,
                        newAssignment.IncidentId,
                        newAssignment.Status
                    });
            })
            .RequireAuthorization("AdministratorOnly");


        // =====================================================
        // ADMIN: MANUAL UNASSIGN
        // Kept for compatibility with the existing frontend
        // =====================================================

        group.MapPatch("/{id:int}/unassign", async (
            int id,
            OpsInsightDbContext db) =>
        {
            var assignment = await db.Assignments
                .Include(item => item.Incident)
                .FirstOrDefaultAsync(item => item.Id == id);

            if (assignment is null)
                return Results.NotFound();

            if (assignment.Status == "Closed")
                return Results.BadRequest(new
                {
                    message = "This assignment is already closed."
                });

            var now = DateTime.UtcNow;

            assignment.Status = "Closed";
            assignment.ClosureReason = "Abandoned";
            assignment.UnassignedAt = now;
            assignment.ClosureNotes =
                "Assignment manually closed by an administrator.";

            if (assignment.Incident is not null &&
                assignment.Incident.Status != "Resolved")
            {
                assignment.Incident.Status = "Open";
                assignment.Incident.ResolvedAt = null;
            }

            await db.SaveChangesAsync();

            return Results.Ok(new
            {
                assignment.Id,
                assignment.Status,
                assignment.ClosureReason,
                assignment.UnassignedAt
            });
        })
        .RequireAuthorization("AdministratorOnly");


        // =====================================================
        // ADMIN: GET UNASSIGNED INCIDENTS
        // Active incidents without an active assignment
        // =====================================================

        group.MapGet("/unassigned-incidents", async (
            OpsInsightDbContext db) =>
        {
            var incidents = await db.Incidents
                .AsNoTracking()
                .Include(incident => incident.Service)
                .Where(incident =>
                    incident.Status != "Resolved" &&
                    !db.Assignments.Any(assignment =>
                        assignment.IncidentId == incident.Id &&
                        assignment.UnassignedAt == null))
                .OrderByDescending(incident => incident.CreatedAt)
                .Select(incident => new
                {
                    incident.Id,
                    incident.Title,
                    incident.Description,
                    incident.Severity,
                    incident.Status,
                    incident.CreatedAt,
                    ServiceName = incident.Service!.Name
                })
                .ToListAsync();

            return Results.Ok(incidents);
        })
        .RequireAuthorization("AdministratorOnly");


        // =====================================================
        // DASHBOARD: UNASSIGNED INCIDENT COUNT
        // Available to administrators and viewers
        // =====================================================

        group.MapGet("/unassigned-count", async (
            OpsInsightDbContext db) =>
        {
            var count = await db.Incidents
                .CountAsync(incident =>
                    incident.Status != "Resolved" &&
                    !db.Assignments.Any(assignment =>
                        assignment.IncidentId == incident.Id &&
                        assignment.UnassignedAt == null));

            return Results.Ok(new { count });
        });

        return app;
    }

    private static bool TryGetUserId(
        ClaimsPrincipal principal,
        out int userId)
    {
        return int.TryParse(
            principal.FindFirstValue(ClaimTypes.NameIdentifier),
            out userId);
    }
}
