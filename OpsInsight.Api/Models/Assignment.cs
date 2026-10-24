
namespace OpsInsight.Api.Models;

public class Assignment
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int IncidentId { get; set; }
    public int? AssignedByUserId { get; set; }
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UnassignedAt { get; set; }

    public User? User { get; set; }
    public User? AssignedByUser { get; set; }
    public Incident? Incident { get; set; }
}
