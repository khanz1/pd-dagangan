**Describing tables and relations**

The user is asking for a descriptive, concise narrative about multiple tables — to explain each one's purpose and key relationships. I need to describe each table’s role, key columns, and the relationships between them without using code. I’ll cover all tables — like users, seller profiles, addresses, products, categories, carts,

Thought for 4 seconds

Below is a concise “story” of how data flows through Dagangan’s core tables, and how each relates to the others:

---

### 1. `users` & `seller_profiles`

* **users** holds every account (buyer, seller, admin) with login credentials and basic profile info.
* Sellers get a **1:1** extension in  **seller_profiles** , where `user_id` links back and tracks their `balance`, separate from buyers.

### 2. `addresses`

* Stores both billing and shipping addresses for any user (`user_id → users.id`).
* Shipments reference these for delivery; orders can snapshot the address at checkout if desired.

### 3. `products`, `categories`, `product_categories`

* **products** are listed by sellers (`seller_id → users.id`), with SKU, price, stock, and a unique URL `slug`.
* **categories** form a tree via `parent_id`; the many-to-many join **product_categories** tags each product into one or more categories.

### 4. `carts` & `cart_items`

* Each buyer’s in-progress shopping basket is a **cart** (`user_id → users.id`), with **cart_items** linking products and quantities, plus a price snapshot.

### 5. `coupons`

* Site-wide or per-order vouchers defined here; orders can reference `coupon_id → coupons.id` to apply discounts at checkout.

### 6. `orders` & `order_items`

* Once a buyer checks out, an **order** is created (`user_id → users.id`) recording totals, applied coupon, and status.
* **order_items** freeze each product’s `unit_price`, quantity, discounts and tax for that transaction.

### 7. `payment_methods` & `payments`

* Buyers/stores save reusable **payment_methods** (`user_id → users.id`), then each **payment** links back (`order_id → orders.id`, `payment_method_id → payment_methods.id`) and logs gateway responses.

### 8. `shipments`

* After an order is paid, a **shipment** is created (`order_id → orders.id`) pointing to the delivery **address** and tracking details.

### 9. `inventory_logs`

* Every stock change—sale, restock or correction—is recorded here (`product_id → products.id`) so you can audit inventory history.

### 10. `wishlists` & `wishlist_items`

* Buyers can bookmark products in a personal **wishlist** (`user_id → users.id`) and add multiple **wishlist_items** for later purchase.

### 11. `reviews` & `review_media`

* Post-delivery, buyers leave a **review** (`user_id → users.id`, `product_id → products.id`) with star rating and optional photos/videos in  **review_media** .

### 12. `audit_logs`

* Captures every significant system event (who did what to which object when), tying `user_id` to an `action` on a given `object_type` and `object_id`.

### 13. `notifications`

* In-app or email alerts for users (`user_id → users.id`), carrying structured `payload` plus free-form `text`, and a read-status flag.

---

Together, these tables model the end-to-end e-commerce lifecycle: user onboarding → catalog management → cart → checkout (with coupons) → payment → shipping → post-purchase reviews, while capturing audit trails and notifications along the way.
