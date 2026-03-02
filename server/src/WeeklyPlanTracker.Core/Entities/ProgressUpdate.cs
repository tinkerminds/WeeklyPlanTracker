using WeeklyPlanTracker.Core.Enums;

namespace WeeklyPlanTracker.Core.Entities
{
    /// <summary>
    /// History log entry for progress updates on a plan assignment.
    /// Each time a member updates their progress, a new entry is created
    /// capturing the point-in-time snapshot of hours done, status, and notes.
    /// </summary>
    public class ProgressUpdate
    {
        public Guid Id { get; set; }

        /// <summary>Which plan assignment this update belongs to.</summary>
        public Guid PlanAssignmentId { get; set; }
        public PlanAssignment PlanAssignment { get; set; } = null!;

        /// <summary>When this progress update was recorded.</summary>
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        /// <summary>Total hours done at this point in time.</summary>
        public decimal HoursDone { get; set; }

        /// <summary>Status at this point in time.</summary>
        public AssignmentStatus Status { get; set; }

        /// <summary>Optional progress notes.</summary>
        public string? Notes { get; set; }
    }
}
