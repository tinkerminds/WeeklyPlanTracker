using WeeklyPlanTracker.Core.Enums;

namespace WeeklyPlanTracker.API.DTOs
{
    // ── Request DTOs ──

    /// <summary>Request to create a new team member.</summary>
    public class CreateTeamMemberRequest
    {
        public string Name { get; set; } = string.Empty;
    }

    /// <summary>Request to update a team member's name.</summary>
    public class UpdateTeamMemberRequest
    {
        public string Name { get; set; } = string.Empty;
    }

    // ── Response DTOs ──

    /// <summary>Team member response with all fields.</summary>
    public class TeamMemberResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public MemberRole Role { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
