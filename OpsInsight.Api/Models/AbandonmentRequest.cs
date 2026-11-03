
namespace OpsInsight.Api.Models;

public class AbandonmentRequest
{
    public int Id { get; set; }

    public int AssignmentId { get; set; }

    public int RequestedByUserId { get; set; }

    public string Reason { get; set; } = string.Empty;

    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;

    public string Status { get; set; } = "Pending";

    public int? ReviewedByUserId { get; set; }

    public DateTime? ReviewedAt { get; set; }

    public string? AdminNote { get; set; }

    public Assignment? Assignment { get; set; }

    public User? RequestedByUser { get; set; }

    public User? ReviewedByUser { get; set; }
}
