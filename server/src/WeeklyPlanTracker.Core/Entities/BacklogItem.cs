using WeeklyPlanTracker.Core.Enums;

namespace WeeklyPlanTracker.Core.Entities
{
    /// <summary>
    /// Represents a work item in the backlog that can be assigned to team members
    /// during weekly planning. Categorized as ClientFocused, TechDebt, or RAndD.
    /// </summary>
    public class BacklogItem
    {
        public Guid Id { get; set; }

        /// <summary>Short title for the work item.</summary>
        public string Title { get; set; } = string.Empty;

        /// <summary>Optional detailed description of the work.</summary>
        public string? Description { get; set; }

        /// <summary>Category: ClientFocused, TechDebt, or RAndD.</summary>
        public BacklogCategory Category { get; set; }

        /// <summary>Estimated hours for completion. Must be greater than 0.</summary>
        public int EstimatedHours { get; set; }

        /// <summary>Archived items are hidden from the planning picker.</summary>
        public bool IsArchived { get; set; } = false;

        /// <summary>When this backlog item was created.</summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public ICollection<PlanAssignment> PlanAssignments { get; set; } = new List<PlanAssignment>();
    }
}
