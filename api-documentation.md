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
  "featured_products": [
    {
      "id": 1,
      "name": "iPhone 14 Pro",
      "price": 15000000,
      "image_url": "https://example.com/images/iphone14.jpg",
      "rating": 4.8,
      "slug": "iphone-14-pro"
    }
  ],
  "banners": [
    {
      "id": 1,
      "title": "Year End Sale",
      "image_url": "https://example.com/banners/sale.jpg",
      "link_url": "/products?category=electronics"
    }
  ],
  "categories": [
    {
      "id": 1,
      "name": "Electronics",
      "product_count": 1250
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
- `min_price` (optional): Minimum price filter
- `max_price` (optional): Maximum price filter
- `sort` (optional): Sort by (price_asc, price_desc, rating, newest)

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
      "stock_quantity": 50,
      "images": ["https://example.com/images/iphone1.jpg"],
      "rating": 4.8,
      "review_count": 124,
      "slug": "iphone-14-pro",
      "seller": {
        "id": 2,
        "first_name": "John",
        "last_name": "Doe"
      }
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 25,
    "total_items": 500,
    "items_per_page": 20
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
  "stock_quantity": 50,
  "weight": 0.206,
  "dimensions": "147.5 x 71.5 x 7.85 mm",
  "images": ["https://example.com/images/iphone1.jpg"],
  "slug": "iphone-14-pro",
  "status": "active",
  "seller": {
    "id": 2,
    "first_name": "John",
    "last_name": "Doe"
  },
  "categories": [
    {
      "id": 1,
      "name": "Electronics"
    }
  ],
  "rating": 4.8,
  "review_count": 124,
  "related_products": [
    {
      "id": 2,
      "name": "iPhone 14",
      "price": 12000000,
      "image_url": "https://example.com/images/iphone14.jpg"
    }
  ]
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
      "parent_id": null,
      "product_count": 1250,
      "children": [
        {
          "id": 2,
          "name": "Smartphones",
          "description": "Mobile phones and accessories",
          "parent_id": 1,
          "product_count": 350
        }
      ]
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
  "parent_id": null,
  "children": [
    {
      "id": 2,
      "name": "Smartphones",
      "product_count": 350
    }
  ],
  "products": [
    {
      "id": 1,
      "name": "iPhone 14 Pro",
      "price": 15000000,
      "image_url": "https://example.com/images/iphone1.jpg",
      "rating": 4.8
    }
  ]
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
  "first_name": "John",
  "last_name": "Doe",
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
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+6281234567890",
    "role": "buyer",
    "status": "active"
  },
  "tokens": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600
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
    "first_name": "John",
    "last_name": "Doe",
    "role": "buyer",
    "status": "active"
  },
  "tokens": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600
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
  "google_token": "ya29.a0AfH6SMC7..."
}
```

**Response Body**  
**(200 - Success)**

```json
{
  "user": {
    "id": 1,
    "email": "john.doe@gmail.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "buyer",
    "status": "active"
  },
  "tokens": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600
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
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Body**  
**(200 - Success)**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
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
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+6281234567890",
  "role": "buyer",
  "status": "active",
  "seller_profile": null,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
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
  "first_name": "John",
  "last_name": "Smith",
  "phone": "+6281234567891"
}
```

**Response Body**  
**(200 - Success)**

```json
{
  "id": 1,
  "email": "john.doe@example.com",
  "first_name": "John",
  "last_name": "Smith",
  "phone": "+6281234567891",
  "role": "buyer",
  "status": "active",
  "updated_at": "2024-01-15T11:30:00Z"
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
  "first_name": "Jane",
  "last_name": "Doe",
  "phone": "+6281234567892",
  "role": "seller",
  "status": "active",
  "seller_profile": {
    "balance": 2500000
  },
  "created_at": "2024-01-10T09:15:00Z"
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
      "postal_code": "12345",
      "country": "Indonesia",
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "type": "shipping",
      "street1": "Jl. Thamrin No. 456",
      "street2": null,
      "city": "Jakarta",
      "province": "DKI Jakarta",
      "postal_code": "12346",
      "country": "Indonesia",
      "created_at": "2024-01-16T14:20:00Z"
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
  "postal_code": "12347",
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
  "postal_code": "12347",
  "country": "Indonesia",
  "created_at": "2024-01-17T09:45:00Z"
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
  "postal_code": "12345",
  "country": "Indonesia",
  "created_at": "2024-01-15T10:30:00Z"
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
  "postal_code": "12345",
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
  "postal_code": "12345",
  "country": "Indonesia",
  "updated_at": "2024-01-17T11:20:00Z"
}
```

**(400 - Validation Error)**

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "postal_code",
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
      "stock_quantity": 50,
      "weight": 0.206,
      "slug": "iphone-14-pro",
      "status": "active",
      "seller": {
        "id": 2,
        "first_name": "John",
        "last_name": "Doe"
      },
      "categories": [
        {
          "id": 1,
          "name": "Electronics"
        }
      ],
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 100,
    "items_per_page": 20
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
  "stock_quantity": 25,
  "weight": 1.4,
  "dimensions": "31.26 x 22.12 x 1.55 cm",
  "category_ids": [1, 2]
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
  "stock_quantity": 25,
  "weight": 1.4,
  "dimensions": "31.26 x 22.12 x 1.55 cm",
  "slug": "macbook-pro-m2",
  "status": "active",
  "seller_id": 2,
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
  "created_at": "2024-01-17T14:30:00Z"
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
  "stock_quantity": 50,
  "weight": 0.206,
  "dimensions": "147.5 x 71.5 x 7.85 mm",
  "slug": "iphone-14-pro",
  "status": "active",
  "seller": {
    "id": 2,
    "first_name": "John",
    "last_name": "Doe"
  },
  "categories": [
    {
      "id": 1,
      "name": "Electronics"
    }
  ],
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
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
  "stock_quantity": 30,
  "category_ids": [1]
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
  "stock_quantity": 30,
  "weight": 0.206,
  "slug": "iphone-14-pro-max",
  "status": "active",
  "categories": [
    {
      "id": 1,
      "name": "Electronics"
    }
  ],
  "updated_at": "2024-01-17T16:45:00Z"
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
      "parent_id": null,
      "children": [
        {
          "id": 2,
          "name": "Smartphones",
          "description": "Mobile phones and accessories",
          "parent_id": 1,
          "children": []
        }
      ],
      "created_at": "2024-01-10T09:00:00Z"
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
  "parent_id": 1
}
```

