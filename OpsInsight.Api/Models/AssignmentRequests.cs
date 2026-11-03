
namespace OpsInsight.Api.Models;

public record SubmitAbandonmentRequest(
    string Reason
);

public record ReviewAbandonmentRequest(
    string? AdminNote
);

public record ReassignAssignmentRequest(
    int NewUserId,
    string? AdminNote
);
