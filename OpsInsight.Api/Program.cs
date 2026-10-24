using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using OpsInsight.Api.Data;
using OpsInsight.Api.Models;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Routing.Patterns;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using OpsInsight.Api.Endpoints;



var builder = WebApplication.CreateBuilder(args);

// Register services before building the application.
builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddDbContext<OpsInsightDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("OpsInsightDb")));


builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme).AddCookie(options =>
    {
        options.Cookie.Name = "OpsInsight.Auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        options.ExpireTimeSpan = TimeSpan.FromHours(8);
        options.SlidingExpiration = true;

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

// TEMPORARY: replace demo placeholder passwords with real password hashes.
// using (var scope = app.Services.CreateScope())
// {
//     var db = scope.ServiceProvider
//         .GetRequiredService<OpsInsightDbContext>();

//     var users = await db.Users
//         .Where(user => user.PasswordHash == "DEMO_HASH_REPLACE_BEFORE_LOGIN")
//         .ToListAsync();

//     var hasher = new PasswordHasher<User>();

//     foreach (var user in users)
//     {
//         user.PasswordHash = hasher.HashPassword(
//             user,
//             "OpsInsight!2026"
//         );
//     }

//     if (users.Count > 0)
//     {
//         await db.SaveChangesAsync();
//         Console.WriteLine(
//             $"Created password hashes for {users.Count} demo users."
//         );
//     }
// }

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("ReactFrontend");
app.UseAuthentication();
app.UseAuthorization();

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild",
    "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast = Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast(
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();

    return forecast;
})
.WithName("GetWeatherForecast");


app.MapGet("/api/services", async (OpsInsightDbContext db) =>
{
    var services = await db.Services
        .AsNoTracking()
        .OrderBy(service => service.Id)
        .ToListAsync();

    return Results.Ok(services);
})
.WithName("GetServices");

app.MapGet("/api/incidents", async (OpsInsightDbContext db) =>
{
    var incidents = await db.Incidents
        .AsNoTracking()
        .Include(incident => incident.Service)
        .OrderByDescending(incident => incident.CreatedAt)
        .Select(incident => new
        {
            incident.Id,
            incident.ServiceId,
            ServiceName = incident.Service!.Name,
            incident.Title,
            incident.Description,
            incident.Severity,
            incident.Status,
            incident.CreatedAt,
            incident.ResolvedAt
        })
        .ToListAsync();

    return Results.Ok(incidents);
})
.WithName("GetIncidents");

app.MapPatch("/api/incidents/{id:int}/resolve", async (
    int id,
    OpsInsightDbContext db) =>
{
    var incident = await db.Incidents.FindAsync(id);

    if (incident is null)
    {
        return Results.NotFound(new
        {
            message = $"Incident {id} was not found."
        });
    }

    incident.Status = "Resolved";
    incident.ResolvedAt = DateTime.UtcNow;

    await db.SaveChangesAsync();

    return Results.Ok(new
    {
        incident.Id,
        incident.Status,
        incident.ResolvedAt
    });
})
.WithName("ResolveIncident");


app.MapPatch("/api/incidents/{id:int}/status", async (
    int id,
    UpdateIncidentStatusRequest request,
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

    var incident = await db.Incidents.FindAsync(id);

    if (incident is null)
    {
        return Results.NotFound(new
        {
            message = $"Incident {id} was not found."
        });
    }

    incident.Status = request.Status;
    incident.ResolvedAt = request.Status == "Resolved"
        ? incident.ResolvedAt ?? DateTime.UtcNow
        : null;

    await db.SaveChangesAsync();

    return Results.Ok(new
    {
        incident.Id,
        incident.Status,
        incident.ResolvedAt
    });
})
.WithName("UpdateIncidentStatus");

app.MapGet("/api/debug/routes", (IEnumerable<EndpointDataSource> sources) =>
    sources.SelectMany(source => source.Endpoints)
        .OfType<RouteEndpoint>()
        .Select(endpoint => endpoint.RoutePattern.RawText)
        .Where(route => route is not null)
        .OrderBy(route => route));

app.MapAuthEndpoints();
app.MapUserEndpoints();
app.MapAssignmentEndpoints();

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}

record ServiceHealth(
    int Id,
    string Name,
    string Category,
    string Status,
    double UptimePercentage,
    int ResponseTimeMs);
