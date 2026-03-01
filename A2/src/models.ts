export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type Priority = 'low' | 'medium' | 'high';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  /** e.g. every 2 weeks */
  interval: number;
  /** ISO date (YYYY-MM-DD). If present, recurrence won't generate after this date. */
  endDate?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  /** ISO date (YYYY-MM-DD) */
  dueDate: string;
  tags: string[];

  /** Optional category assignment */
  categoryId?: string;

  /** Task id(s) that must be done before this can be done */
  dependencies: string[];

  /** Recurrence rule for generating next occurrence */
  recurrence?: RecurrenceRule;
  /** If generated from a recurring series, references original task */
  seriesId?: string;

  createdAt: number;
  updatedAt: number;
}

export interface Category {
  id: string;
  name: string;
  /** Enforces allowed priority levels for tasks in this category */
  allowedPriorities: Priority[];
  createdAt: number;
  updatedAt: number;
}

export interface TaskStatistics {
  total: number;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<Priority, number>;
  overdue: number;
  dueToday: number;
  completionRate: number; // 0..1
}

export type SortField = 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'status' | 'title';
export type SortOrder = 'asc' | 'desc';

export interface TaskFilters {
  status?: TaskStatus;
  priority?: Priority;
  tag?: string;
  categoryId?: string;
  overdue?: boolean;
}
