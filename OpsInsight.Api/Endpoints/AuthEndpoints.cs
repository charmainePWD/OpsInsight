
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using OpsInsight.Api.Data;
using OpsInsight.Api.Models;

namespace OpsInsight.Api.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(
        this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth");

        group.MapPost("/check-email", async (
            CheckEmailRequest request,
            OpsInsightDbContext db) =>
        {
            var email = request.Email.Trim().ToLowerInvariant();

            if (string.IsNullOrWhiteSpace(email))
                return Results.BadRequest(new { message = "Enter an email address." });

            var exists = await db.Users.AnyAsync(
                user => user.Email == email);

            return Results.Ok(new { exists });
        });

        group.MapPost("/login", async (
            LoginRequest request,
            OpsInsightDbContext db,
            HttpContext context) =>
        {
            var email = request.Email.Trim().ToLowerInvariant();

            var user = await db.Users.SingleOrDefaultAsync(
                item => item.Email == email);

            if (user is null ||
                string.IsNullOrWhiteSpace(user.PasswordHash) ||
                user.PasswordHash.StartsWith("DEMO_HASH_"))
            {
                return Results.Json(
                    new { message = "Invalid email or password." },
                    statusCode: StatusCodes.Status401Unauthorized);
            }

            var hasher = new PasswordHasher<User>();
            var result = hasher.VerifyHashedPassword(
                user, user.PasswordHash, request.Password);

            if (result == PasswordVerificationResult.Failed)
            {
                return Results.Json(
                    new { message = "Invalid email or password." },
                    statusCode: StatusCodes.Status401Unauthorized);
            }

            var claims = new List<Claim>
            {
                new(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new(ClaimTypes.Name, $"{user.Name} {user.Surname}"),
                new(ClaimTypes.Email, user.Email),
                new(ClaimTypes.Role, user.Permission)
            };

            var identity = new ClaimsIdentity(
                claims, CookieAuthenticationDefaults.AuthenticationScheme);

            await context.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(identity));

            return Results.Ok(UserResponse.From(user));
        });

        group.MapGet("/me", async (
            ClaimsPrincipal principal,
            OpsInsightDbContext db) =>
        {
            var idValue = principal.FindFirstValue(
                ClaimTypes.NameIdentifier);

            if (!int.TryParse(idValue, out var id))
                return Results.Unauthorized();

            var user = await db.Users.FindAsync(id);

            if (user is null)
                return Results.Unauthorized();

            return Results.Ok(UserResponse.From(user));
        }).RequireAuthorization();

        group.MapPost("/logout", async (HttpContext context) =>
        {
            await context.SignOutAsync(
                CookieAuthenticationDefaults.AuthenticationScheme);

            return Results.Ok(new { message = "Signed out." });
        }).RequireAuthorization();

        return app;
    }
}
