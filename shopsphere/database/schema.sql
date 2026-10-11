-- ShopSphere database schema (MySQL 8.0+)
-- Run: mysql -u root -p < schema.sql

DROP DATABASE IF EXISTS shopsphere;
CREATE DATABASE shopsphere CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shopsphere;

-- 1. Categories
CREATE TABLE categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(80) NOT NULL UNIQUE,
  description VARCHAR(255)
) ENGINE=InnoDB;

-- 2. Suppliers
CREATE TABLE suppliers (
  supplier_id INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  email       VARCHAR(120) NOT NULL UNIQUE,
  city        VARCHAR(80)
) ENGINE=InnoDB;

-- 3. Products
CREATE TABLE products (
  product_id  INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  category_id INT NOT NULL,
  supplier_id INT NOT NULL,
  price       DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  stock       INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(category_id),
  CONSTRAINT fk_products_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
  INDEX idx_products_category (category_id),
  INDEX idx_products_supplier (supplier_id)
) ENGINE=InnoDB;

-- 4. Customers
CREATE TABLE customers (
  customer_id INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  email       VARCHAR(120) NOT NULL UNIQUE,
  city        VARCHAR(80),
  joined_on   DATE NOT NULL
) ENGINE=InnoDB;

-- 5. Orders
CREATE TABLE orders (
  order_id     INT AUTO_INCREMENT PRIMARY KEY,
  customer_id  INT NOT NULL,
  order_date   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status       ENUM('Pending','Shipped','Delivered','Cancelled') NOT NULL DEFAULT 'Pending',
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
  INDEX idx_orders_customer (customer_id),
  INDEX idx_orders_date (order_date)
) ENGINE=InnoDB;

-- 6. Order items
CREATE TABLE order_items (
  item_id    INT AUTO_INCREMENT PRIMARY KEY,
  order_id   INT NOT NULL,
  product_id INT NOT NULL,
  quantity   INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_items_order   FOREIGN KEY (order_id)   REFERENCES orders(order_id) ON DELETE CASCADE,
  CONSTRAINT fk_items_product FOREIGN KEY (product_id) REFERENCES products(product_id),
  INDEX idx_items_order (order_id),
  INDEX idx_items_product (product_id)
) ENGINE=InnoDB;

-- 7. Payments
CREATE TABLE payments (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id   INT NOT NULL UNIQUE,
  method     ENUM('UPI','Card','COD') NOT NULL,
  amount     DECIMAL(12,2) NOT NULL,
  status     ENUM('Paid','Refunded','Failed') NOT NULL DEFAULT 'Paid',
  paid_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Reviews
CREATE TABLE reviews (
  review_id   INT AUTO_INCREMENT PRIMARY KEY,
  product_id  INT NOT NULL,
  customer_id INT NOT NULL,
  rating      TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     VARCHAR(255),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_product  FOREIGN KEY (product_id)  REFERENCES products(product_id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
  UNIQUE KEY uq_review (product_id, customer_id)
) ENGINE=InnoDB;
