# Dagangan API Server

A comprehensive e-commerce API server built with TypeScript, Express.js, Sequelize, and PostgreSQL following the **Service-Repository Pattern** for optimal separation of concerns.

## 🚀 Features

- **TypeScript**: Full type safety and modern JavaScript features
- **Express.js**: Fast, unopinionated web framework
- **Service-Repository Pattern**: Clean architecture with separated concerns
- **Sequelize**: Object-Relational Mapping for PostgreSQL
- **Zod**: Schema validation in controllers (not middleware)
- **JWT Authentication**: Secure user authentication and authorization
- **Role-based Access Control**: Support for buyer, seller, and admin roles
- **Rate Limiting**: Built-in API rate limiting for security
- **Security**: Helmet.js for security headers, CORS configuration
- **Logging**: Winston for comprehensive logging
- **API Documentation**: Swagger/OpenAPI documentation
- **Testing**: Jest for unit and integration testing
- **Code Quality**: ESLint + Prettier for code formatting

## 🏗️ Architecture

The application follows the **Service-Repository Pattern** with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Controllers   │───▶│    Services     │───▶│  Repositories   │───▶│    Database     │
│                 │    │                 │    │                 │    │                 │
│ • HTTP handling │    │ • Business      │    │ • Data access   │    │ • PostgreSQL    │
│ • Validation    │    │   logic         │    │ • ORM queries   │    │ • Sequelize     │
│ • Auth checks   │    │ • Transactions  │    │ • Caching       │    │ • Sequelize     │
│ • Response      │    │ • External APIs │    │ • Optimization  │    │                 │
│   formatting    │    │                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Layer Responsibilities**

#### **Controllers** (`/controllers`)
- Handle HTTP requests and responses
- Validate input using Zod schemas (no middleware validation)
- Call appropriate service methods
- Transform service responses to HTTP format
- Handle authentication and authorization checks

#### **Services** (`/services`)
- Implement business logic and rules
- Orchestrate operations across multiple repositories
- Handle database transactions for complex operations
- Transform data between layers
- Integrate with external APIs (payments, shipping)

#### **Repositories** (`/repositories`)
- Abstract database operations from business logic
- Provide clean interfaces for data access
- Handle Sequelize ORM interactions and relationships
- Implement query optimization and caching
- Ensure data consistency and integrity

## 📋 Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 12
- Redis (optional, for caching)
- npm >= 8.0.0

## 🛠️ Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd dagangan/server
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment setup**
```bash
cp env.example .env
```
Edit `.env` with your configuration values.

4. **Database setup**
```bash
# Create database
createdb dagangan_db

# Run migrations (when implemented)
npm run db:migrate

# Seed database (when implemented)
npm run db:seed
```

## 🏃‍♂️ Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Test specific layer
npm run test:unit          # Services and repositories
npm run test:integration   # Controllers and API endpoints
```

## 📁 Project Structure

```
src/
├── config/           # Configuration files
│   ├── index.ts     # Main config with environment validation
│   ├── database.ts  # Database connection setup
│   └── logger.ts    # Winston logger configuration
├── controllers/      # HTTP request/response handlers
│   ├── authController.ts
│   ├── userController.ts
│   └── productController.ts
├── services/         # Business logic layer
│   ├── authService.ts
│   ├── userService.ts
│   └── productService.ts
├── repositories/     # Data access layer
│   ├── userRepository.ts
│   ├── productRepository.ts
│   └── baseRepository.ts
├── middleware/       # Express middleware (auth, errors)
├── models/          # Sequelize models
├── routes/          # API route definitions
├── types/           # TypeScript type definitions
├── validators/      # Zod validation schemas
├── utils/           # Utility functions
└── app.ts          # Main application file

