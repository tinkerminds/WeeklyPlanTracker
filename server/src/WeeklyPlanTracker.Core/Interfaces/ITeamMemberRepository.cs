using WeeklyPlanTracker.Core.Entities;

namespace WeeklyPlanTracker.Core.Interfaces
{
    /// <summary>
    /// Repository for TeamMember entity operations.
    /// </summary>
    public interface ITeamMemberRepository : IRepository<TeamMember>
    {
        /// <summary>Gets all active (non-deleted) team members.</summary>
        Task<IEnumerable<TeamMember>> GetActiveAsync();

        /// <summary>Gets the current team lead.</summary>
        Task<TeamMember?> GetLeadAsync();

        /// <summary>Checks if any team members exist.</summary>
        Task<bool> AnyExistAsync();
    }
}
