using WeeklyPlanTracker.Core.Entities;

namespace WeeklyPlanTracker.Core.Interfaces
{
    /// <summary>
    /// Repository for ProgressUpdate entity operations.
    /// </summary>
    public interface IProgressUpdateRepository : IRepository<ProgressUpdate>
    {
        /// <summary>Gets all progress updates for a specific assignment, ordered by timestamp.</summary>
        Task<IEnumerable<ProgressUpdate>> GetByAssignmentAsync(Guid planAssignmentId);
    }
}
