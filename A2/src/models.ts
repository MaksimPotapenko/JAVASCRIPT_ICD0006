export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string;   //YYYY-MM-DD or ""
  tags: string[];
}

export type SortField = 'dueDate' | 'priority' | 'status' | 'title';
export type SortOrder = 'asc' | 'desc';