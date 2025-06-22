import { jest, beforeAll, afterEach } from '@jest/globals';

// Mock console methods to reduce noise in tests
beforeAll(() => {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
});

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Test utilities
export const createMockUser = (overrides = {}) => ({
  id: 'mock-user-id',
  username: 'testuser',
  email: 'test@example.com',
  password: 'hashedpassword',
  role: 'USER',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createMockMessage = (overrides = {}) => ({
  id: 'mock-message-id',
  content: 'Test message',
  type: 'TEXT',
  senderId: 'mock-user-id',
  timestamp: new Date(),
  isEdited: false,
  ...overrides
});

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));