using WeeklyPlanTracker.Core.Enums;

namespace WeeklyPlanTracker.API.DTOs
{
    // ── Request DTOs ──

    /// <summary>Request to create a plan assignment (add a backlog item to a member's plan).</summary>
    public class CreatePlanAssignmentRequest
    {
        public Guid WeeklyPlanId { get; set; }
        public Guid TeamMemberId { get; set; }
        public Guid BacklogItemId { get; set; }
        public int CommittedHours { get; set; }
    }

    /// <summary>Request to update committed hours on an assignment.</summary>
    public class UpdatePlanAssignmentRequest
    {
        public int CommittedHours { get; set; }
    }

    /// <summary>Request to update progress (hours and status) on an assignment.</summary>
    public class UpdateProgressRequest
    {
        public decimal HoursCompleted { get; set; }
        public AssignmentStatus Status { get; set; }
        public string? Notes { get; set; }
    }

    // ── Response DTOs ──

    /// <summary>Full plan assignment response with related entity names.</summary>
    public class PlanAssignmentResponse
    {
        public Guid Id { get; set; }
        public Guid WeeklyPlanId { get; set; }
        public Guid TeamMemberId { get; set; }
        public string TeamMemberName { get; set; } = string.Empty;
        public Guid BacklogItemId { get; set; }
        public string BacklogItemTitle { get; set; } = string.Empty;
        public BacklogCategory BacklogItemCategory { get; set; }
        public int BacklogItemEstimatedHours { get; set; }
        public int CommittedHours { get; set; }
        public decimal HoursCompleted { get; set; }
        public AssignmentStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
