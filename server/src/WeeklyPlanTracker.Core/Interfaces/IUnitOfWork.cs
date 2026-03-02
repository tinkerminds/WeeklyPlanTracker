namespace WeeklyPlanTracker.Core.Interfaces
{
    /// <summary>
    /// Unit of Work pattern to coordinate multiple repository operations
    /// within a single database transaction.
    /// </summary>
    public interface IUnitOfWork : IDisposable
    {
        ITeamMemberRepository TeamMembers { get; }
        IBacklogItemRepository BacklogItems { get; }
        IWeeklyPlanRepository WeeklyPlans { get; }
        IPlanAssignmentRepository PlanAssignments { get; }
        IProgressUpdateRepository ProgressUpdates { get; }

        /// <summary>Saves all changes made through the repositories.</summary>
        Task<int> SaveChangesAsync();
    }
}