**Response Body**  
**(201 - Created)**

```json
{
  "id": 3,
  "name": "Laptops",
  "description": "Portable computers and accessories",
  "parent_id": 1,
  "created_at": "2024-01-17T10:15:00Z"
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
  "parent_id": null,
  "children": [
    {
      "id": 2,
      "name": "Smartphones",
      "description": "Mobile phones and accessories"
    }
  ],
  "product_count": 1250,
  "created_at": "2024-01-10T09:00:00Z"
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
  "parent_id": null,
  "updated_at": "2024-01-17T12:30:00Z"
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
    "user_id": 1,
    "items": [
      {
        "id": 1,
        "product": {
          "id": 1,
          "name": "iPhone 14 Pro",
          "price": 15000000,
          "stock_quantity": 50,
          "slug": "iphone-14-pro",
          "image_url": "https://example.com/images/iphone1.jpg"
        },
        "quantity": 2,
        "unit_price_at_add": 15000000,
        "total_price": 30000000,
        "selected_options": {},
        "created_at": "2024-01-17T10:30:00Z"
      }
    ],
    "subtotal": 30000000,
    "total_items": 2,
    "created_at": "2024-01-17T09:00:00Z",
    "updated_at": "2024-01-17T10:30:00Z"
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
  "product_id": 1,
  "quantity": 2,
  "selected_options": {
    "color": "Space Gray",
    "storage": "128GB"
  }
}
```

**Response Body**  
**(201 - Created)**

