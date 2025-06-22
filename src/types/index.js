/**
 * @typedef {Object} User
 * @property {string} id - Unique user identifier
 * @property {string} username - User's username
 * @property {string} email - User's email address
 * @property {string} [displayName] - User's display name
 * @property {Date} createdAt - Account creation date
 * @property {Date} updatedAt - Last update date
 */

/**
 * @typedef {Object} Project
 * @property {string} id - Unique project identifier
 * @property {string} name - Project name
 * @property {string} description - Project description
 * @property {string} ownerId - ID of the project owner
 * @property {ProjectStatus} status - Project status
 * @property {Date} createdAt - Project creation date
 * @property {Date} updatedAt - Last update date
 */

/**
 * @typedef {Object} Task
 * @property {string} id - Unique task identifier
 * @property {string} title - Task title
 * @property {string} [description] - Task description
 * @property {string} projectId - ID of the parent project
 * @property {string} [assigneeId] - ID of assigned user
 * @property {TaskStatus} status - Task status
 * @property {TaskPriority} priority - Task priority
 * @property {Date} [dueDate] - Task due date
 * @property {Date} createdAt - Task creation date
 * @property {Date} updatedAt - Last update date
 */

/**
 * @typedef {'active' | 'archived' | 'deleted'} ProjectStatus
 */

/**
 * @typedef {'todo' | 'in_progress' | 'review' | 'done'} TaskStatus
 */

/**
 * @typedef {'low' | 'medium' | 'high' | 'urgent'} TaskPriority
 */

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Whether the request was successful
 * @property {*} [data] - Response data
 * @property {string} [error] - Error message if unsuccessful
 * @property {string} [message] - Additional message
 */

/**
 * @typedef {Object} PaginationParams
 * @property {number} [page=1] - Page number
 * @property {number} [limit=10] - Items per page
 * @property {string} [sortBy] - Field to sort by
 * @property {'asc' | 'desc'} [sortOrder='asc'] - Sort order
 */

/**
 * @typedef {Object} PaginatedResponse
 * @property {*[]} items - Array of items
 * @property {number} total - Total number of items
 * @property {number} page - Current page
 * @property {number} limit - Items per page
 * @property {number} totalPages - Total number of pages
 */

module.exports = {
  // Export type names as constants for runtime validation
  PROJECT_STATUSES: ['active', 'archived', 'deleted'],
  TASK_STATUSES: ['todo', 'in_progress', 'review', 'done'],
  TASK_PRIORITIES: ['low', 'medium', 'high', 'urgent'],
  
  // Validation helpers
  isValidProjectStatus: (status) => module.exports.PROJECT_STATUSES.includes(status),
  isValidTaskStatus: (status) => module.exports.TASK_STATUSES.includes(status),
  isValidTaskPriority: (priority) => module.exports.TASK_PRIORITIES.includes(priority),
};
