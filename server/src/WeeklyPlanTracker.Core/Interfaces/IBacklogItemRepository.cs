using WeeklyPlanTracker.Core.Entities;
using WeeklyPlanTracker.Core.Enums;

namespace WeeklyPlanTracker.Core.Interfaces
{
    /// <summary>
    /// Repository for BacklogItem entity operations.
    /// </summary>
    public interface IBacklogItemRepository : IRepository<BacklogItem>
    {
        /// <summary>Gets backlog items with optional filtering by category, search term, and archive status.</summary>
        Task<IEnumerable<BacklogItem>> GetFilteredAsync(
            BacklogCategory? category = null,
            string? searchTerm = null,
            bool includeArchived = false);

        /// <summary>Gets non-archived backlog items available for planning.</summary>
        Task<IEnumerable<BacklogItem>> GetAvailableForPlanningAsync();
    }
}
