using WeeklyPlanTracker.Core.Entities;

namespace WeeklyPlanTracker.Core.Interfaces
{
    /// <summary>
    /// Repository for WeeklyPlan entity operations.
    /// </summary>
    public interface IWeeklyPlanRepository : IRepository<WeeklyPlan>
    {
        /// <summary>Gets the currently active (non-completed) weekly plan with all related data.</summary>
        Task<WeeklyPlan?> GetCurrentAsync();

        /// <summary>Gets all completed weekly plans for the Past Weeks view.</summary>
        Task<IEnumerable<WeeklyPlan>> GetCompletedAsync();

        /// <summary>Gets a weekly plan with all its members and assignments loaded.</summary>
        Task<WeeklyPlan?> GetWithDetailsAsync(Guid id);
    }
}
