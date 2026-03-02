using Microsoft.EntityFrameworkCore;
using WeeklyPlanTracker.Core.Entities;

namespace WeeklyPlanTracker.Infrastructure.Data
{
    /// <summary>
    /// EF Core database context for the Weekly Plan Tracker application.
    /// Manages all 6 entities and applies fluent configurations.
    /// </summary>
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<TeamMember> TeamMembers => Set<TeamMember>();
        public DbSet<BacklogItem> BacklogItems => Set<BacklogItem>();
        public DbSet<WeeklyPlan> WeeklyPlans => Set<WeeklyPlan>();
        public DbSet<WeeklyPlanMember> WeeklyPlanMembers => Set<WeeklyPlanMember>();
        public DbSet<PlanAssignment> PlanAssignments => Set<PlanAssignment>();
        public DbSet<ProgressUpdate> ProgressUpdates => Set<ProgressUpdate>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Apply all entity configurations from this assembly
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        }
    }
}
