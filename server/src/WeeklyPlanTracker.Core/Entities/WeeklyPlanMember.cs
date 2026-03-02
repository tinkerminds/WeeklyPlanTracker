namespace WeeklyPlanTracker.Core.Entities
{
    /// <summary>
    /// Join table linking a WeeklyPlan to the TeamMembers participating that week.
    /// A member is selected by the Lead during the Setup phase.
    /// </summary>
    public class WeeklyPlanMember
    {
        public Guid WeeklyPlanId { get; set; }
        public WeeklyPlan WeeklyPlan { get; set; } = null!;

        public Guid TeamMemberId { get; set; }
        public TeamMember TeamMember { get; set; } = null!;
    }
}
