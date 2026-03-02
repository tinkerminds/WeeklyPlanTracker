/// Enum representing the role of a team member.
export enum MemberRole {
    Member = 'Member',
    Lead = 'Lead'
}

/// Enum representing backlog item categories.
export enum BacklogCategory {
    ClientFocused = 'ClientFocused',
    TechDebt = 'TechDebt',
    RAndD = 'RAndD'
}

/// Enum representing weekly plan states.
export enum WeekState {
    Setup = 'Setup',
    PlanningOpen = 'PlanningOpen',
    Frozen = 'Frozen',
    Completed = 'Completed'
}

/// Enum representing assignment status.
export enum AssignmentStatus {
    NotStarted = 'NotStarted',
    InProgress = 'InProgress',
    Done = 'Done',
    Blocked = 'Blocked'
}
