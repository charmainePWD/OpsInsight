namespace OpsInsight.Api.Models;

public class Incident
{
    public int Id { get; set; }

    public int ServiceId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string Severity { get; set; } = "Low";

    public string Status { get; set; } = "Open";

    public DateTime CreatedAt { get; set; }

    public DateTime? ResolvedAt { get; set; }

    public Service? Service { get; set; }

    //public record UpdateIncidentStatusRequest(string Status);
}