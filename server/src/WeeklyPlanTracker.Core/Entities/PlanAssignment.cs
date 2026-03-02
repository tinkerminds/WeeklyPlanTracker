using WeeklyPlanTracker.Core.Enums;

namespace WeeklyPlanTracker.Core.Entities
{
    /// <summary>
    /// Represents a team member's commitment to work on a specific backlog item
    /// during a weekly plan. Tracks committed hours and actual progress.
    /// Same backlog item can be assigned to multiple members (shared work).
    /// </summary>
    public class PlanAssignment
    {
        public Guid Id { get; set; }

        /// <summary>Which weekly plan this assignment belongs to.</summary>
        public Guid WeeklyPlanId { get; set; }
        public WeeklyPlan WeeklyPlan { get; set; } = null!;

        /// <summary>Which team member is assigned.</summary>
        public Guid TeamMemberId { get; set; }
        public TeamMember TeamMember { get; set; } = null!;

        /// <summary>Which backlog item is being worked on.</summary>
        public Guid BacklogItemId { get; set; }
        public BacklogItem BacklogItem { get; set; } = null!;

        /// <summary>Hours this member commits to work on this item. Must be > 0.</summary>
        public int CommittedHours { get; set; }

        /// <summary>Actual hours completed. Can exceed CommittedHours (noted with a warning).</summary>
        public decimal HoursCompleted { get; set; } = 0;

        /// <summary>Current status: NotStarted, InProgress, Done, or Blocked.</summary>
        public AssignmentStatus Status { get; set; } = AssignmentStatus.NotStarted;

        /// <summary>When this assignment was created.</summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public ICollection<ProgressUpdate> ProgressUpdates { get; set; } = new List<ProgressUpdate>();
    }
}
