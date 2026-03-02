namespace WeeklyPlanTracker.Core.Enums
{
    /// <summary>
    /// States in the weekly plan lifecycle.
    /// Follows the state machine: Setup → PlanningOpen → Frozen → Completed.
    /// Setup and PlanningOpen can also transition back to no active week (cancelled).
    /// </summary>
    public enum WeekState
    {
        Setup = 0,
        PlanningOpen = 1,
        Frozen = 2,
        Completed = 3
    }
}
