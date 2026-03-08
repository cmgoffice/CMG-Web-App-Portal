export interface ActivityLog {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: string;
  details?: string;
  timestamp: Date | { toDate: () => Date };
}
