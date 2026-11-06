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

    // Azure resource information
    public string? Description { get; set; }

    public string? TenantName { get; set; }

    public string? TenantId { get; set; }

    public string? SubscriptionName { get; set; }

    public string? SubscriptionId { get; set; }

    public string? ResourceGroup { get; set; }

    public string? AzureResourceId { get; set; }

    public string? ResourceType { get; set; }

    public string? Region { get; set; }

    public string? Environment { get; set; }
}