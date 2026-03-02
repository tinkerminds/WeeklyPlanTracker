using WeeklyPlanTracker.Core.Entities;

namespace WeeklyPlanTracker.Core.Interfaces
{
    /// <summary>
    /// Repository for PlanAssignment entity operations.
    /// </summary>
    public interface IPlanAssignmentRepository : IRepository<PlanAssignment>
    {
        /// <summary>Gets all assignments for a specific week and member.</summary>
        Task<IEnumerable<PlanAssignment>> GetByWeekAndMemberAsync(Guid weeklyPlanId, Guid teamMemberId);

        /// <summary>Gets all assignments for a specific weekly plan with related data.</summary>
        Task<IEnumerable<PlanAssignment>> GetByWeekWithDetailsAsync(Guid weeklyPlanId);

        /// <summary>Gets a specific assignment with its backlog item details.</summary>
        Task<PlanAssignment?> GetWithDetailsAsync(Guid id);
    }
}
