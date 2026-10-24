
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

        group.MapGet("/", async (
            ClaimsPrincipal principal,
            OpsInsightDbContext db) =>
        {
            var isAdmin = principal.IsInRole("Administrator");
            var idValue = principal.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!int.TryParse(idValue, out var currentUserId))
                return Results.Unauthorized();

            var query = db.Assignments
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
                    IsActive = item.UnassignedAt == null
                })
                .ToListAsync();

            return Results.Ok(assignments);
        });

        group.MapPost("/", async (
            CreateAssignmentRequest request,
            ClaimsPrincipal principal,
            OpsInsightDbContext db) =>
        {
            var assignedByValue = principal.FindFirstValue(
                ClaimTypes.NameIdentifier);

            if (!int.TryParse(assignedByValue, out var assignedById))
                return Results.Unauthorized();

            var userExists = await db.Users.AnyAsync(
                user => user.Id == request.UserId);

            if (!userExists)
                return Results.BadRequest(new { message = "User not found." });

            var incident = await db.Incidents.FindAsync(request.IncidentId);

            if (incident is null)
                return Results.BadRequest(new { message = "Incident not found." });

            var existingActive = await db.Assignments.AnyAsync(item =>
                item.IncidentId == request.IncidentId &&
                item.UnassignedAt == null);

            if (existingActive)
                return Results.Conflict(new
                {
                    message = "This incident already has an active assignment. Unassign it first."
                });

            var assignment = new Assignment
            {
                UserId = request.UserId,
                IncidentId = request.IncidentId,
                AssignedByUserId = assignedById,
                AssignedAt = DateTime.UtcNow
            };

            db.Assignments.Add(assignment);
            await db.SaveChangesAsync();

            return Results.Created(
                $"/api/assignments/{assignment.Id}",
                new { assignment.Id });
        }).RequireAuthorization("AdministratorOnly");

        group.MapPatch("/{id:int}/unassign", async (
            int id,
            OpsInsightDbContext db) =>
        {
            var assignment = await db.Assignments.FindAsync(id);

            if (assignment is null)
                return Results.NotFound();

            if (assignment.UnassignedAt is not null)
                return Results.BadRequest(new
                {
                    message = "This assignment is already closed."
                });

            assignment.UnassignedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();

            return Results.Ok(new { assignment.Id, assignment.UnassignedAt });
        }).RequireAuthorization("AdministratorOnly");

        return app;
    }
}
