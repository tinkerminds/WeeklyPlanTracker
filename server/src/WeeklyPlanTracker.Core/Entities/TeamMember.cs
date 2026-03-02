using WeeklyPlanTracker.Core.Enums;

namespace WeeklyPlanTracker.Core.Entities
{
    /// <summary>
    /// Represents a team member who participates in weekly planning.
    /// Exactly one member must have the Lead role per team.
    /// The first person added is automatically the Lead.
    /// </summary>
    public class TeamMember
    {
        public Guid Id { get; set; }

        /// <summary>Display name of the team member.</summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>Role: Lead or Member. Exactly one Lead per team.</summary>
        public MemberRole Role { get; set; } = MemberRole.Member;

        /// <summary>Soft-delete flag. Inactive members are hidden but preserved.</summary>
        public bool IsActive { get; set; } = true;

        /// <summary>When this member was added to the team.</summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public ICollection<WeeklyPlanMember> WeeklyPlanMembers { get; set; } = new List<WeeklyPlanMember>();
        public ICollection<PlanAssignment> PlanAssignments { get; set; } = new List<PlanAssignment>();
    }
}
