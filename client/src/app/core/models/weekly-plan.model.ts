import { WeekState, BacklogCategory, MemberRole, AssignmentStatus } from '../enums/enums';

/// Represents a weekly plan from the API.
export interface WeeklyPlan {
    id: string;
    planningDate: string;
    workStartDate: string;
    workEndDate: string;
    state: WeekState;
    clientFocusedPercent: number;
    techDebtPercent: number;
    rAndDPercent: number;
    createdAt: string;
    memberCount: number;
    totalHours: number;
    clientFocusedBudgetHours: number;
    techDebtBudgetHours: number;
    rAndDBudgetHours: number;
    members?: WeeklyPlanMember[];
    assignments?: PlanAssignmentSummary[];
}

export interface WeeklyPlanMember {
    id: string;
    name: string;
    role: MemberRole;
    isPlanningDone: boolean;
}

export interface PlanAssignmentSummary {
    id: string;
    teamMemberId: string;
    teamMemberName: string;
    backlogItemId: string;
    backlogItemTitle: string;
    backlogItemCategory: BacklogCategory;
    committedHours: number;
    hoursCompleted: number;
    status: AssignmentStatus;
}
