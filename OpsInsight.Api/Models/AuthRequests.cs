
namespace OpsInsight.Api.Models;

public record CheckEmailRequest(string Email);

public record LoginRequest(string Email, string Password);

public record CreateUserRequest(
    string Name,
    string Surname,
    string Email,
    string Password,
    string Permission);

public record UpdatePermissionRequest(string Permission);

public record CreateAssignmentRequest(int UserId, int IncidentId);
