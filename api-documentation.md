# Dagangan API Documentation

## Base URL

All API endpoints are prefixed with `/api/v1`

---

## 1. Public Endpoints (No Authentication Required)

### GET /api/v1/pub/home

**Description**  
Fetch homepage data including featured products, banners, and promotional content for the main landing page.

**Headers**

```json
{
  "Content-Type": "application/json"
}
```

**Response Body**  
**(200 - Success)**

```json
{
  "featuredProducts": [
    {
      "id": 1,
      "name": "iPhone 14 Pro",
      "price": 15000000,
      "imageUrl": "https://example.com/images/iphone14.jpg",
      "rating": 4.8,
      "slug": "iphone-14-pro",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "banners": [
    {
      "id": 1,
      "title": "Year End Sale",
      "imageUrl": "https://example.com/banners/sale.jpg",
      "linkUrl": "/products?category=electronics",
      "createdAt": "2024-01-10T09:00:00Z",
      "updatedAt": "2024-01-10T09:00:00Z"
    }
  ],
  "categories": [
    {
      "id": 1,
      "name": "Electronics",
      "productCount": 1250,
      "createdAt": "2024-01-01T08:00:00Z",
      "updatedAt": "2024-01-01T08:00:00Z"
    }
  ]
}
```

---

### GET /api/v1/pub/products

**Description**  
List all products with pagination, filtering, and sorting options. Available to public users for browsing.

**Query Parameters**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `category` (optional): Category ID to filter by
- `search` (optional): Search term for product name/description
- `minPrice` (optional): Minimum price filter
- `maxPrice` (optional): Maximum price filter
- `sort` (optional): Sort by (priceAsc, priceDesc, rating, newest)

**Response Body**  
**(200 - Success)**

```json
{
  "products": [
    {
      "id": 1,
      "name": "iPhone 14 Pro",
      "description": "Latest iPhone with A16 Bionic chip",
      "price": 15000000,
      "stockQuantity": 50,
      "images": ["https://example.com/images/iphone1.jpg"],
      "rating": 4.8,
      "reviewCount": 124,
      "slug": "iphone-14-pro",
      "seller": {
        "id": 2,
        "firstName": "John",
        "lastName": "Doe"
      },
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 25,
    "totalItems": 500,
    "itemsPerPage": 20
  }
}
```

---

### GET /api/v1/pub/products/:id

**Description**  
Get detailed information about a specific product by its ID, including reviews and related products.

**Params**  
`:id` is the ID of the product to retrieve

**Response Body**  
**(200 - Success)**

