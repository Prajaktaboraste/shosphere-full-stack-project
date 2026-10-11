# ShopSphere: Order Management and Sales Analytics

A full-stack project built around a **complex relational database**: 8 tables with foreign keys, and reports that use JOINs, subqueries, GROUP BY / HAVING, window functions and CTEs.

| Layer    | Tech                              |
|----------|-----------------------------------|
| Frontend | React 18 + Vite                   |
| Backend  | Node.js + Express + mysql2        |
| Database | MySQL 8.0+ (needed for window functions and CTEs) |

## Folder structure

```
shopsphere/
├── database/
│   ├── schema.sql      8 tables, keys, indexes, constraints
│   ├── seed.sql        sample data (8 customers, 12 products, 16 orders...)
│   └── queries.sql     the complex queries, runnable on their own
├── backend/
│   ├── server.js
│   ├── db.js           connection pool
│   └── routes/         products, orders, reports, lookups
└── frontend/
    └── src/pages/      Dashboard, Products, Orders, Reports
```

## Database tables

`categories`, `suppliers`, `products`, `customers`, `orders`, `order_items`, `payments`, `reviews`

Relationships: a product belongs to one category and one supplier; an order belongs to one customer and has many order items; each order has at most one payment; a customer can review a product once.

## How to run

1. **Database**
   ```
   mysql -u root -p < database/schema.sql
   mysql -u root -p shopsphere < database/seed.sql
   ```
2. **Backend**
   ```
   cd backend
   cp .env.example .env      # then put your MySQL password in .env
   npm install
   npm start                 # http://localhost:5000
   ```
3. **Frontend** (new terminal)
   ```
   cd frontend
   npm install
   npm run dev               # http://localhost:5173
   ```

Check the API at http://localhost:5000/api/health.

## Features

- **Dashboard**: revenue, order counts, low-stock alert, recent orders
- **Products**: add, edit, delete, search and filter by category
- **Orders**: place orders with several items; a database **transaction** creates the order, items and payment and reduces stock together (rolls back on any error, row locks prevent overselling). Cancelling restores stock and refunds the payment.
- **Reports**: 8 reports, each showing its SQL and the technique used

## SQL concepts covered

| Report | Concept |
|--------|---------|
| Top customers | JOIN, GROUP BY, HAVING |
| Monthly revenue | Subquery, SUM() OVER, LAG() |
| Unsold products | Correlated subquery, NOT EXISTS |
| Category leaders | RANK() OVER (PARTITION BY) |
| Above-average customers | Scalar subquery in HAVING |
| Low stock | JOIN with filter |
| Customer segments | CTE, CASE, LEFT JOIN |
| Product ratings | LEFT JOIN, GROUP BY, HAVING |

## API summary

| Method | Route | Purpose |
|--------|-------|---------|
| GET | /api/dashboard | summary numbers |
| GET/POST | /api/products | list / create |
| PUT/DELETE | /api/products/:id | update / delete |
| GET/POST | /api/orders | list / place order (transaction) |
| GET | /api/orders/:id | order with items |
| PATCH | /api/orders/:id/status | change status |
| GET | /api/reports, /api/reports/:key | list / run report |
| GET | /api/categories, /api/suppliers, /api/customers | dropdown data |

## Ideas to extend

Add login with JWT, an admin role, pagination, charts on the dashboard, or a stored procedure for placing orders.
