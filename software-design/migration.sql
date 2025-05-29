-- Full DDL for a fresh Dagangan e‑commerce schema

-- 1. USERS
CREATE TABLE users (
  id             SERIAL        PRIMARY KEY,
  email          VARCHAR(255)  NOT NULL UNIQUE,
  password_hash  CHAR(60)      NOT NULL,
  role           VARCHAR(10)   NOT NULL CHECK (role IN ('buyer','seller','admin')),
  first_name     VARCHAR(50)   NOT NULL,
  last_name      VARCHAR(50),
  phone          VARCHAR(20),
  status         VARCHAR(10)   NOT NULL DEFAULT 'active' CHECK (status IN ('active','blocked')),
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 2. SELLER PROFILES (1:1 for seller-specific fields)
CREATE TABLE seller_profiles (
  user_id     INT           PRIMARY KEY
                            REFERENCES users(id) ON DELETE CASCADE,
  balance     NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 3. ADDRESSES
CREATE TABLE addresses (
  id           SERIAL        PRIMARY KEY,
  user_id      INT           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type         VARCHAR(10)   NOT NULL CHECK (type IN ('billing','shipping')),
  street1      VARCHAR(255)  NOT NULL,
  street2      VARCHAR(255),
  city         VARCHAR(100)  NOT NULL,
  province     VARCHAR(100),
  postal_code  VARCHAR(20),
  country      VARCHAR(100)  NOT NULL,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 4. PRODUCTS
CREATE TABLE products (
  id              SERIAL        PRIMARY KEY,
  seller_id       INT           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(200)  NOT NULL,
  description     TEXT,
  price           NUMERIC(12,2) NOT NULL,
  sku             VARCHAR(50)   NOT NULL UNIQUE,
  stock_quantity  INT           NOT NULL DEFAULT 0,
  weight          NUMERIC(8,3)  NOT NULL DEFAULT 0,
  dimensions      VARCHAR(100),
  slug            VARCHAR(100)  NOT NULL UNIQUE,
  status          VARCHAR(10)   NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 5. CATEGORIES
CREATE TABLE categories (
  id           SERIAL        PRIMARY KEY,
  name         VARCHAR(100)  NOT NULL,
  description  TEXT,
  parent_id    INT           REFERENCES categories(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 6. PRODUCT ↔ CATEGORY (M:N)
CREATE TABLE product_categories (
  product_id   INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id  INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id),
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 7. CARTS
CREATE TABLE carts (
  id           SERIAL        PRIMARY KEY,
  user_id      INT           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 8. CART ITEMS
CREATE TABLE cart_items (
  id                SERIAL        PRIMARY KEY,
  cart_id           INT           NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id        INT           NOT NULL REFERENCES products(id),
  quantity          INT           NOT NULL CHECK (quantity > 0),
  selected_options  JSONB,
  unit_price_at_add NUMERIC(12,2) NOT NULL,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 9. COUPONS / VOUCHERS
CREATE TABLE coupons (
  id                SERIAL        PRIMARY KEY,
  code              VARCHAR(50)   NOT NULL UNIQUE,
  type              VARCHAR(10)   NOT NULL CHECK (type IN ('percent','fixed')),
  value             NUMERIC(12,2) NOT NULL,
  min_order_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
  max_uses          INT           NOT NULL DEFAULT 0,
  per_user_limit    INT           NOT NULL DEFAULT 1,
  start_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
  expires_at        TIMESTAMPTZ,
  status            VARCHAR(10)   NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','disabled')),
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 10. ORDERS
CREATE TABLE orders (
  id            SERIAL        PRIMARY KEY,
  user_id       INT           NOT NULL REFERENCES users(id),
  order_number  VARCHAR(30)   NOT NULL UNIQUE,
  status        VARCHAR(20)   NOT NULL DEFAULT 'new' CHECK (status IN ('new','paid','shipped','delivered','closed')),
  subtotal      NUMERIC(12,2) NOT NULL,
  tax           NUMERIC(12,2) NOT NULL,
  shipping_fee  NUMERIC(12,2) NOT NULL,
  total         NUMERIC(12,2) NOT NULL,
  coupon_id     INT           REFERENCES coupons(id),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 11. ORDER ITEMS
CREATE TABLE order_items (
  id                SERIAL        PRIMARY KEY,
  order_id          INT           NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id        INT           NOT NULL REFERENCES products(id),
  quantity          INT           NOT NULL CHECK (quantity > 0),
  unit_price        NUMERIC(12,2) NOT NULL,
  discount_amount   NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_amount        NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 12. PAYMENT METHODS
CREATE TABLE payment_methods (
  id             SERIAL        PRIMARY KEY,
  user_id        INT           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type           VARCHAR(20)   NOT NULL CHECK (type IN ('card','wallet','bank')),
  provider       VARCHAR(50),
  masked_account VARCHAR(50),
  expires_at     DATE,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 13. PAYMENTS
CREATE TABLE payments (
  id                SERIAL        PRIMARY KEY,
  order_id          INT           NOT NULL REFERENCES orders(id),
  payment_method_id INT           REFERENCES payment_methods(id),
  amount            NUMERIC(12,2) NOT NULL,
  currency          CHAR(3)       NOT NULL DEFAULT 'IDR',
  status            VARCHAR(20)   NOT NULL CHECK (status IN ('pending','success','failed')),
  gateway_response  JSONB,
  paid_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 14. SHIPMENTS
CREATE TABLE shipments (
  id               SERIAL        PRIMARY KEY,
  order_id         INT           NOT NULL REFERENCES orders(id),
  address_id       INT           NOT NULL REFERENCES addresses(id),
  courier          VARCHAR(50),
  tracking_number  VARCHAR(100),
  shipped_at       TIMESTAMPTZ,
  delivered_at     TIMESTAMPTZ,
  status           VARCHAR(20)   NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_transit','delivered','returned')),
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 15. INVENTORY LOGS
CREATE TABLE inventory_logs (
  id            SERIAL        PRIMARY KEY,
  product_id    INT           NOT NULL REFERENCES products(id),
  change_amount INT           NOT NULL,
  reason        VARCHAR(50),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 16. WISHLISTS & ITEMS
CREATE TABLE wishlists (
  id           SERIAL        PRIMARY KEY,
  user_id      INT           NOT NULL REFERENCES users(id),
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE TABLE wishlist_items (
  id            SERIAL        PRIMARY KEY,
  wishlist_id   INT           NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  product_id    INT           NOT NULL REFERENCES products(id),
  added_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 17. REVIEWS & MEDIA
CREATE TABLE reviews (
  id            SERIAL        PRIMARY KEY,
  user_id       INT           NOT NULL REFERENCES users(id),
  product_id    INT           NOT NULL REFERENCES products(id),
  rating        SMALLINT      NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE TABLE review_media (
  id            SERIAL        PRIMARY KEY,
  review_id     INT           NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  media_type    VARCHAR(10)   NOT NULL CHECK (media_type IN ('image','video')),
  url           VARCHAR(255)  NOT NULL,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 18. AUDIT LOGS
CREATE TABLE audit_logs (
  id            SERIAL        PRIMARY KEY,
  user_id       INT           REFERENCES users(id),
  action        VARCHAR(100)  NOT NULL,
  object_type   VARCHAR(50),
  object_id     INT,
  meta          JSONB,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- 19. NOTIFICATIONS
CREATE TABLE notifications (
  id            SERIAL        PRIMARY KEY,
  user_id       INT           NOT NULL REFERENCES users(id),
  type          VARCHAR(50)   NOT NULL,
  payload       JSONB         NOT NULL,
  text          TEXT,
  is_read       BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);