```json
{
  "id": 1,
  "name": "iPhone 14 Pro",
  "description": "Latest iPhone with A16 Bionic chip and amazing camera",
  "price": 15000000,
  "sku": "IPH14PRO128",
  "stockQuantity": 50,
  "weight": 0.206,
  "dimensions": "147.5 x 71.5 x 7.85 mm",
  "images": ["https://example.com/images/iphone1.jpg"],
  "slug": "iphone-14-pro",
  "status": "active",
  "seller": {
    "id": 2,
    "firstName": "John",
    "lastName": "Doe"
  },
  "categories": [
    {
      "id": 1,
      "name": "Electronics"
    }
  ],
  "rating": 4.8,
  "reviewCount": 124,
  "relatedProducts": [
    {
      "id": 2,
      "name": "iPhone 14",
      "price": 12000000,
      "imageUrl": "https://example.com/images/iphone14.jpg"
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**(404 - Not Found Error)**

```json
{
  "message": "Product not found"
}
```

---

### GET /api/v1/pub/categories

**Description**  
List all product categories including parent-child relationships for navigation menu.

**Response Body**  
**(200 - Success)**

```json
{
  "categories": [
    {
      "id": 1,
      "name": "Electronics",
      "description": "Electronic devices and gadgets",
      "parentId": null,
      "productCount": 1250,
      "children": [
        {
          "id": 2,
          "name": "Smartphones",
          "description": "Mobile phones and accessories",
          "parentId": 1,
          "productCount": 350
        }
      ],
      "createdAt": "2024-01-01T08:00:00Z",
      "updatedAt": "2024-01-01T08:00:00Z"
    }
  ]
}
```

---

### GET /api/v1/pub/categories/:id

**Description**  
Get detailed information about a specific category and its products.

**Params**  
`:id` is the ID of the category to retrieve

**Response Body**  
**(200 - Success)**

```json
{
  "id": 1,
  "name": "Electronics",
  "description": "Electronic devices and gadgets",
  "parentId": null,
  "children": [
    {
      "id": 2,
      "name": "Smartphones",
      "productCount": 350
    }
  ],
  "products": [
    {
      "id": 1,
      "name": "iPhone 14 Pro",
      "price": 15000000,
      "imageUrl": "https://example.com/images/iphone1.jpg",
      "rating": 4.8
    }
  ],
  "createdAt": "2024-01-01T08:00:00Z",
  "updatedAt": "2024-01-01T08:00:00Z"
}
```

**(404 - Not Found Error)**

```json
{
  "message": "Category not found"
}
```

---

## 2. Authentication

### POST /api/v1/auth/signup

**Description**  
Register a new user account with email and password.

**Request Body**

```json
{
  "email": "john.doe@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+6281234567890",
  "role": "buyer"
}
```

**Response Body**  
**(201 - Created)**

```json
{
  "user": {
    "id": 1,
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+6281234567890",
    "role": "buyer",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

**(400 - Validation Error)**

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is already registered"
    }
  ]
}
```

---

### POST /api/v1/auth/login

**Description**  
Authenticate user with email and password to get access tokens.

**Request Body**

```json
{
  "email": "john.doe@example.com",
  "password": "securePassword123"
}
```

**Response Body**  
**(200 - Success)**

```json
{
  "user": {
    "id": 1,
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "buyer",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid email or password"
}
```

**(403 - Forbidden Error)**

```json
{
  "message": "Account is blocked"
}
```

---

### POST /api/v1/auth/google

**Description**  
Authenticate or register user using Google OAuth2 token.

**Request Body**

```json
{
  "googleToken": "ya29.a0AfH6SMC7..."
}
```

**Response Body**  
**(200 - Success)**

```json
{
  "user": {
    "id": 1,
    "email": "john.doe@gmail.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "buyer",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

**(400 - Bad Request Error)**

```json
{
  "message": "Invalid Google token"
}
```

---

### POST /api/v1/auth/token/refresh

**Description**  
Refresh access token using refresh token.

**Request Body**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Body**  
**(200 - Success)**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid or expired refresh token"
}
```

---

### POST /api/v1/auth/logout

**Description**  
Revoke refresh token and log out user from the system.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Request Body**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Body**  
**(200 - Success)**

```json
{
  "message": "Successfully logged out"
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

## 3. Users & Profiles

### GET /api/v1/users/me

**Description**  
Get current authenticated user's profile information.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Response Body**  
**(200 - Success)**

```json
{
  "id": 1,
  "email": "john.doe@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+6281234567890",
  "role": "buyer",
  "status": "active",
  "sellerProfile": null,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

---

### PUT /api/v1/users/me

**Description**  
Update current authenticated user's profile information.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Request Body**

```json
{
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+6281234567891"
}
```

**Response Body**  
**(200 - Success)**

```json
{
  "id": 1,
  "email": "john.doe@example.com",
  "firstName": "John",
  "lastName": "Smith",
  "phone": "+6281234567891",
  "role": "buyer",
  "status": "active",
  "updatedAt": "2024-01-15T11:30:00Z"
}
```

**(400 - Validation Error)**

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "phone",
      "message": "Phone number format is invalid"
    }
  ]
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

---

### GET /api/v1/users/:id

**Description**  
Get any user's profile by ID. Only accessible by admin users.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Params**  
`:id` is the ID of the user to retrieve

**Response Body**  
**(200 - Success)**

```json
{
  "id": 2,
  "email": "jane.doe@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "phone": "+6281234567892",
  "role": "seller",
  "status": "active",
  "sellerProfile": {
    "balance": 2500000
  },
  "createdAt": "2024-01-10T09:15:00Z"
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

**(403 - Forbidden Error)**

```json
{
  "message": "Access denied. Admin role required"
}
```

**(404 - Not Found Error)**

```json
{
  "message": "User not found"
}
```

---

## 4. Addresses

### GET /api/v1/addresses

**Description**  
List all addresses for the current authenticated user.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Response Body**  
**(200 - Success)**

```json
{
  "addresses": [
    {
      "id": 1,
      "type": "billing",
      "street1": "Jl. Sudirman No. 123",
      "street2": "Apt 4B",
      "city": "Jakarta",
      "province": "DKI Jakarta",
      "postalCode": "12345",
      "country": "Indonesia",
      "createdAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "type": "shipping",
      "street1": "Jl. Thamrin No. 456",
      "street2": null,
      "city": "Jakarta",
      "province": "DKI Jakarta",
      "postalCode": "12346",
      "country": "Indonesia",
      "createdAt": "2024-01-16T14:20:00Z"
    }
  ]
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

---

### POST /api/v1/addresses

**Description**  
Create a new address for the current authenticated user.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Request Body**

```json
{
  "type": "shipping",
  "street1": "Jl. Gatot Subroto No. 789",
  "street2": "Building C, Floor 5",
  "city": "Jakarta",
  "province": "DKI Jakarta",
  "postalCode": "12347",
  "country": "Indonesia"
}
```

**Response Body**  
**(201 - Created)**

```json
{
  "id": 3,
  "type": "shipping",
  "street1": "Jl. Gatot Subroto No. 789",
  "street2": "Building C, Floor 5",
  "city": "Jakarta",
  "province": "DKI Jakarta",
  "postalCode": "12347",
  "country": "Indonesia",
  "createdAt": "2024-01-17T09:45:00Z"
}
```

**(400 - Validation Error)**

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "type",
      "message": "Type must be either 'billing' or 'shipping'"
    }
  ]
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

---

### GET /api/v1/addresses/:id

**Description**  
Get a specific address by ID. User can only access their own addresses.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Params**  
`:id` is the ID of the address to retrieve

**Response Body**  
**(200 - Success)**

```json
{
  "id": 1,
  "type": "billing",
  "street1": "Jl. Sudirman No. 123",
  "street2": "Apt 4B",
  "city": "Jakarta",
  "province": "DKI Jakarta",
  "postalCode": "12345",
  "country": "Indonesia",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

**(403 - Forbidden Error)**

```json
{
  "message": "You are not authorized to access this address"
}
```

**(404 - Not Found Error)**

```json
{
  "message": "Address not found"
}
```

---

### PUT /api/v1/addresses/:id

**Description**  
Update a specific address. User can only update their own addresses.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Params**  
`:id` is the ID of the address to update

**Request Body**

```json
{
  "street1": "Jl. Sudirman No. 124",
  "street2": "Apt 4C",
  "city": "Jakarta",
  "province": "DKI Jakarta",
  "postalCode": "12345",
  "country": "Indonesia"
}
```

**Response Body**  
**(200 - Success)**

```json
{
  "id": 1,
  "type": "billing",
  "street1": "Jl. Sudirman No. 124",
  "street2": "Apt 4C",
  "city": "Jakarta",
  "province": "DKI Jakarta",
  "postalCode": "12345",
  "country": "Indonesia",
  "updatedAt": "2024-01-17T11:20:00Z"
}
```

**(400 - Validation Error)**

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "postalCode",
      "message": "Postal code is required"
    }
  ]
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

**(403 - Forbidden Error)**

```json
{
  "message": "You are not authorized to update this address"
}
```

**(404 - Not Found Error)**

```json
{
  "message": "Address not found"
}
```

---

### DELETE /api/v1/addresses/:id

**Description**  
Delete a specific address. User can only delete their own addresses.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Params**  
`:id` is the ID of the address to delete

**Response Body**  
**(204 - No Content)**

```
(No content returned)
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

**(403 - Forbidden Error)**

```json
{
  "message": "You are not authorized to delete this address"
}
```

**(404 - Not Found Error)**

```json
{
  "message": "Address not found"
}
```

**Note**  
Address cannot be deleted if it's being used in any existing orders or shipments.

---

## 5. Products

### GET /api/v1/products

**Description**  
List products for authenticated users. For sellers, shows their own products. For admins, shows all products.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Query Parameters**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `status` (optional): Filter by product status (active, archived)

**Response Body**  
**(200 - Success)**

```json
{
  "products": [
    {
      "id": 1,
      "name": "iPhone 14 Pro",
      "description": "Latest iPhone with A16 Bionic chip",
      "price": 15000000,
      "sku": "IPH14PRO128",
      "stockQuantity": 50,
      "weight": 0.206,
      "slug": "iphone-14-pro",
      "status": "active",
      "seller": {
        "id": 2,
        "firstName": "John",
        "lastName": "Doe"
      },
      "categories": [
        {
          "id": 1,
          "name": "Electronics"
        }
      ],
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100,
    "itemsPerPage": 20
  }
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

---

### POST /api/v1/products

**Description**  
Create a new product. Only accessible by sellers and admins.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Request Body**

```json
{
  "name": "MacBook Pro M2",
  "description": "Powerful laptop with M2 chip and 16GB RAM",
  "price": 25000000,
  "sku": "MBP-M2-16-512",
  "stockQuantity": 25,
  "weight": 1.4,
  "dimensions": "31.26 x 22.12 x 1.55 cm",
  "categoryIds": [1, 2]
}
```

**Response Body**  
**(201 - Created)**

```json
{
  "id": 2,
  "name": "MacBook Pro M2",
  "description": "Powerful laptop with M2 chip and 16GB RAM",
  "price": 25000000,
  "sku": "MBP-M2-16-512",
  "stockQuantity": 25,
  "weight": 1.4,
  "dimensions": "31.26 x 22.12 x 1.55 cm",
  "slug": "macbook-pro-m2",
  "status": "active",
  "sellerId": 2,
  "categories": [
    {
      "id": 1,
      "name": "Electronics"
    },
    {
      "id": 2,
      "name": "Computers"
    }
  ],
  "createdAt": "2024-01-17T14:30:00Z"
}
```

**(400 - Validation Error)**

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "sku",
      "message": "SKU already exists"
    }
  ]
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

**(403 - Forbidden Error)**

```json
{
  "message": "Access denied. Seller or admin role required"
}
```

---

### GET /api/v1/products/:id

**Description**  
Get detailed information about a specific product by ID.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Params**  
`:id` is the ID of the product to retrieve

**Response Body**  
**(200 - Success)**

```json
{
  "id": 1,
  "name": "iPhone 14 Pro",
  "description": "Latest iPhone with A16 Bionic chip and amazing camera",
  "price": 15000000,
  "sku": "IPH14PRO128",
  "stockQuantity": 50,
  "weight": 0.206,
  "dimensions": "147.5 x 71.5 x 7.85 mm",
  "slug": "iphone-14-pro",
  "status": "active",
  "seller": {
    "id": 2,
    "firstName": "John",
    "lastName": "Doe"
  },
  "categories": [
    {
      "id": 1,
      "name": "Electronics"
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

**(404 - Not Found Error)**

```json
{
  "message": "Product not found"
}
```

---

### PUT /api/v1/products/:id

**Description**  
Update a specific product. Sellers can only update their own products, admins can update any product.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Params**  
`:id` is the ID of the product to update

**Request Body**

```json
{
  "name": "iPhone 14 Pro Max",
  "description": "Latest iPhone with A16 Bionic chip and larger screen",
  "price": 17000000,
  "stockQuantity": 30,
  "categoryIds": [1]
}
```

**Response Body**  
**(200 - Success)**

```json
{
  "id": 1,
  "name": "iPhone 14 Pro Max",
  "description": "Latest iPhone with A16 Bionic chip and larger screen",
  "price": 17000000,
  "sku": "IPH14PRO128",
  "stockQuantity": 30,
  "weight": 0.206,
  "slug": "iphone-14-pro-max",
  "status": "active",
  "categories": [
    {
      "id": 1,
      "name": "Electronics"
    }
  ],
  "updatedAt": "2024-01-17T16:45:00Z"
}
```

**(400 - Validation Error)**

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "price",
      "message": "Price must be greater than 0"
    }
  ]
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

**(403 - Forbidden Error)**

```json
{
  "message": "You are not authorized to update this product"
}
```

**(404 - Not Found Error)**

```json
{
  "message": "Product not found"
}
```

---

### DELETE /api/v1/products/:id

**Description**  
Delete a specific product. Sellers can only delete their own products, admins can delete any product.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Params**  
`:id` is the ID of the product to delete

**Response Body**  
**(204 - No Content)**

```
(No content returned)
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

**(403 - Forbidden Error)**

```json
{
  "message": "You are not authorized to delete this product"
}
```

**(404 - Not Found Error)**

```json
{
  "message": "Product not found"
}
```

**Note**  
Product cannot be deleted if it has existing orders. The product status will be changed to 'archived' instead.

---

## 6. Categories

### GET /api/v1/categories

**Description**  
List all product categories with hierarchical structure.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Response Body**  
**(200 - Success)**

```json
{
  "categories": [
    {
      "id": 1,
      "name": "Electronics",
      "description": "Electronic devices and gadgets",
      "parentId": null,
      "children": [
        {
          "id": 2,
          "name": "Smartphones",
          "description": "Mobile phones and accessories",
          "parentId": 1,
          "children": []
        }
      ],
      "createdAt": "2024-01-10T09:00:00Z"
    }
  ]
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

---

### POST /api/v1/categories

**Description**  
Create a new product category. Only accessible by admin users.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Request Body**

```json
{
  "name": "Laptops",
  "description": "Portable computers and accessories",
  "parentId": 1
}
```

**Response Body**  
**(201 - Created)**

```json
{
  "id": 3,
  "name": "Laptops",
  "description": "Portable computers and accessories",
  "parentId": 1,
  "createdAt": "2024-01-17T10:15:00Z"
}
```

**(400 - Validation Error)**

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "Category name already exists"
    }
  ]
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

**(403 - Forbidden Error)**

```json
{
  "message": "Access denied. Admin role required"
}
```

---

### GET /api/v1/categories/:id

**Description**  
Get detailed information about a specific category.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Params**  
`:id` is the ID of the category to retrieve

**Response Body**  
**(200 - Success)**

```json
{
  "id": 1,
  "name": "Electronics",
  "description": "Electronic devices and gadgets",
  "parentId": null,
  "children": [
    {
      "id": 2,
      "name": "Smartphones",
      "description": "Mobile phones and accessories"
    }
  ],
  "productCount": 1250,
  "createdAt": "2024-01-01T08:00:00Z"
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

**(404 - Not Found Error)**

```json
{
  "message": "Category not found"
}
```

---

### PUT /api/v1/categories/:id

**Description**  
Update a specific category. Only accessible by admin users.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Params**  
`:id` is the ID of the category to update

**Request Body**

```json
{
  "name": "Electronics & Gadgets",
  "description": "Electronic devices, gadgets and accessories"
}
```

**Response Body**  
**(200 - Success)**

```json
{
  "id": 1,
  "name": "Electronics & Gadgets",
  "description": "Electronic devices, gadgets and accessories",
  "parentId": null,
  "updatedAt": "2024-01-17T12:30:00Z"
}
```

**(400 - Validation Error)**

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "Category name already exists"
    }
  ]
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

**(403 - Forbidden Error)**

```json
{
  "message": "Access denied. Admin role required"
}
```

**(404 - Not Found Error)**

```json
{
  "message": "Category not found"
}
```

---

### DELETE /api/v1/categories/:id

**Description**  
Delete a specific category. Only accessible by admin users.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Params**  
`:id` is the ID of the category to delete

**Response Body**  
**(204 - No Content)**

```
(No content returned)
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

**(403 - Forbidden Error)**

```json
{
  "message": "Access denied. Admin role required"
}
```

**(404 - Not Found Error)**

```json
{
  "message": "Category not found"
}
```

**Note**  
Category cannot be deleted if it has associated products or child categories. All products must be moved to other categories and child categories must be reassigned before deletion.

---

## 7. Cart

### GET /api/v1/cart

**Description**  
Get current user's cart with all items and calculated totals.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Response Body**  
**(200 - Success)**

```json
{
  "cart": {
    "id": 1,
    "userId": 1,
    "items": [
      {
        "id": 1,
        "product": {
          "id": 1,
          "name": "iPhone 14 Pro",
          "price": 15000000,
          "stockQuantity": 50,
          "slug": "iphone-14-pro",
          "imageUrl": "https://example.com/images/iphone1.jpg"
        },
        "quantity": 2,
        "unitPriceAtAdd": 15000000,
        "totalPrice": 30000000,
        "selectedOptions": {},
        "createdAt": "2024-01-17T10:30:00Z"
      }
    ],
    "subtotal": 30000000,
    "totalItems": 2,
    "createdAt": "2024-01-17T09:00:00Z",
    "updatedAt": "2024-01-17T10:30:00Z"
  }
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

**Note**  
If user doesn't have a cart, an empty cart will be created and returned.

---

### POST /api/v1/cart/items

**Description**  
Add a product to the current user's cart or update quantity if already exists.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Request Body**

```json
{
  "productId": 1,
  "quantity": 2,
  "selectedOptions": {
    "color": "Space Gray",
    "storage": "128GB"
  }
}
```

**Response Body**  
**(201 - Created)**

```json
{
  "cartItem": {
    "id": 1,
    "cartId": 1,
    "product": {
      "id": 1,
      "name": "iPhone 14 Pro",
      "price": 15000000,
      "stockQuantity": 48,
      "slug": "iphone-14-pro"
    },
    "quantity": 2,
    "unitPriceAtAdd": 15000000,
    "totalPrice": 30000000,
    "selectedOptions": {
      "color": "Space Gray",
      "storage": "128GB"
    },
    "createdAt": "2024-01-17T10:30:00Z"
  },
  "cartSummary": {
    "subtotal": 30000000,
    "totalItems": 2
  }
}
```

**(400 - Validation Error)**

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "quantity",
      "message": "Quantity must be greater than 0"
    }
  ]
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

**(404 - Not Found Error)**

```json
{
  "message": "Product not found"
}
```

**(422 - Unprocessable Entity)**

```json
{
  "message": "Insufficient stock. Only 1 item available"
}
```

---

### PUT /api/v1/cart/items/:id

**Description**  
Update quantity of a specific cart item.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Params**  
`:id` is the ID of the cart item to update

**Request Body**

```json
{
  "quantity": 3
}
```

**Response Body**  
**(200 - Success)**

```json
{
  "cartItem": {
    "id": 1,
    "cartId": 1,
    "product": {
      "id": 1,
      "name": "iPhone 14 Pro",
      "price": 15000000,
      "stockQuantity": 47,
      "slug": "iphone-14-pro"
    },
    "quantity": 3,
    "unitPriceAtAdd": 15000000,
    "totalPrice": 45000000,
    "selectedOptions": {
      "color": "Space Gray",
      "storage": "128GB"
    },
    "updatedAt": "2024-01-17T11:15:00Z"
  },
  "cartSummary": {
    "subtotal": 45000000,
    "totalItems": 3
  }
}
```

**(400 - Validation Error)**

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "quantity",
      "message": "Quantity must be greater than 0"
    }
  ]
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

