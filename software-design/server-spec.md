# Dagangan Backend Server Specification

## 1. Cover & Administrative

 **Project** : Dagangan Backend API  **Version** : 1.1.0  **Date** : 2025-01-20  **Authors** : Backend Team

 **Revision History** :

| Version | Date       | Description                           | Author       |
| ------- | ---------- | ------------------------------------- | ------------ |
| 1.0.0   | 2025-06-10 | Initial draft                         | Backend Team |
| 1.1.0   | 2025-01-20 | Added Service-Repository pattern      | Backend Team |

## 2. Table of Contents

1. Introduction
2. Glossary & Acronyms
3. Architecture Overview
4. Tech Stack
5. Folder Structure & Coding Conventions
6. Database Design
7. Authentication & Authorization
8. API Design
9. Business Logic Layer (Service-Repository Pattern)
10. 3rd-Party Integrations
11. Error Handling & Logging
12. Testing Strategy
13. Security Considerations
14. Performance & Scalability
15. Availability & Resilience
16. PWA & Offline Support
17. Accessibility & Localization
18. Observability & Monitoring
19. Deployment & CI/CD
20. Maintenance & Support
21. Appendices

## 3. Introduction

 **Purpose & Scope** : This document defines the backend API for Dagangan, a scalable, secure e-commerce platform integrating payments, shipping rates, and social login. The architecture follows the service-repository pattern for optimal separation of concerns, testability, and maintainability.

 **Target Audience** : Backend developers, QA, DevOps, and security teams.

## 4. Glossary & Acronyms

* **API** : Application Programming Interface
* **JWT** : JSON Web Token
* **ORM** : Object-Relational Mapping
* **PWA** : Progressive Web App
* **PG** : PostgreSQL
* **Repository Pattern** : Data access abstraction layer
* **Service Layer** : Business logic layer

## 5. Architecture Overview

* **Context** : Single backend service with Express, exposing RESTful endpoints to a React/PWA frontend following the service-repository pattern.
* **Layers** :
  * **Presentation Layer** : Controllers (HTTP request/response handling)
  * **Business Logic Layer** : Services (business rules and orchestration)
  * **Data Access Layer** : Repositories (database operations abstraction)
  * **Data Layer** : PostgreSQL with Sequelize ORM
* **Components** :
  * **API Server** : Node.js + Express
  * **DB** : PostgreSQL (Sequelize ORM)
  * **Cache** : Redis (session, rate-limiting)
  * **Load Balancer** : Kubernetes or NGINX
  * **CI/CD** : GitHub Actions

## 6. Tech Stack

| Layer      | Technology                 |
| ---------- | -------------------------- |
| Language   | TypeScript                 |
| Runtime    | Node.js (v18+)             |
| Framework  | Express                    |
| Database   | PostgreSQL + Sequelize     |
| Validation | Zod (in controllers)       |
| Auth       | JWT, bcrypt, Google OAuth2 |
| Testing    | Jest, supertest            |
| Docs       | Swagger (OpenAPI)          |
| Logging    | Winston                    |
| Payment    | Midtrans API               |
| Shipping   | RajaOngkir API             |
| Container  | Docker                     |

## 7. Folder Structure & Coding Conventions

```
src/
  controllers/        -- HTTP request/response handling + validation
  services/           -- Business logic layer
  repositories/       -- Data access layer (database operations)
  models/             -- Sequelize models
  routes/             -- Express route definitions
  middleware/         -- auth, error handlers (no validation)
  types/              -- TypeScript type definitions
  validators/         -- Zod validation schemas
  utils/
    logger.ts         -- Winston logger setup
  config/
    index.ts          -- configuration loader
  tests/
    unit/             -- Jest unit tests
    integration/      -- supertest integration tests
  logs/               -- application log files
  index.ts            -- application entry point
```

### **Architectural Layers**

#### **Controllers Layer**
- Handle HTTP requests and responses
- Perform input validation using Zod schemas
- Call appropriate services
- Transform service responses to HTTP responses
- Handle errors and status codes

#### **Services Layer**
- Contain business logic and rules
- Orchestrate operations across multiple repositories
- Handle transactions and complex business workflows
- Transform data between layers
- Call external APIs when needed

#### **Repositories Layer**
- Abstract database operations
- Provide clean interfaces for data access
- Handle Sequelize queries and relationships
- Implement caching strategies
- Ensure data consistency

### **Data Flow Pattern**
```
HTTP Request → Controller → Service → Repository → Database
HTTP Response ← Controller ← Service ← Repository ← Database
```

* **Naming** : camelCase for variables, PascalCase for classes.
* **Linting** : ESLint + Prettier rules enforced in CI.

## 8. Database Design

* See ERD in Appendix A.
* **Migrations** : Sequelize CLI; each table has `created_at` and `updated_at`.
* **Seed Data** : initial categories, sample products.

