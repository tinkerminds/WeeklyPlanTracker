using Microsoft.EntityFrameworkCore;
using WeeklyPlanTracker.Core.Entities;
using WeeklyPlanTracker.Core.Enums;
using WeeklyPlanTracker.Core.Interfaces;
using WeeklyPlanTracker.Infrastructure.Data;

namespace WeeklyPlanTracker.Infrastructure.Repositories
{
    public class TeamMemberRepository : Repository<TeamMember>, ITeamMemberRepository
    {
        public TeamMemberRepository(AppDbContext context) : base(context) { }

        public async Task<IEnumerable<TeamMember>> GetActiveAsync()
            => await _dbSet.Where(m => m.IsActive).OrderBy(m => m.CreatedAt).ToListAsync();

        public async Task<TeamMember?> GetLeadAsync()
            => await _dbSet.FirstOrDefaultAsync(m => m.IsActive && m.Role == MemberRole.Lead);

        public async Task<bool> AnyExistAsync()
            => await _dbSet.AnyAsync(m => m.IsActive);
    }
}
