using WeeklyPlanTracker.Core.Interfaces;
using WeeklyPlanTracker.Infrastructure.Data;

namespace WeeklyPlanTracker.Infrastructure.Repositories
{
    /// <summary>
    /// Unit of Work implementation coordinating all repositories
    /// under a single EF Core DbContext transaction.
    /// </summary>
    public class UnitOfWork : IUnitOfWork
    {
        private readonly AppDbContext _context;

        public ITeamMemberRepository TeamMembers { get; }
        public IBacklogItemRepository BacklogItems { get; }
        public IWeeklyPlanRepository WeeklyPlans { get; }
        public IPlanAssignmentRepository PlanAssignments { get; }
        public IProgressUpdateRepository ProgressUpdates { get; }

        public UnitOfWork(AppDbContext context)
        {
            _context = context;
            TeamMembers = new TeamMemberRepository(context);
            BacklogItems = new BacklogItemRepository(context);
            WeeklyPlans = new WeeklyPlanRepository(context);
            PlanAssignments = new PlanAssignmentRepository(context);
            ProgressUpdates = new ProgressUpdateRepository(context);
        }

        public async Task<int> SaveChangesAsync()
            => await _context.SaveChangesAsync();

        public void Dispose()
            => _context.Dispose();
    }
}