## 9. Authentication & Authorization

* **Signup/Login** : Email/password (bcrypt), JWT (access & refresh tokens).
* **Google OAuth2** : passport-google-oauth20; tokens mapped to users.
* **RBAC** : Middleware checks `role` claim in JWT.

## 10. API Design

 **Base URL** : `/api/v1`

### **Request/Response Flow**
1. **Route** receives request and applies auth middleware
2. **Controller** validates input with Zod schemas
3. **Controller** calls appropriate **Service** method
4. **Service** implements business logic and calls **Repository** methods
5. **Repository** performs database operations
6. **Response** flows back through the layers

### Public Endpoints (no authentication)

| Method | Path                | Description                                      |
| ------ | ------------------- | ------------------------------------------------ |
| GET    | /pub/home           | Fetch homepage data (featured products, banners) |
| GET    | /pub/products       | List all products (with pagination, filters)     |
| GET    | /pub/products/:id   | Get product details by ID                        |
| GET    | /pub/categories     | List all categories                              |
| GET    | /pub/categories/:id | Get category details by ID                       |

### Authentication

| Method | Path                | Description                        |
| ------ | ------------------- | ---------------------------------- |
| POST   | /auth/signup        | Register a new user                |
| POST   | /auth/login         | Login with email/password          |
| POST   | /auth/google        | Login / register via Google OAuth2 |
| POST   | /auth/token/refresh | Refresh access token               |
| POST   | /auth/logout        | Revoke refresh token               |

### Users & Profiles

| Method | Path       | Description                 |
| ------ | ---------- | --------------------------- |
| GET    | /users/me  | Get current user profile    |
| PUT    | /users/me  | Update current user profile |
| GET    | /users/:id | (Admin) Get any user by ID  |

### Addresses

| Method | Path           | Description                         |
| ------ | -------------- | ----------------------------------- |
| GET    | /addresses     | List all addresses for current user |
| POST   | /addresses     | Create a new address                |
| GET    | /addresses/:id | Get a specific address              |
| PUT    | /addresses/:id | Update an address                   |
| DELETE | /addresses/:id | Delete an address                   |

### Products

| Method | Path          | Description                             |
| ------ | ------------- | --------------------------------------- |
| GET    | /products     | (Auth) List products for seller / admin |
| POST   | /products     | (Seller) Create a new product           |
| GET    | /products/:id | Get product details                     |
| PUT    | /products/:id | (Seller) Update a product               |
| DELETE | /products/:id | (Seller) Delete a product               |

### Categories

| Method | Path            | Description               |
| ------ | --------------- | ------------------------- |
| GET    | /categories     | List all categories       |
| POST   | /categories     | (Admin) Create a category |
| GET    | /categories/:id | Get category details      |
| PUT    | /categories/:id | (Admin) Update a category |
| DELETE | /categories/:id | (Admin) Delete a category |

### Cart

| Method | Path            | Description               |
| ------ | --------------- | ------------------------- |
| GET    | /cart           | Get current user cart     |
| POST   | /cart/items     | Add an item to cart       |
| PUT    | /cart/items/:id | Update cart item quantity |
| DELETE | /cart/items/:id | Remove item from cart     |

### Coupons

| Method | Path              | Description                                |
| ------ | ----------------- | ------------------------------------------ |
| GET    | /coupons          | (Admin) List all coupons                   |
| POST   | /coupons          | (Admin) Create a coupon                    |
| GET    | /coupons/:code    | Validate coupon by code                    |
| POST   | /coupons/validate | Validate coupon against cart/order summary |

### Orders

| Method | Path             | Description                  |
| ------ | ---------------- | ---------------------------- |
| POST   | /orders/checkout | Create an order (checkout)   |
| GET    | /orders          | List orders for current user |
| GET    | /orders/:id      | Get order details            |

### Payments & Callbacks

| Method | Path                        | Description                             |
| ------ | --------------------------- | --------------------------------------- |
| POST   | /payments                   | Initiate payment (Midtrans integration) |
| POST   | /payments/midtrans/callback | Handle Midtrans payment notifications   |

### Shipments

| Method | Path                | Description                      |
| ------ | ------------------- | -------------------------------- |
| GET    | /shipments/:orderId | Get shipment status for an order |

### Reviews

| Method | Path                  | Description                   |
| ------ | --------------------- | ----------------------------- |
| GET    | /products/:id/reviews | List reviews for a product    |
| POST   | /products/:id/reviews | Create a review for a product |

### Wishlists

| Method | Path                 | Description               |
| ------ | -------------------- | ------------------------- |
| GET    | /wishlists           | Get current user wishlist |
| POST   | /wishlists/items     | Add item to wishlist      |
| DELETE | /wishlists/items/:id | Remove item from wishlist |

### Notifications

