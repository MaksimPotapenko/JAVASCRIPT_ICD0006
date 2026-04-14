export interface ApiMessage {
  message?: string;
  messages?: string[];
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  firstName: string;
  lastName: string;
}

export interface JwtResponse {
  token: string;
  refreshToken: string;
  firstName: string;
  lastName: string;
}

export interface RefreshTokenPayload {
  jwt: string;
  refreshToken: string;
}

export interface SessionState extends JwtResponse {
  email: string;
}

export interface TodoCategory {
  id: string;
  categoryName: string;
  categorySort: number;
  syncDt: string;
  tag?: string | null;
}

export interface TodoCategoryCreate {
  categoryName: string;
  categorySort: number;
  tag?: string | null;
}

export interface TodoPriority {
  id: string;
  priorityName: string;
  prioritySort: number;
  syncDt: string;
}

export interface TodoPriorityCreate {
  priorityName: string;
  prioritySort: number;
  syncDt: string;
}

export interface TodoTask {
  id: string;
  taskName: string;
  taskSort: number;
  createdDt: string;
  dueDt?: string | null;
  isCompleted: boolean;
  isArchived: boolean;
  todoCategoryId: string;
  todoPriorityId: string;
  syncDt: string;
}

export interface TodoTaskCreate {
  taskName: string;
  taskSort: number;
  createdDt: string;
  dueDt?: string | null;
  isCompleted: boolean;
  isArchived: boolean;
  todoCategoryId: string;
  todoPriorityId: string;
}