```json
{
  "cart_item": {
    "id": 1,
    "cart_id": 1,
    "product": {
      "id": 1,
      "name": "iPhone 14 Pro",
      "price": 15000000,
      "stock_quantity": 48,
      "slug": "iphone-14-pro"
    },
    "quantity": 2,
    "unit_price_at_add": 15000000,
    "total_price": 30000000,
    "selected_options": {
      "color": "Space Gray",
      "storage": "128GB"
    },
    "created_at": "2024-01-17T10:30:00Z"
  },
  "cart_summary": {
    "subtotal": 30000000,
    "total_items": 2
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
  "cart_item": {
    "id": 1,
    "cart_id": 1,
    "product": {
      "id": 1,
      "name": "iPhone 14 Pro",
      "price": 15000000,
      "stock_quantity": 47,
      "slug": "iphone-14-pro"
    },
    "quantity": 3,
    "unit_price_at_add": 15000000,
    "total_price": 45000000,
    "selected_options": {
      "color": "Space Gray",
      "storage": "128GB"
    },
    "updated_at": "2024-01-17T11:15:00Z"
  },
  "cart_summary": {
    "subtotal": 45000000,
    "total_items": 3
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
  "cart_summary": {
    "subtotal": 0,
    "total_items": 0
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
      "min_order_amount": 100000,
      "max_uses": 1000,
      "per_user_limit": 1,
      "start_at": "2024-01-01T00:00:00Z",
      "expires_at": "2024-12-31T23:59:59Z",
      "status": "active",
      "used_count": 245,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 3,
    "total_items": 50,
    "items_per_page": 20
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
  "min_order_amount": 200000,
  "max_uses": 500,
  "per_user_limit": 1,
  "start_at": "2024-01-01T00:00:00Z",
  "expires_at": "2024-01-31T23:59:59Z"
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
  "min_order_amount": 200000,
  "max_uses": 500,
  "per_user_limit": 1,
  "start_at": "2024-01-01T00:00:00Z",
  "expires_at": "2024-01-31T23:59:59Z",
  "status": "active",
  "used_count": 0,
  "created_at": "2024-01-17T14:30:00Z"
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
  "min_order_amount": 100000,
  "max_uses": 1000,
  "per_user_limit": 1,
  "start_at": "2024-01-01T00:00:00Z",
  "expires_at": "2024-12-31T23:59:59Z",
  "status": "active",
  "used_count": 245,
  "remaining_uses": 755,
  "user_usage_count": 0,
  "is_valid": true
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
  "coupon_code": "WELCOME2024",
  "order_amount": 500000
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
  "is_valid": true,
  "discount_amount": 50000,
  "final_amount": 450000,
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
  "shipping_address_id": 2,
  "payment_method_id": 1,
  "coupon_code": "WELCOME2024",
  "shipping_option": {
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
    "order_number": "DGN-2024-001",
    "status": "new",
    "user_id": 1,
    "items": [
      {
        "id": 1,
        "product": {
          "id": 1,
          "name": "iPhone 14 Pro",
          "sku": "IPH14PRO128"
        },
        "quantity": 2,
        "unit_price": 15000000,
        "discount_amount": 3000000,
        "tax_amount": 0,
        "total": 27000000
      }
    ],
    "subtotal": 30000000,
    "tax": 0,
    "shipping_fee": 15000,
    "discount_amount": 3000000,
    "total": 27015000,
    "coupon": {
      "id": 1,
      "code": "WELCOME2024"
    },
    "shipping_address": {
      "street1": "Jl. Thamrin No. 456",
      "city": "Jakarta",
      "province": "DKI Jakarta"
    },
    "created_at": "2024-01-17T15:30:00Z"
  },
  "payment_url": "https://app.midtrans.com/snap/v2/vtweb/...",
  "payment_token": "66e4fa55-fdac-4ef9-91b5-733b97d1b862"
}
```

