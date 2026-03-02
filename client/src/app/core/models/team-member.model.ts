import { MemberRole } from '../enums/enums';

/// Represents a team member from the API.
export interface TeamMember {
    id: string;
    name: string;
    role: MemberRole;
    isActive: boolean;
    createdAt: string;
}
