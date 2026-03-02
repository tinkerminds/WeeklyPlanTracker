using WeeklyPlanTracker.Core.Enums;

namespace WeeklyPlanTracker.Core.Entities
{
    /// <summary>
    /// Represents a weekly planning cycle. Planning happens on Tuesdays
    /// for the upcoming 4 working days (Wednesday through Monday).
    /// Follows the state machine: Setup → PlanningOpen → Frozen → Completed.
    /// </summary>
    public class WeeklyPlan
    {
        public Guid Id { get; set; }

        /// <summary>The Tuesday date when planning occurs. Must be a Tuesday.</summary>
        public DateTime PlanningDate { get; set; }

        /// <summary>Computed: PlanningDate + 1 day (Wednesday).</summary>
        public DateTime WorkStartDate => PlanningDate.AddDays(1);

        /// <summary>Computed: PlanningDate + 6 days (Monday).</summary>
        public DateTime WorkEndDate => PlanningDate.AddDays(6);

        /// <summary>Current state in the lifecycle: Setup, PlanningOpen, Frozen, or Completed.</summary>
        public WeekState State { get; set; } = WeekState.Setup;

        /// <summary>Percentage of total hours allocated to Client Focused work (0-100).</summary>
        public int ClientFocusedPercent { get; set; }

        /// <summary>Percentage of total hours allocated to Tech Debt work (0-100).</summary>
        public int TechDebtPercent { get; set; }

        /// <summary>Percentage of total hours allocated to R&D work (0-100).</summary>
        public int RAndDPercent { get; set; }

        /// <summary>When this weekly plan was created.</summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public ICollection<WeeklyPlanMember> WeeklyPlanMembers { get; set; } = new List<WeeklyPlanMember>();
        public ICollection<PlanAssignment> PlanAssignments { get; set; } = new List<PlanAssignment>();

        // Computed properties

        /// <summary>Total plannable hours = selected members × 30 hours each.</summary>
        public int TotalHours => WeeklyPlanMembers.Count * 30;

        /// <summary>Budget hours for Client Focused category.</summary>
        public int ClientFocusedBudgetHours => (int)Math.Round(TotalHours * ClientFocusedPercent / 100.0);

        /// <summary>Budget hours for Tech Debt category.</summary>
        public int TechDebtBudgetHours => (int)Math.Round(TotalHours * TechDebtPercent / 100.0);

        /// <summary>Budget hours for R&D category.</summary>
        public int RAndDBudgetHours => (int)Math.Round(TotalHours * RAndDPercent / 100.0);
    }
}
