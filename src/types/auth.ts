export const USER_ROLES = [
  'SuperAdmin',
  'Admin',
  'MD',
  'GM',
  'CD',
  'PCM',
  'HRM',
  'PM',
  'CM',
  'Supervisor',
  'Staff',
  'HR',
  'Procurement',
  'SiteAdmin',
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  position: string;
  role: UserRole;
  status: UserStatus;
  assignedProjects: string[];
  createdAt: Date | { toDate: () => Date };
  photoURL?: string;
  isFirstUser: boolean;
}

export interface AppMetaConfig {
  firstUserRegistered: boolean;
  totalUsers: number;
  createdAt: Date | { toDate: () => Date };
}
