using Microsoft.EntityFrameworkCore;
using WeeklyPlanTracker.Core.Entities;
using WeeklyPlanTracker.Core.Enums;
using WeeklyPlanTracker.Core.Interfaces;
using WeeklyPlanTracker.Infrastructure.Data;

namespace WeeklyPlanTracker.Infrastructure.Repositories
{
    public class BacklogItemRepository : Repository<BacklogItem>, IBacklogItemRepository
    {
        public BacklogItemRepository(AppDbContext context) : base(context) { }

        public async Task<IEnumerable<BacklogItem>> GetFilteredAsync(
            BacklogCategory? category = null,
            string? searchTerm = null,
            bool includeArchived = false)
        {
            var query = _dbSet.AsQueryable();

            if (!includeArchived)
                query = query.Where(i => !i.IsArchived);

            if (category.HasValue)
                query = query.Where(i => i.Category == category.Value);

            if (!string.IsNullOrWhiteSpace(searchTerm))
                query = query.Where(i => i.Title.Contains(searchTerm));

            return await query.OrderByDescending(i => i.CreatedAt).ToListAsync();
        }

        public async Task<IEnumerable<BacklogItem>> GetAvailableForPlanningAsync()
            => await _dbSet.Where(i => !i.IsArchived).OrderBy(i => i.Title).ToListAsync();
    }
}
