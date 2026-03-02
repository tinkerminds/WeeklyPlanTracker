namespace WeeklyPlanTracker.Core.Enums
{
    /// <summary>
    /// Status of a plan assignment (task progress).
    /// Members update this during the frozen phase.
    /// </summary>
    public enum AssignmentStatus
    {
        NotStarted = 0,
        InProgress = 1,
        Done = 2,
        Blocked = 3
    }
}
