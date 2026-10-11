-- ShopSphere sample data. Run after schema.sql:
-- mysql -u root -p shopsphere < seed.sql

USE shopsphere;

INSERT INTO categories (name, description) VALUES
 ('Electronics',    'Gadgets and accessories'),
 ('Books',          'Technical and general books'),
 ('Home & Kitchen', 'Appliances and utilities'),
 ('Fashion',        'Clothing and footwear');

INSERT INTO suppliers (name, email, city) VALUES
 ('TechWorld Distributors', 'sales@techworld.example',  'Pune'),
 ('HomeNest Traders',       'contact@homenest.example', 'Mumbai'),
 ('Bright Retail Co.',      'hello@brightretail.example', 'Nashik');

INSERT INTO products (name, category_id, supplier_id, price, stock) VALUES
 ('Wireless Mouse',       1, 1,  799.00, 120),
 ('Mechanical Keyboard',  1, 1, 3499.00,  45),
 ('Bluetooth Speaker',    1, 2, 2499.00,  60),
 ('USB-C Hub',            1, 1, 1299.00,   8),
 ('Python Crash Course',  2, 3,  599.00,  80),
 ('Clean Code',           2, 3,  899.00,   5),
 ('Database Systems',     2, 3, 1099.00,  30),
 ('Air Fryer',            3, 2, 4999.00,  25),
 ('Coffee Maker',         3, 2, 2999.00,  12),
 ('Cotton T-Shirt',       4, 3,  499.00, 200),
 ('Denim Jacket',         4, 3, 2199.00,  40),
 ('Running Shoes',        4, 2, 3299.00,   3);

INSERT INTO customers (name, email, city, joined_on) VALUES
 ('Aarav Sharma',  'aarav@example.com',  'Pune',      '2025-11-10'),
 ('Diya Patil',    'diya@example.com',   'Sangamner', '2025-12-02'),
 ('Rohan Kulkarni','rohan@example.com',  'Nashik',    '2026-01-15'),
 ('Sneha Joshi',   'sneha@example.com',  'Mumbai',    '2026-01-28'),
 ('Karan Mehta',   'karan@example.com',  'Pune',      '2026-02-14'),
 ('Isha Deshmukh', 'isha@example.com',   'Nagpur',    '2026-03-01'),
 ('Vikram Rao',    'vikram@example.com', 'Hyderabad', '2026-04-20'),
 ('Neha Singh',    'neha@example.com',   'Delhi',     '2026-06-05');

INSERT INTO orders (customer_id, order_date, status) VALUES
 (1, '2026-01-12 10:15:00', 'Delivered'),
 (2, '2026-01-20 14:30:00', 'Delivered'),
 (3, '2026-02-05 09:45:00', 'Delivered'),
 (1, '2026-02-18 18:10:00', 'Delivered'),
 (4, '2026-03-03 11:00:00', 'Delivered'),
 (5, '2026-03-15 16:20:00', 'Delivered'),
 (2, '2026-04-09 13:05:00', 'Delivered'),
 (6, '2026-04-22 20:40:00', 'Delivered'),
 (1, '2026-05-11 12:25:00', 'Delivered'),
 (7, '2026-06-02 10:00:00', 'Delivered'),
 (3, '2026-06-25 15:35:00', 'Delivered'),
 (4, '2026-07-14 19:50:00', 'Delivered'),
 (8, '2026-08-08 08:55:00', 'Shipped'),
 (2, '2026-09-01 17:15:00', 'Shipped'),
 (5, '2026-09-20 12:45:00', 'Pending'),
 (6, '2026-09-28 21:05:00', 'Cancelled');

INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
 (1, 1, 2,  799.00), (1, 5, 1,  599.00),
 (2, 3, 1, 2499.00), (2, 10, 3, 499.00),
 (3, 8, 1, 4999.00),
 (4, 2, 1, 3499.00), (4, 1, 1,  799.00),
 (5, 7, 2, 1099.00), (5, 6, 1,  899.00),
 (6, 11, 1, 2199.00), (6, 10, 2, 499.00),
 (7, 9, 1, 2999.00), (7, 4, 1, 1299.00),
 (8, 3, 2, 2499.00),
 (9, 2, 1, 3499.00), (9, 8, 1, 4999.00), (9, 5, 2, 599.00),
 (10, 10, 5, 499.00),
 (11, 7, 1, 1099.00), (11, 1, 2, 799.00),
 (12, 11, 2, 2199.00), (12, 3, 1, 2499.00),
 (13, 9, 1, 2999.00), (13, 6, 2, 899.00),
 (14, 4, 2, 1299.00), (14, 1, 1,  799.00),
 (15, 5, 3,  599.00),
 (16, 8, 1, 4999.00);

-- Compute order totals from their items
UPDATE orders o
SET o.total_amount = (
  SELECT COALESCE(SUM(oi.quantity * oi.unit_price), 0)
  FROM order_items oi
  WHERE oi.order_id = o.order_id
)
WHERE o.order_id > 0;

-- Payments for every order except Pending ones
INSERT INTO payments (order_id, method, amount, status, paid_at)
SELECT order_id,
       ELT(MOD(order_id, 3) + 1, 'UPI', 'Card', 'COD'),
       total_amount,
       IF(status = 'Cancelled', 'Refunded', 'Paid'),
       order_date
FROM orders
WHERE status <> 'Pending';

INSERT INTO reviews (product_id, customer_id, rating, comment) VALUES
 (1, 1, 5, 'Smooth and reliable'),
 (1, 2, 4, 'Good value'),
 (2, 1, 5, 'Great typing feel'),
 (3, 2, 4, 'Loud and clear'),
 (3, 6, 3, 'Battery could be better'),
 (3, 3, 5, 'Excellent sound'),
 (4, 2, 2, 'Runs hot'),
 (5, 1, 5, 'Best beginner book'),
 (6, 4, 3, 'Good but dense'),
 (7, 4, 5, 'Perfect for exams'),
 (7, 3, 4, 'Very thorough'),
 (8, 1, 4, 'Cooks evenly'),
 (8, 3, 5, 'Love it'),
 (9, 2, 4, 'Makes great coffee'),
 (10, 2, 4, 'Soft fabric'),
 (10, 7, 5, 'Great fit'),
 (10, 5, 3, 'Shrinks a little'),
 (11, 5, 4, 'Stylish'),
 (11, 4, 5, 'Perfect jacket');
