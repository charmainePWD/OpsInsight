using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using OpsInsight.Api.Data;
using OpsInsight.Api.Models;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Routing.Patterns;
using Microsoft.AspNetCore.Authentication.Cookies;
using OpsInsight.Api.Endpoints;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddDbContext<OpsInsightDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("OpsInsightDb")));

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "OpsInsight.Auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        options.ExpireTimeSpan = TimeSpan.FromHours(8);
        options.SlidingExpiration = true;

        options.Events.OnValidatePrincipal = async context =>
        {
            var idValue = context.Principal?.FindFirstValue(
                ClaimTypes.NameIdentifier);

            if (!int.TryParse(idValue, out var id))
            {
                context.RejectPrincipal();
                return;
            }

            var db = context.HttpContext.RequestServices
                .GetRequiredService<OpsInsightDbContext>();

            var user = await db.Users.FindAsync(id);

            if (user is null)
            {
                context.RejectPrincipal();
                return;
            }

            var identity = new ClaimsIdentity(context.Principal!.Identity);

            foreach (var claim in identity.FindAll(ClaimTypes.Role).ToList())
            {
                identity.RemoveClaim(claim);
            }

            identity.AddClaim(new Claim(ClaimTypes.Role, user.Permission));

            context.ReplacePrincipal(new ClaimsPrincipal(identity));
            context.ShouldRenew = true;
        };

        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };

        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdministratorOnly", policy =>
        policy.RequireRole("Administrator"));
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("ReactFrontend");
app.UseAuthentication();
app.UseAuthorization();

// =========================================================
// SERVICES
// =========================================================

app.MapGet("/api/services", async (OpsInsightDbContext db) =>
{
    var services = await db.Services
        .AsNoTracking()
        .OrderBy(service => service.Id)
        .ToListAsync();

    return Results.Ok(services);
})
.RequireAuthorization()
.WithName("GetServices");

// =========================================================
// GET INCIDENTS
// Includes service Azure details and current assignment.
// =========================================================

app.MapGet("/api/incidents", async (
    ClaimsPrincipal principal,
    OpsInsightDbContext db) =>
{
    int.TryParse(
        principal.FindFirstValue(ClaimTypes.NameIdentifier),
        out var currentUserId);

    var incidents = await db.Incidents
        .AsNoTracking()
        .OrderByDescending(incident => incident.CreatedAt)
        .Select(incident => new
        {
            incident.Id,
            incident.ServiceId,

            ServiceName = incident.Service!.Name,
            ServiceCategory = incident.Service.Category,
            ServiceDescription = incident.Service.Description,

            incident.Title,
            incident.Description,
            incident.Severity,
            incident.Status,
            incident.CreatedAt,
            incident.ResolvedAt,

            // Azure details are read from the related service.
            TenantName = incident.Service.TenantName,
            TenantId = incident.Service.TenantId,
            SubscriptionName = incident.Service.SubscriptionName,
            SubscriptionId = incident.Service.SubscriptionId,
            ResourceGroup = incident.Service.ResourceGroup,
            AzureResourceId = incident.Service.AzureResourceId,
            ResourceType = incident.Service.ResourceType,
            Region = incident.Service.Region,
            Environment = incident.Service.Environment,

            Assignment = db.Assignments
                .Where(assignment =>
                    assignment.IncidentId == incident.Id &&
                    assignment.UnassignedAt == null)
                .Select(assignment => new
                {
                    assignment.Id,
                    assignment.UserId,

                    AssignedTo = assignment.User!.Name +
                        " " + assignment.User.Surname,

                    AssignedBy = assignment.AssignedByUser == null
                        ? "System"
                        : assignment.AssignedByUser.Name +
                          " " + assignment.AssignedByUser.Surname,

                    assignment.AssignedAt,
                    assignment.Status
                })
                .FirstOrDefault()
        })
        .ToListAsync();

    var result = incidents.Select(incident => new
    {
        incident.Id,
        incident.ServiceId,
        incident.ServiceName,
        incident.ServiceCategory,
        incident.ServiceDescription,

        incident.Title,
        incident.Description,
        incident.Severity,
        incident.Status,
        incident.CreatedAt,
        incident.ResolvedAt,

        incident.TenantName,
        incident.TenantId,
        incident.SubscriptionName,
        incident.SubscriptionId,
        incident.ResourceGroup,
        incident.AzureResourceId,
        incident.ResourceType,
        incident.Region,
        incident.Environment,

        AssignmentId = incident.Assignment?.Id,
        AssignedUserId = incident.Assignment?.UserId,
        AssignedTo = incident.Assignment?.AssignedTo,
        AssignedBy = incident.Assignment?.AssignedBy,
        AssignedAt = incident.Assignment?.AssignedAt,
        AssignmentStatus = incident.Assignment?.Status,

        IsAssignedToCurrentUser =
            incident.Assignment != null &&
            incident.Assignment.UserId == currentUserId
    });

    return Results.Ok(result);
})
.RequireAuthorization()
.WithName("GetIncidents");

