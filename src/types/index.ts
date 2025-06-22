// Core Rhajaina Application Types

export interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Chat {
  id: string;
  userId: string;
  title: string;
  context: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: string;
    requestId?: string;
  };
}

export interface ServiceHealth {
  serviceName: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  lastChecked: string;
  responseTime?: number;
  details?: Record<string, any>;
}

// Validation constants
export const PROJECT_STATUSES = ['active', 'archived', 'deleted'] as const;
export const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done'] as const;
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

export type ProjectStatus = typeof PROJECT_STATUSES[number];
export type TaskStatus = typeof TASK_STATUSES[number];
export type TaskPriority = typeof TASK_PRIORITIES[number];

// Validation helpers
export const isValidProjectStatus = (status: string): status is ProjectStatus =>
  PROJECT_STATUSES.includes(status as ProjectStatus);

export const isValidTaskStatus = (status: string): status is TaskStatus =>
  TASK_STATUSES.includes(status as TaskStatus);

export const isValidTaskPriority = (priority: string): priority is TaskPriority =>
  TASK_PRIORITIES.includes(priority as TaskPriority);
