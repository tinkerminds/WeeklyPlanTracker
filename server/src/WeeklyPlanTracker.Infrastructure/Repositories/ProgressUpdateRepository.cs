using Microsoft.EntityFrameworkCore;
using WeeklyPlanTracker.Core.Entities;
using WeeklyPlanTracker.Core.Interfaces;
using WeeklyPlanTracker.Infrastructure.Data;

namespace WeeklyPlanTracker.Infrastructure.Repositories
{
    public class ProgressUpdateRepository : Repository<ProgressUpdate>, IProgressUpdateRepository
    {
        public ProgressUpdateRepository(AppDbContext context) : base(context) { }

        public async Task<IEnumerable<ProgressUpdate>> GetByAssignmentAsync(Guid planAssignmentId)
        {
            return await _dbSet
                .Where(pu => pu.PlanAssignmentId == planAssignmentId)
                .OrderByDescending(pu => pu.Timestamp)
                .ToListAsync();
        }
    }
}
