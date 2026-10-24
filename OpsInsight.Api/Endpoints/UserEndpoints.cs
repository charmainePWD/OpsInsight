
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OpsInsight.Api.Data;
using OpsInsight.Api.Models;

namespace OpsInsight.Api.Endpoints;

public static class UserEndpoints
{
    public static IEndpointRouteBuilder MapUserEndpoints(
        this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/users")
            .RequireAuthorization();

        group.MapGet("/", async (OpsInsightDbContext db) =>
        {
            var users = await db.Users
                .OrderBy(user => user.Name)
                .ThenBy(user => user.Surname)
                .Select(user => new UserResponse(
                    user.Id,
                    user.Name,
                    user.Surname,
                    user.Email,
                    user.Permission,
                    user.CreatedAt))
                .ToListAsync();

            return Results.Ok(users);
        });

        group.MapPost("/", async (
            CreateUserRequest request,
            OpsInsightDbContext db,
            HttpContext context) =>
        {
            if (!context.User.IsInRole("Administrator"))
                return Results.Forbid();

            var name = request.Name.Trim();
            var surname = request.Surname.Trim();
            var email = request.Email.Trim().ToLowerInvariant();

            if (string.IsNullOrWhiteSpace(name) ||
                string.IsNullOrWhiteSpace(surname) ||
                string.IsNullOrWhiteSpace(email) ||
                request.Password.Length < 12)
            {
                return Results.BadRequest(new
                {
                    message = "Enter all details and use a password of at least 12 characters."
                });
            }

            if (request.Permission is not ("Administrator" or "Viewer"))
                return Results.BadRequest(new { message = "Invalid permission." });

            if (await db.Users.AnyAsync(user => user.Email == email))
                return Results.Conflict(new { message = "That email already exists." });

            var user = new User
            {
                Name = name,
                Surname = surname,
                Email = email,
                Permission = request.Permission
            };

            user.PasswordHash = new PasswordHasher<User>()
                .HashPassword(user, request.Password);

            db.Users.Add(user);
            await db.SaveChangesAsync();

            return Results.Created(
                $"/api/users/{user.Id}",
                UserResponse.From(user));
        }).RequireAuthorization("AdministratorOnly");

        group.MapPatch("/{id:int}/permission", async (
            int id,
            UpdatePermissionRequest request,
            OpsInsightDbContext db,
            HttpContext context) =>
        {
            if (request.Permission is not ("Administrator" or "Viewer"))
                return Results.BadRequest(new { message = "Invalid permission." });

            var user = await db.Users.FindAsync(id);

            if (user is null)
                return Results.NotFound(new { message = "User not found." });

            var currentId = context.User.FindFirst(
                System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            if (currentId == id.ToString() &&
                request.Permission != "Administrator")
            {
                var admins = await db.Users.CountAsync(
                    item => item.Permission == "Administrator");

                if (admins <= 1)
                    return Results.BadRequest(new
                    {
                        message = "You cannot remove the last administrator."
                    });
            }

            user.Permission = request.Permission;
            await db.SaveChangesAsync();

            return Results.Ok(UserResponse.From(user));
        }).RequireAuthorization("AdministratorOnly");

        return app;
    }
}
