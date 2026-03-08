export interface Project {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date | { toDate: () => Date };
}
