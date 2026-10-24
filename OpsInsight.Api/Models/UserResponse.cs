
namespace OpsInsight.Api.Models;

public record UserResponse(
    int Id,
    string Name,
    string Surname,
    string Email,
    string Permission,
    DateTime CreatedAt)
{
    public static UserResponse From(User user) =>
        new(
            user.Id,
            user.Name,
            user.Surname,
            user.Email,
            user.Permission,
            user.CreatedAt);
}