| Method | Path                    | Description                         |
| ------ | ----------------------- | ----------------------------------- |
| GET    | /notifications          | List notifications for current user |
| PUT    | /notifications/:id/read | Mark notification as read           |

### Health & Docs

| Method | Path     | Description              |
| ------ | -------- | ------------------------ |
| GET    | /healthz | Health check endpoint    |
| GET    | /docs    | Swagger UI documentation |

## 11. Business Logic Layer (Service-Repository Pattern)

### **Service Layer Responsibilities**
- Implement business rules and validation
- Orchestrate complex operations across multiple repositories
- Handle transactions for atomic operations
- Transform data between presentation and data layers
- Integrate with external services (payments, shipping)
- Implement caching strategies

### **Repository Layer Responsibilities**
- Abstract database operations from business logic
- Provide clean, testable interfaces for data access
- Handle Sequelize ORM interactions
- Implement query optimization
- Manage relationships and eager loading
- Handle database-specific error handling

### **Example Architecture**

```typescript
// Controller
class UserController {
  static async getProfile(req: AuthenticatedRequest, res: Response) {
    // 1. Validate input
    const userId = validateUserId(req.user.userId);
    
    // 2. Call service
    const user = await UserService.getUserProfile(userId);
    
    // 3. Return response
    res.json(user);
  }
}

// Service
class UserService {
  static async getUserProfile(userId: number) {
    // Business logic
    const user = await UserRepository.findByIdWithProfile(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Transform data
    return this.transformUserResponse(user);
  }
}

// Repository
class UserRepository {
  static async findByIdWithProfile(userId: number) {
    return User.findByPk(userId, {
      include: [{ model: SellerProfile, as: 'sellerProfile' }]
    });
  }
}
```

### **Transaction Handling**
- Services manage transactions for complex operations
- Repositories accept optional transaction parameter
- Checkout process uses transactions for atomicity

## 12. 3rd-Party Integrations

* **Midtrans** : server-key via env; create transaction, handle callbacks.
* **RajaOngkir** : API-key via env; endpoints for provinces, cities, costs.
* **Google OAuth2** : client-id/secret via env; callback endpoint maps user data.

## 13. Error Handling & Logging

* **Middleware** : Central `errorHandler(err, req, res, next)` catches and formats errors.
* **Error Format** : `{ code: string, message: string, details?: any }` for consistent client responses.
* **Validation** : Handled in controllers using Zod schemas, not in route middleware.
* **Logging** : Winston logger writes structured JSON logs to console and rotates files in `logs/` folder.
* **Usage** : Import `logger` from `config/logger.ts` in controllers/services to log at appropriate levels (info, warn, error).

## 14. Testing Strategy

* **Unit Tests** : Jest for services, repositories, and utils.
* **Integration Tests** : supertest on controllers using test DB.
* **Repository Tests** : Test data access layer separately.
* **Service Tests** : Mock repositories to test business logic.
* **Mocks** : nock for external API stubbing.

## 15. Security Considerations

* **Validation** : Zod schemas in controllers for all inputs.
* **Rate Limiting** : express-rate-limit on auth endpoints.
* **Headers** : helmet for secure HTTP headers.
* **CORS** : restricted origins.

## 16. Performance & Scalability

* **Performance** :
  * P95 page-load via API <200ms.
  * DB indexing on common filters.
  * Repository-level caching strategies.
* **Scalability** :
  * Stateless server behind LB.
  * Docker containers for horizontal pods.
  * Service layer enables easy horizontal scaling.

## 17. Availability & Resilience

* **Uptime** : 99.9% SLA.
* **Health Checks** : `/healthz` endpoint.
* **Self-healing** : Kubernetes liveness & readiness probes.

## 18. PWA & Offline Support

* **Service Worker** : Caches catalog and product data.
* **Manifest** : "Add to Home Screen" support.

## 19. Accessibility & Localization

* **WCAG 2.1 AA** compliance in API error messages.
* **i18n** middleware: EN and ID translations for user-facing strings.

## 20. Observability & Monitoring

* **Logging** : ELK stack for centralized logs.
* **Metrics** : Prometheus metrics (via prom-client) & Grafana dashboards.
* **Tracing** : OpenTelemetry basic traces on API calls.

## 21. Deployment & CI/CD

* **Dockerfile** and `docker-compose.yml`.
* **GitHub Actions** : build, lint, test, push image.
* **Migrations** : run `sequelize db:migrate` on deploy.

## 22. Maintenance & Support

* **Runbook** : How to rollback migrations.
* **Alerts** : PagerDuty on 5xx rates.

## 23. Appendices

### A. ERD Diagram

(Embed Mermaid ERD)

### B. Sample .env

```
DB_HOST=...
DB_USER=...
DB_PASS=...
MIDTRANS_SERVER_KEY=...
RAJAONGKIR_API_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
JWT_SECRET=...
```

### C. Swagger UI

Accessible at `/docs` on local or `/swagger` in production.