tests/
├── unit/           # Unit tests (services, repositories)
├── integration/    # Integration tests (controllers, API)
└── setup.ts       # Test setup configuration
```

## 🔄 Request Flow

1. **Route** → Auth middleware (if required)
2. **Controller** → Input validation (Zod)
3. **Controller** → Service method call
4. **Service** → Business logic + Repository calls
5. **Repository** → Database operations
6. **Response** flows back through the layers

## 🔧 Environment Variables

See `env.example` for all available configuration options.

### Required Variables
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`: Database credentials
- `JWT_SECRET`, `JWT_REFRESH_SECRET`: JWT signing secrets (min 32 characters)

### Optional Variables
- `REDIS_HOST`, `REDIS_PORT`: Redis configuration for caching
- `MIDTRANS_SERVER_KEY`: Payment gateway configuration
- `RAJAONGKIR_API_KEY`: Shipping cost calculation

## 📖 API Documentation

When running in development mode, visit:
- **Swagger UI**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/healthz

## 🗃️ Database Schema

The application uses the following main entities:
- **Users**: User accounts with role-based access
- **Products**: Product catalog with categories
- **Orders**: Order management and tracking
- **Payments**: Payment processing with Midtrans
- **Cart & Wishlist**: Shopping cart and wishlist functionality
- **Reviews**: Product reviews and ratings
- **Notifications**: User notifications system

## 🔐 Authentication & Authorization

- **JWT-based authentication** with access and refresh tokens
- **Role-based access control** (buyer, seller, admin)
- **Protected routes** with middleware validation
- **Password hashing** with bcryptjs

## ✅ Validation Strategy

- **Input validation** happens in controllers using Zod schemas
- **No validation middleware** on routes for better flexibility
- **Business rules validation** in services layer
- **Database constraints** as final safety net

## 🚦 API Rate Limiting

- Default: 100 requests per 15 minutes per IP
- Configurable via environment variables
- Different limits can be applied per route

## 📝 Code Quality

```bash
# Linting
npm run lint
npm run lint:fix

# Code formatting
npm run format
```

## 🧪 Testing Strategy

### **Unit Tests**
- **Services**: Mock repositories, test business logic
- **Repositories**: Test with in-memory database
- **Utils**: Test individual functions

### **Integration Tests**
- **Controllers**: Test full request/response cycle
- **API Endpoints**: Test with test database
- **External APIs**: Mock third-party services

### **Coverage Goals**
- Services: >90% coverage
- Repositories: >85% coverage
- Controllers: >80% coverage
- Overall: >85% coverage

## 🚀 Deployment

### Docker (Future)
```bash
# Build image
docker build -t dagangan-api .

# Run container
docker run -p 3000:3000 dagangan-api
```

### Manual Deployment
1. Build the application: `npm run build`
2. Set environment variables for production
3. Run database migrations: `npm run db:migrate`
4. Start the server: `npm start`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the service-repository pattern
4. Follow the coding standards (ESLint + Prettier)
5. Write tests for all layers (controller, service, repository)
6. Ensure validation is in controllers, not middleware
7. Submit a pull request

### **Development Guidelines**

#### **Controller Guidelines**
- Validate all inputs using Zod schemas
- Keep controllers thin - delegate to services
- Handle HTTP-specific concerns only
- Always return appropriate HTTP status codes

#### **Service Guidelines**
- Implement business logic and rules
- Use repositories for data access
- Handle transactions for complex operations
- Transform data between layers

#### **Repository Guidelines**
- Provide clean data access interfaces
- Handle database-specific operations
- Implement caching where appropriate
- Keep repositories focused on single entities

## 📋 TODO

### **Core Implementation**
- [x] Set up service-repository architecture
- [x] Implement authentication system
- [ ] Create user repositories and services
- [ ] Implement product management
- [ ] Add order processing system

### **Features**
- [ ] Shopping cart functionality
- [ ] Payment integration (Midtrans)
- [ ] Shipping cost calculation
- [ ] Product reviews and ratings
- [ ] Admin dashboard endpoints

### **Infrastructure**
- [ ] Add Docker configuration
- [ ] Implement caching with Redis
- [ ] Set up CI/CD pipeline
- [ ] Add comprehensive logging
- [ ] Performance monitoring

## 📄 License

MIT License - see LICENSE file for details 