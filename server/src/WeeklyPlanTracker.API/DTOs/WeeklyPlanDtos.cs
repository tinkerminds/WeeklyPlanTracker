using WeeklyPlanTracker.Core.Enums;

namespace WeeklyPlanTracker.API.DTOs
{
    // ── Request DTOs ──

    /// <summary>Request to create a new weekly plan (start a new week).</summary>
    public class CreateWeeklyPlanRequest
    {
        /// <summary>The Tuesday date when planning occurs.</summary>
        public DateTime PlanningDate { get; set; }
    }

    /// <summary>Request to configure a weekly plan during Setup.</summary>
    public class SetupWeeklyPlanRequest
    {
        /// <summary>The Tuesday date when planning occurs.</summary>
        public DateTime PlanningDate { get; set; }

        /// <summary>IDs of team members participating this week.</summary>
        public List<Guid> SelectedMemberIds { get; set; } = new();

        /// <summary>Percentage of hours for Client Focused work (0-100).</summary>
        public int ClientFocusedPercent { get; set; }

        /// <summary>Percentage of hours for Tech Debt work (0-100).</summary>
        public int TechDebtPercent { get; set; }

        /// <summary>Percentage of hours for R&D work (0-100).</summary>
        public int RAndDPercent { get; set; }
    }

    // ── Response DTOs ──

    /// <summary>Weekly plan response DTO with computed budget hours.</summary>
    public class WeeklyPlanResponse
    {
        public Guid Id { get; set; }
        public DateTime PlanningDate { get; set; }
        public DateTime WorkStartDate { get; set; }
        public DateTime WorkEndDate { get; set; }
        public WeekState State { get; set; }
        public int ClientFocusedPercent { get; set; }
        public int TechDebtPercent { get; set; }
        public int RAndDPercent { get; set; }
        public DateTime CreatedAt { get; set; }

        // Computed
        public int MemberCount { get; set; }
        public int TotalHours { get; set; }
        public int ClientFocusedBudgetHours { get; set; }
        public int TechDebtBudgetHours { get; set; }
        public int RAndDBudgetHours { get; set; }

        // Members and assignments (included when detail is needed)
        public List<WeeklyPlanMemberResponse>? Members { get; set; }
        public List<PlanAssignmentSummaryResponse>? Assignments { get; set; }
    }

    /// <summary>Team member info within a weekly plan context.</summary>
    public class WeeklyPlanMemberResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public MemberRole Role { get; set; }
        public bool IsPlanningDone { get; set; }
    }

    /// <summary>Summary of an assignment within a weekly plan.</summary>
    public class PlanAssignmentSummaryResponse
    {
        public Guid Id { get; set; }
        public Guid TeamMemberId { get; set; }
        public string TeamMemberName { get; set; } = string.Empty;
        public Guid BacklogItemId { get; set; }
        public string BacklogItemTitle { get; set; } = string.Empty;
        public BacklogCategory BacklogItemCategory { get; set; }
        public int CommittedHours { get; set; }
        public decimal HoursCompleted { get; set; }
        public AssignmentStatus Status { get; set; }
    }
}