**(403 - Forbidden Error)**

```json
{
  "message": "You are not authorized to update this cart item"
}
```

**(404 - Not Found Error)**

```json
{
  "message": "Cart item not found"
}
```

**(422 - Unprocessable Entity)**

```json
{
  "message": "Insufficient stock. Only 2 items available"
}
```

---

### DELETE /api/v1/cart/items/:id

**Description**  
Remove a specific item from the cart.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Params**  
`:id` is the ID of the cart item to remove

**Response Body**  
**(200 - Success)**

```json
{
  "message": "Item removed from cart",
  "cartSummary": {
    "subtotal": 0,
    "totalItems": 0
  }
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

**(403 - Forbidden Error)**

```json
{
  "message": "You are not authorized to remove this cart item"
}
```

**(404 - Not Found Error)**

```json
{
  "message": "Cart item not found"
}
```

---

## 8. Coupons

### GET /api/v1/coupons

**Description**  
List all coupons. Only accessible by admin users.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Query Parameters**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `status` (optional): Filter by coupon status (active, expired, disabled)

**Response Body**  
**(200 - Success)**

```json
{
  "coupons": [
    {
      "id": 1,
      "code": "WELCOME2024",
      "type": "percent",
      "value": 10,
      "minOrderAmount": 100000,
      "maxUses": 1000,
      "perUserLimit": 1,
      "startAt": "2024-01-01T00:00:00Z",
      "expiresAt": "2024-12-31T23:59:59Z",
      "status": "active",
      "usedCount": 245,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 50,
    "itemsPerPage": 20
  }
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

**(403 - Forbidden Error)**

```json
{
  "message": "Access denied. Admin role required"
}
```

---

### POST /api/v1/coupons

**Description**  
Create a new coupon. Only accessible by admin users.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Request Body**

```json
{
  "code": "NEWYEAR2024",
  "type": "percent",
  "value": 15,
  "minOrderAmount": 200000,
  "maxUses": 500,
  "perUserLimit": 1,
  "startAt": "2024-01-01T00:00:00Z",
  "expiresAt": "2024-01-31T23:59:59Z"
}
```

**Response Body**  
**(201 - Created)**

```json
{
  "id": 2,
  "code": "NEWYEAR2024",
  "type": "percent",
  "value": 15,
  "minOrderAmount": 200000,
  "maxUses": 500,
  "perUserLimit": 1,
  "startAt": "2024-01-01T00:00:00Z",
  "expiresAt": "2024-01-31T23:59:59Z",
  "status": "active",
  "usedCount": 0,
  "createdAt": "2024-01-17T14:30:00Z"
}
```

**(400 - Validation Error)**

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "code",
      "message": "Coupon code already exists"
    }
  ]
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