// =========================================================
// RESOLVE INCIDENT
// =========================================================

app.MapPatch("/api/incidents/{id:int}/resolve", async (
    int id,
    ClaimsPrincipal principal,
    OpsInsightDbContext db) =>
{
    var isAdmin = principal.IsInRole("Administrator");

    if (!int.TryParse(
        principal.FindFirstValue(ClaimTypes.NameIdentifier),
        out var currentUserId))
    {
        return Results.Unauthorized();
    }

    var incident = await db.Incidents.FindAsync(id);

    if (incident is null)
    {
        return Results.NotFound(new
        {
            message = $"Incident {id} was not found."
        });
    }

    var activeAssignment = await db.Assignments
        .FirstOrDefaultAsync(assignment =>
            assignment.IncidentId == incident.Id &&
            assignment.UnassignedAt == null);

    if (!isAdmin)
    {
        if (activeAssignment is null ||
            activeAssignment.UserId != currentUserId ||
            activeAssignment.Status != "Active")
        {
            return Results.Forbid();
        }
    }

    if (activeAssignment?.Status == "PendingAbandonment")
    {
        return Results.Conflict(new
        {
            message = "Review the pending abandonment request before resolving this incident."
        });
    }

    incident.Status = "Resolved";
    incident.ResolvedAt = DateTime.UtcNow;

    if (activeAssignment is not null)
    {
        activeAssignment.Status = "Closed";
        activeAssignment.ClosureReason = "Resolved";
        activeAssignment.UnassignedAt = DateTime.UtcNow;
        activeAssignment.ClosureNotes =
            "Incident resolved; assignment automatically closed.";
    }

    await db.SaveChangesAsync();

    return Results.Ok(new
    {
        incident.Id,
        incident.Status,
        incident.ResolvedAt
    });
})
.RequireAuthorization()
.WithName("ResolveIncident");

// =========================================================
// UPDATE INCIDENT STATUS
// =========================================================

app.MapPatch("/api/incidents/{id:int}/status", async (
    int id,
    UpdateIncidentStatusRequest request,
    ClaimsPrincipal principal,
    OpsInsightDbContext db) =>
{
    var allowedStatuses = new[]
    {
        "Open",
        "Investigating",
        "Monitoring",
        "Resolved"
    };

    if (!allowedStatuses.Contains(request.Status))
    {
        return Results.BadRequest(new
        {
            message = "Invalid incident status."
        });
    }

    if (!int.TryParse(
        principal.FindFirstValue(ClaimTypes.NameIdentifier),
        out var currentUserId))
    {
        return Results.Unauthorized();
    }

    var isAdmin = principal.IsInRole("Administrator");

    var incident = await db.Incidents.FindAsync(id);

    if (incident is null)
    {
        return Results.NotFound(new
        {
            message = $"Incident {id} was not found."
        });
    }

    var activeAssignment = await db.Assignments
        .FirstOrDefaultAsync(assignment =>
            assignment.IncidentId == incident.Id &&
            assignment.UnassignedAt == null);

    if (!isAdmin)
    {
        if (activeAssignment is null ||
            activeAssignment.UserId != currentUserId ||
            activeAssignment.Status != "Active")
        {
            return Results.Forbid();
        }
    }

    if (request.Status == "Resolved" &&
        activeAssignment?.Status == "PendingAbandonment")
    {
        return Results.Conflict(new
        {
            message = "Review the pending abandonment request before resolving this incident."
        });
    }

    incident.Status = request.Status;

    incident.ResolvedAt = request.Status == "Resolved"
        ? incident.ResolvedAt ?? DateTime.UtcNow
        : null;

    if (request.Status == "Resolved" &&
        activeAssignment is not null)
    {
        activeAssignment.Status = "Closed";
        activeAssignment.ClosureReason = "Resolved";
        activeAssignment.UnassignedAt = DateTime.UtcNow;
        activeAssignment.ClosureNotes =
            "Incident resolved; assignment automatically closed.";
    }

    await db.SaveChangesAsync();

    return Results.Ok(new
    {
        incident.Id,
        incident.Status,
        incident.ResolvedAt
    });
})
.RequireAuthorization()
.WithName("UpdateIncidentStatus");

// =========================================================
// DEBUG ROUTES
// =========================================================

app.MapGet("/api/debug/routes", (
    IEnumerable<EndpointDataSource> sources) =>
    sources.SelectMany(source => source.Endpoints)
        .OfType<RouteEndpoint>()
        .Select(endpoint => endpoint.RoutePattern.RawText)
        .Where(route => route is not null)
        .OrderBy(route => route));

// =========================================================
// OTHER ENDPOINT GROUPS
// =========================================================

app.MapAuthEndpoints();
app.MapUserEndpoints();
app.MapAssignmentEndpoints();

app.Run();