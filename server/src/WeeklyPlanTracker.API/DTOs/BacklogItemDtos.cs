using WeeklyPlanTracker.Core.Enums;

namespace WeeklyPlanTracker.API.DTOs
{
    // ── Request DTOs ──

    /// <summary>Request to create a new backlog item.</summary>
    public class CreateBacklogItemRequest
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public BacklogCategory Category { get; set; }
        public int EstimatedHours { get; set; }
    }

    /// <summary>Request to update a backlog item.</summary>
    public class UpdateBacklogItemRequest
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public BacklogCategory Category { get; set; }
        public int EstimatedHours { get; set; }
    }

    // ── Response DTOs ──

    /// <summary>Backlog item response DTO.</summary>
    public class BacklogItemResponse
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public BacklogCategory Category { get; set; }
        public int EstimatedHours { get; set; }
        public bool IsArchived { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
