import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

// Global test timeout
jest.setTimeout(30000);

// Mock database connection
const mockSequelize = {
  authenticate: jest.fn().mockResolvedValue(undefined),
  sync: jest.fn().mockResolvedValue(undefined),
  transaction: jest.fn().mockImplementation((fn) => fn({
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined)
  })),
  close: jest.fn().mockResolvedValue(undefined),
  query: jest.fn()
};

// Mock Sequelize instance
jest.mock('../src/config/database', () => ({
  sequelize: mockSequelize,
  connectDB: jest.fn().mockResolvedValue(undefined)
}));

// Mock Redis
jest.mock('../src/config/redis', () => ({
  redisClient: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    disconnect: jest.fn()
  }
}));

// Mock logger to avoid console spam in tests
jest.mock('../src/config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn()
  }
}));

// Mock external services
jest.mock('../src/services/PaymentService');
jest.mock('../src/services/EmailService');
jest.mock('../src/services/ShippingService');

// Global setup and teardown
beforeAll(async () => {
  // No actual DB connection in tests
});

afterAll(async () => {
  // Cleanup
  jest.clearAllMocks();
});

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
});

afterEach(() => {
  // Additional cleanup if needed
}); 