**(403 - Forbidden Error)**

```json
{
  "message": "Access denied. Admin role required"
}
```

---

### GET /api/v1/coupons/:code

**Description**  
Get coupon details by code to check if it's valid and available.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Params**  
`:code` is the coupon code to retrieve

**Response Body**  
**(200 - Success)**

```json
{
  "id": 1,
  "code": "WELCOME2024",
  "type": "percent",
  "value": 10,
  "minOrderAmount": 100000,
  "maxUses": 1000,
  "perUserLimit": 1,
  "startAt": "2024-01-01T00:00:00Z",
  "expiresAt": "2024-12-31T23:59:59Z",
  "status": "active",
  "usedCount": 245,
  "remainingUses": 755,
  "userUsageCount": 0,
  "isValid": true
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

**(404 - Not Found Error)**

```json
{
  "message": "Coupon not found"
}
```

**(422 - Unprocessable Entity)**

```json
{
  "message": "Coupon is expired or disabled"
}
```

---

### POST /api/v1/coupons/validate

**Description**  
Validate a coupon against the current cart or order summary to check discount calculation.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Request Body**

```json
{
  "couponCode": "WELCOME2024",
  "orderAmount": 500000
}
```

**Response Body**  
**(200 - Success)**

```json
{
  "coupon": {
    "id": 1,
    "code": "WELCOME2024",
    "type": "percent",
    "value": 10
  },
  "isValid": true,
  "discountAmount": 50000,
  "finalAmount": 450000,
  "message": "Coupon applied successfully"
}
```

**(400 - Validation Error)**

```json
{
  "message": "Order amount does not meet minimum requirement of Rp 100,000"
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

**(404 - Not Found Error)**

```json
{
  "message": "Coupon not found"
}
```

**(422 - Unprocessable Entity)**

```json
{
  "message": "You have already used this coupon"
}
```

**Note**  
This endpoint validates the coupon but doesn't apply it to any order. It's used for preview purposes during checkout.

---

## 9. Orders

### POST /api/v1/orders/checkout

**Description**  
Create a new order from the current user's cart and initiate the checkout process.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Request Body**

```json
{
  "shippingAddressId": 2,
  "paymentMethodId": 1,
  "couponCode": "WELCOME2024",
  "shippingOption": {
    "courier": "jne",
    "service": "REG",
    "cost": 15000,
    "etd": "2-3"
  }
}
```

**Response Body**  
**(201 - Created)**

```json
{
  "order": {
    "id": 1,
    "orderNumber": "DGN-2024-001",
    "status": "new",
    "userId": 1,
    "items": [
      {
        "id": 1,
        "product": {
          "id": 1,
          "name": "iPhone 14 Pro",
          "sku": "IPH14PRO128"
        },
        "quantity": 2,
        "unitPrice": 15000000,
        "discountAmount": 3000000,
        "taxAmount": 0,
        "total": 27000000
      }
    ],
    "subtotal": 30000000,
    "tax": 0,
    "shippingFee": 15000,
    "discountAmount": 3000000,
    "total": 27015000,
    "coupon": {
      "id": 1,
      "code": "WELCOME2024"
    },
    "shippingAddress": {
      "street1": "Jl. Thamrin No. 456",
      "city": "Jakarta",
      "province": "DKI Jakarta"
    },
    "createdAt": "2024-01-17T15:30:00Z"
  },
  "paymentUrl": "https://app.midtrans.com/snap/v2/vtweb/...",
  "paymentToken": "66e4fa55-fdac-4ef9-91b5-733b97d1b862"
}
```

**(400 - Validation Error)**

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "shippingAddressId",
      "message": "Shipping address is required"
    }
  ]
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

