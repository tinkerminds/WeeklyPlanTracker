using Microsoft.EntityFrameworkCore;
using WeeklyPlanTracker.Core.Entities;
using WeeklyPlanTracker.Core.Enums;
using WeeklyPlanTracker.Core.Interfaces;
using WeeklyPlanTracker.Infrastructure.Data;

namespace WeeklyPlanTracker.Infrastructure.Repositories
{
    public class WeeklyPlanRepository : Repository<WeeklyPlan>, IWeeklyPlanRepository
    {
        public WeeklyPlanRepository(AppDbContext context) : base(context) { }

        public async Task<WeeklyPlan?> GetCurrentAsync()
        {
            return await _dbSet
                .Include(wp => wp.WeeklyPlanMembers)
                    .ThenInclude(wpm => wpm.TeamMember)
                .Include(wp => wp.PlanAssignments)
                    .ThenInclude(pa => pa.BacklogItem)
                .Include(wp => wp.PlanAssignments)
                    .ThenInclude(pa => pa.TeamMember)
                .FirstOrDefaultAsync(wp => wp.State != WeekState.Completed);
        }

        public async Task<IEnumerable<WeeklyPlan>> GetCompletedAsync()
        {
            return await _dbSet
                .Include(wp => wp.WeeklyPlanMembers)
                    .ThenInclude(wpm => wpm.TeamMember)
                .Include(wp => wp.PlanAssignments)
                    .ThenInclude(pa => pa.BacklogItem)
                .Where(wp => wp.State == WeekState.Completed)
                .OrderByDescending(wp => wp.PlanningDate)
                .ToListAsync();
        }

        public async Task<WeeklyPlan?> GetWithDetailsAsync(Guid id)
        {
            return await _dbSet
                .Include(wp => wp.WeeklyPlanMembers)
                    .ThenInclude(wpm => wpm.TeamMember)
                .Include(wp => wp.PlanAssignments)
                    .ThenInclude(pa => pa.BacklogItem)
                .Include(wp => wp.PlanAssignments)
                    .ThenInclude(pa => pa.TeamMember)
                .Include(wp => wp.PlanAssignments)
                    .ThenInclude(pa => pa.ProgressUpdates)
                .FirstOrDefaultAsync(wp => wp.Id == id);
        }
    }
}
