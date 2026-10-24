
namespace OpsInsight.Api.Models;

public class Service
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public string Status { get; set; } = "Operational";

    public decimal UptimePercentage { get; set; } = 100.00m;

    public int ResponseTimeMs { get; set; }

    public DateTime CreatedAt { get; set; }
}