**(422 - Unprocessable Entity)**

```json
{
  "message": "Cart is empty or some items are out of stock"
}
```

---

### GET /api/v1/orders

**Description**  
List all orders for the current authenticated user with pagination and status filtering.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Query Parameters**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 50)
- `status` (optional): Filter by order status (new, paid, shipped, delivered, closed)

**Response Body**  
**(200 - Success)**

```json
{
  "orders": [
    {
      "id": 1,
      "orderNumber": "DGN-2024-001",
      "status": "paid",
      "subtotal": 30000000,
      "total": 27015000,
      "itemsCount": 2,
      "createdAt": "2024-01-17T15:30:00Z",
      "updatedAt": "2024-01-17T16:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 1,
    "itemsPerPage": 10
  }
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

---

### GET /api/v1/orders/:id

**Description**  
Get detailed information about a specific order. Users can only access their own orders.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Params**  
`:id` is the ID of the order to retrieve

**Response Body**  
**(200 - Success)**

```json
{
  "id": 1,
  "orderNumber": "DGN-2024-001",
  "status": "paid",
  "userId": 1,
  "items": [
    {
      "id": 1,
      "product": {
        "id": 1,
        "name": "iPhone 14 Pro",
        "sku": "IPH14PRO128",
        "imageUrl": "https://example.com/images/iphone1.jpg"
      },
      "quantity": 2,
      "unitPrice": 15000000,
      "discountAmount": 3000000,
      "taxAmount": 0,
      "total": 27000000
    }
  ],
  "subtotal": 30000000,
  "tax": 0,
  "shippingFee": 15000,
  "discountAmount": 3000000,
  "total": 27015000,
  "coupon": {
    "id": 1,
    "code": "WELCOME2024"
  },
  "payment": {
    "id": 1,
    "amount": 27015000,
    "status": "success",
    "paidAt": "2024-01-17T16:00:00Z"
  },
  "shipment": {
    "id": 1,
    "courier": "jne",
    "trackingNumber": "JNE1234567890",
    "status": "inTransit",
    "shippedAt": "2024-01-18T10:00:00Z"
  },
  "shippingAddress": {
    "street1": "Jl. Thamrin No. 456",
    "city": "Jakarta",
    "province": "DKI Jakarta"
  },
  "createdAt": "2024-01-17T15:30:00Z",
  "updatedAt": "2024-01-18T10:00:00Z"
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

**(403 - Forbidden Error)**

```json
{
  "message": "You are not authorized to access this order"
}
```

**(404 - Not Found Error)**

```json
{
  "message": "Order not found"
}
```

---

## 10. Payments & Callbacks

### POST /api/v1/payments

**Description**  
Initiate payment for an order using Midtrans payment gateway.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Request Body**

```json
{
  "orderId": 1,
  "paymentMethodId": 1
}
```

**Response Body**  
**(201 - Created)**

```json
{
  "payment": {
    "id": 1,
    "orderId": 1,
    "amount": 27015000,
    "currency": "IDR",
    "status": "pending",
    "createdAt": "2024-01-17T15:45:00Z"
  },
  "paymentUrl": "https://app.midtrans.com/snap/v2/vtweb/...",
  "paymentToken": "66e4fa55-fdac-4ef9-91b5-733b97d1b862",
  "expiresAt": "2024-01-17T16:45:00Z"
}
```

**(400 - Validation Error)**

```json
{
  "message": "Order has already been paid"
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

**(404 - Not Found Error)**

```json
{
  "message": "Order not found"
}
```

---

### POST /api/v1/payments/midtrans/callback

**Description**  
Handle Midtrans payment notifications and update order/payment status accordingly.

**Headers**

```json
{
  "Content-Type": "application/json"
}
```

**Request Body**

```json
{
  "transactionTime": "2024-01-17 16:00:00",
  "transactionStatus": "capture",
  "transactionId": "b91c16dd-d6d1-469e-9e32-9d8d4c2f8c96",
  "statusMessage": "midtrans payment notification",
  "statusCode": "200",
  "signatureKey": "85b34928e75e51e1ab...",
  "settlementTime": "2024-01-17 16:00:02",
  "paymentType": "creditCard",
  "orderId": "DGN-2024-001",
  "merchantId": "G123456789",
  "grossAmount": "27015000.00"
}
```

**Response Body**  
**(200 - Success)**

```json
{
  "status": "ok",
  "message": "Payment notification processed successfully"
}
```

**(400 - Bad Request Error)**

```json
{
  "status": "error",
  "message": "Invalid signature"
}
```

**Note**  
This endpoint is called by Midtrans servers and doesn't require authentication. It validates the signature to ensure authenticity.

---

## 11. Shipments

### GET /api/v1/shipments/:orderId

**Description**  
Get shipment status and tracking information for a specific order.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Params**  
`:orderId` is the ID of the order to get shipment information for

**Response Body**  
**(200 - Success)**

```json
{
  "shipment": {
    "id": 1,
    "orderId": 1,
    "courier": "jne",
    "trackingNumber": "JNE1234567890",
    "status": "inTransit",
    "shippedAt": "2024-01-18T10:00:00Z",
    "estimatedDelivery": "2024-01-20T17:00:00Z",
    "address": {
      "street1": "Jl. Thamrin No. 456",
      "city": "Jakarta",
      "province": "DKI Jakarta",
      "postalCode": "12346"
    },
    "trackingHistory": [
      {
        "timestamp": "2024-01-18T10:00:00Z",
        "status": "pickedUp",
        "description": "Package picked up from seller"
      },
      {
        "timestamp": "2024-01-18T14:30:00Z",
        "status": "inTransit",
        "description": "Package in transit to destination city"
      }
    ]
  }
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

**(403 - Forbidden Error)**

```json
{
  "message": "You are not authorized to access this shipment"
}
```

**(404 - Not Found Error)**

```json
{
  "message": "Shipment not found for this order"
}
```

---

## 12. Reviews

### GET /api/v1/products/:id/reviews

**Description**  
List all reviews for a specific product with pagination and rating filtering.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Params**  
`:id` is the ID of the product to get reviews for

**Query Parameters**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 50)
- `rating` (optional): Filter by rating (1-5)
- `sort` (optional): Sort by (newest, oldest, ratingHigh, ratingLow)

**Response Body**  
**(200 - Success)**

```json
{
  "reviews": [
    {
      "id": 1,
      "user": {
        "id": 1,
        "firstName": "John",
        "lastName": "D."
      },
      "rating": 5,
      "comment": "Excellent product! Fast delivery and great quality.",
      "media": [
        {
          "id": 1,
          "type": "image",
          "url": "https://example.com/reviews/img1.jpg"
        }
      ],
      "createdAt": "2024-01-20T14:30:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10
  },
  "ratingSummary": {
    "averageRating": 4.6,
    "totalReviews": 50,
    "ratingDistribution": {
      "5": 30,
      "4": 15,
      "3": 3,
      "2": 1,
      "1": 1
    }
  }
}
```

**(404 - Not Found Error)**

```json
{
  "message": "Product not found"
}
```

---

### POST /api/v1/products/:id/reviews

**Description**  
Create a review for a product. User must have purchased the product to leave a review.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>",
  "Content-Type": "multipart/form-data"
}
```

**Params**  
`:id` is the ID of the product to review

**Request Body (Form Data)**

```
rating: 5
comment: "Excellent product! Fast delivery and great quality."
media[]: (file) image1.jpg
media[]: (file) image2.jpg
```

**Response Body**  
**(201 - Created)**

```json
{
  "review": {
    "id": 1,
    "userId": 1,
    "productId": 1,
    "rating": 5,
    "comment": "Excellent product! Fast delivery and great quality.",
    "media": [
      {
        "id": 1,
        "type": "image",
        "url": "https://example.com/reviews/img1.jpg"
      },
      {
        "id": 2,
        "type": "image",
        "url": "https://example.com/reviews/img2.jpg"
      }
    ],
    "createdAt": "2024-01-20T14:30:00Z"
  }
}
```

**(400 - Validation Error)**

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "rating",
      "message": "Rating must be between 1 and 5"
    }
  ]
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

**(403 - Forbidden Error)**

```json
{
  "message": "You can only review products you have purchased"
}
```

**(404 - Not Found Error)**

```json
{
  "message": "Product not found"
}
```

**(409 - Conflict Error)**

```json
{
  "message": "You have already reviewed this product"
}
```

---

## 13. Wishlists

### GET /api/v1/wishlists

**Description**  
Get current user's wishlist with all saved products.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Response Body**  
**(200 - Success)**

```json
{
  "wishlist": {
    "id": 1,
    "userId": 1,
    "items": [
      {
        "id": 1,
        "product": {
          "id": 1,
          "name": "iPhone 14 Pro",
          "price": 15000000,
          "stockQuantity": 50,
          "slug": "iphone-14-pro",
          "imageUrl": "https://example.com/images/iphone1.jpg",
          "rating": 4.8
        },
        "addedAt": "2024-01-15T10:30:00Z"
      }
    ],
    "totalItems": 1,
    "createdAt": "2024-01-15T09:00:00Z"
  }
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

**Note**  
If user doesn't have a wishlist, an empty wishlist will be created and returned.

---

### POST /api/v1/wishlists/items

**Description**  
Add a product to the current user's wishlist.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Request Body**

```json
{
  "productId": 1
}
```

**Response Body**  
**(201 - Created)**

```json
{
  "wishlistItem": {
    "id": 1,
    "wishlistId": 1,
    "product": {
      "id": 1,
      "name": "iPhone 14 Pro",
      "price": 15000000,
      "slug": "iphone-14-pro",
      "imageUrl": "https://example.com/images/iphone1.jpg"
    },
    "addedAt": "2024-01-17T10:30:00Z"
  }
}
```

**(400 - Validation Error)**

```json
{
  "message": "Product is already in your wishlist"
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

**(404 - Not Found Error)**

```json
{
  "message": "Product not found"
}
```

---

### DELETE /api/v1/wishlists/items/:id

**Description**  
Remove a product from the current user's wishlist.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Params**  
`:id` is the ID of the wishlist item to remove

**Response Body**  
**(200 - Success)**

```json
{
  "message": "Item removed from wishlist"
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

**(403 - Forbidden Error)**

```json
{
  "message": "You are not authorized to remove this wishlist item"
}
```

**(404 - Not Found Error)**

```json
{
  "message": "Wishlist item not found"
}
```

---

## 14. Notifications

### GET /api/v1/notifications

**Description**  
List all notifications for the current authenticated user.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Query Parameters**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `isRead` (optional): Filter by read status (true/false)
- `type` (optional): Filter by notification type

**Response Body**  
**(200 - Success)**

```json
{
  "notifications": [
    {
      "id": 1,
      "type": "orderStatusUpdate",
      "text": "Your order DGN-2024-001 has been shipped",
      "payload": {
        "orderId": 1,
        "orderNumber": "DGN-2024-001",
        "status": "shipped"
      },
      "isRead": false,
      "createdAt": "2024-01-18T10:00:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalItems": 25,
    "itemsPerPage": 20
  },
  "unreadCount": 5
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

---

### PUT /api/v1/notifications/:id/read

**Description**  
Mark a specific notification as read.

**Headers**

```json
{
  "Authorization": "Bearer <access_token>"
}
```

**Params**  
`:id` is the ID of the notification to mark as read

**Response Body**  
**(200 - Success)**

```json
{
  "notification": {
    "id": 1,
    "type": "orderStatusUpdate",
    "text": "Your order DGN-2024-001 has been shipped",
    "isRead": true,
    "updatedAt": "2024-01-18T15:30:00Z"
  }
}
```

**(401 - Unauthorized Error)**

```json
{
  "message": "Invalid access token"
}
```

**(403 - Forbidden Error)**

```json
{
  "message": "You are not authorized to update this notification"
}
```

**(404 - Not Found Error)**

```json
{
  "message": "Notification not found"
}
```

---

## 15. Health & Documentation

### GET /api/v1/healthz

**Description**  
Health check endpoint to verify API service status and database connectivity.

**Response Body**  
**(200 - Success)**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-17T10:30:00Z",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "redis": "connected",
    "externalApis": {
      "midtrans": "reachable",
      "rajaongkir": "reachable"
    }
  },
  "uptime": "72h 15m 30s"
}
```

**(503 - Service Unavailable)**

```json
{
  "status": "unhealthy",
  "timestamp": "2024-01-17T10:30:00Z",
  "version": "1.0.0",
  "services": {
    "database": "disconnected",
    "redis": "connected",
    "externalApis": {
      "midtrans": "unreachable",
      "rajaongkir": "reachable"
    }
  },
  "uptime": "72h 15m 30s"
}
```

---

### GET /api/v1/docs

**Description**  
Swagger UI documentation for the API. Provides interactive documentation for all endpoints.

**Response**  
Returns HTML page with Swagger UI interface for API documentation and testing.

**Note**  
This endpoint serves the Swagger UI interface where developers can explore and test all API endpoints interactively.