**(400 - Validation Error)**

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "shipping_address_id",
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
      "order_number": "DGN-2024-001",
      "status": "paid",
      "subtotal": 30000000,
      "total": 27015000,
      "items_count": 2,
      "created_at": "2024-01-17T15:30:00Z",
      "updated_at": "2024-01-17T16:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 1,
    "total_items": 1,
    "items_per_page": 10
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
  "order_number": "DGN-2024-001",
  "status": "paid",
  "user_id": 1,
  "items": [
    {
      "id": 1,
      "product": {
        "id": 1,
        "name": "iPhone 14 Pro",
        "sku": "IPH14PRO128",
        "image_url": "https://example.com/images/iphone1.jpg"
      },
      "quantity": 2,
      "unit_price": 15000000,
      "discount_amount": 3000000,
      "tax_amount": 0,
      "total": 27000000
    }
  ],
  "subtotal": 30000000,
  "tax": 0,
  "shipping_fee": 15000,
  "discount_amount": 3000000,
  "total": 27015000,
  "coupon": {
    "id": 1,
    "code": "WELCOME2024"
  },
  "payment": {
    "id": 1,
    "amount": 27015000,
    "status": "success",
    "paid_at": "2024-01-17T16:00:00Z"
  },
  "shipment": {
    "id": 1,
    "courier": "jne",
    "tracking_number": "JNE1234567890",
    "status": "in_transit",
    "shipped_at": "2024-01-18T10:00:00Z"
  },
  "shipping_address": {
    "street1": "Jl. Thamrin No. 456",
    "city": "Jakarta",
    "province": "DKI Jakarta"
  },
  "created_at": "2024-01-17T15:30:00Z",
  "updated_at": "2024-01-18T10:00:00Z"
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
  "order_id": 1,
  "payment_method_id": 1
}
```

**Response Body**  
**(201 - Created)**

```json
{
  "payment": {
    "id": 1,
    "order_id": 1,
    "amount": 27015000,
    "currency": "IDR",
    "status": "pending",
    "created_at": "2024-01-17T15:45:00Z"
  },
  "payment_url": "https://app.midtrans.com/snap/v2/vtweb/...",
  "payment_token": "66e4fa55-fdac-4ef9-91b5-733b97d1b862",
  "expires_at": "2024-01-17T16:45:00Z"
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
  "transaction_time": "2024-01-17 16:00:00",
  "transaction_status": "capture",
  "transaction_id": "b91c16dd-d6d1-469e-9e32-9d8d4c2f8c96",
  "status_message": "midtrans payment notification",
  "status_code": "200",
  "signature_key": "85b34928e75e51e1ab...",
  "settlement_time": "2024-01-17 16:00:02",
  "payment_type": "credit_card",
  "order_id": "DGN-2024-001",
  "merchant_id": "G123456789",
  "gross_amount": "27015000.00"
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
    "order_id": 1,
    "courier": "jne",
    "tracking_number": "JNE1234567890",
    "status": "in_transit",
    "shipped_at": "2024-01-18T10:00:00Z",
    "estimated_delivery": "2024-01-20T17:00:00Z",
    "address": {
      "street1": "Jl. Thamrin No. 456",
      "city": "Jakarta",
      "province": "DKI Jakarta",
      "postal_code": "12346"
    },
    "tracking_history": [
      {
        "timestamp": "2024-01-18T10:00:00Z",
        "status": "picked_up",
        "description": "Package picked up from seller"
      },
      {
        "timestamp": "2024-01-18T14:30:00Z",
        "status": "in_transit",
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
- `sort` (optional): Sort by (newest, oldest, rating_high, rating_low)

**Response Body**  
**(200 - Success)**

```json
{
  "reviews": [
    {
      "id": 1,
      "user": {
        "id": 1,
        "first_name": "John",
        "last_name": "D."
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
      "created_at": "2024-01-20T14:30:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 5,
    "total_items": 50,
    "items_per_page": 10
  },
  "rating_summary": {
    "average_rating": 4.6,
    "total_reviews": 50,
    "rating_distribution": {
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
    "user_id": 1,
    "product_id": 1,
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
    "created_at": "2024-01-20T14:30:00Z"
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
    "user_id": 1,
    "items": [
      {
        "id": 1,
        "product": {
          "id": 1,
          "name": "iPhone 14 Pro",
          "price": 15000000,
          "stock_quantity": 50,
          "slug": "iphone-14-pro",
          "image_url": "https://example.com/images/iphone1.jpg",
          "rating": 4.8
        },
        "added_at": "2024-01-15T10:30:00Z"
      }
    ],
    "total_items": 1,
    "created_at": "2024-01-15T09:00:00Z"
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
  "product_id": 1
}
```

**Response Body**  
**(201 - Created)**

```json
{
  "wishlist_item": {
    "id": 1,
    "wishlist_id": 1,
    "product": {
      "id": 1,
      "name": "iPhone 14 Pro",
      "price": 15000000,
      "slug": "iphone-14-pro",
      "image_url": "https://example.com/images/iphone1.jpg"
    },
    "added_at": "2024-01-17T10:30:00Z"
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
- `is_read` (optional): Filter by read status (true/false)
- `type` (optional): Filter by notification type

**Response Body**  
**(200 - Success)**

```json
{
  "notifications": [
    {
      "id": 1,
      "type": "order_status_update",
      "text": "Your order DGN-2024-001 has been shipped",
      "payload": {
        "order_id": 1,
        "order_number": "DGN-2024-001",
        "status": "shipped"
      },
      "is_read": false,
      "created_at": "2024-01-18T10:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "total_pages": 2,
    "total_items": 25,
    "items_per_page": 20
  },
  "unread_count": 5
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
    "type": "order_status_update",
    "text": "Your order DGN-2024-001 has been shipped",
    "is_read": true,
    "updated_at": "2024-01-18T15:30:00Z"
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
    "external_apis": {
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
    "external_apis": {
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
