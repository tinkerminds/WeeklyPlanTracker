using Microsoft.EntityFrameworkCore;
using WeeklyPlanTracker.Core.Entities;
using WeeklyPlanTracker.Core.Interfaces;
using WeeklyPlanTracker.Infrastructure.Data;

namespace WeeklyPlanTracker.Infrastructure.Repositories
{
    public class PlanAssignmentRepository : Repository<PlanAssignment>, IPlanAssignmentRepository
    {
        public PlanAssignmentRepository(AppDbContext context) : base(context) { }

        public async Task<IEnumerable<PlanAssignment>> GetByWeekAndMemberAsync(Guid weeklyPlanId, Guid teamMemberId)
        {
            return await _dbSet
                .Include(pa => pa.BacklogItem)
                .Where(pa => pa.WeeklyPlanId == weeklyPlanId && pa.TeamMemberId == teamMemberId)
                .OrderBy(pa => pa.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<PlanAssignment>> GetByWeekWithDetailsAsync(Guid weeklyPlanId)
        {
            return await _dbSet
                .Include(pa => pa.BacklogItem)
                .Include(pa => pa.TeamMember)
                .Include(pa => pa.ProgressUpdates)
                .Where(pa => pa.WeeklyPlanId == weeklyPlanId)
                .ToListAsync();
        }

        public async Task<PlanAssignment?> GetWithDetailsAsync(Guid id)
        {
            return await _dbSet
                .Include(pa => pa.BacklogItem)
                .Include(pa => pa.TeamMember)
                .Include(pa => pa.ProgressUpdates.OrderByDescending(pu => pu.Timestamp))
                .FirstOrDefaultAsync(pa => pa.Id == id);
        }
    }
}
