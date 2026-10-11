const express = require('express');
const pool = require('../db');
const router = express.Router();

// Each report: a title, a short explanation of the SQL technique used, and the query itself.
const REPORTS = {
  'top-customers': {
    title: 'Top customers by spend',
    technique: 'JOIN + GROUP BY + HAVING',
    sql: `
      SELECT c.customer_id, c.name, c.city,
             COUNT(DISTINCT o.order_id) AS orders_placed,
             SUM(o.total_amount)        AS total_spent
      FROM customers c
      JOIN orders o ON o.customer_id = c.customer_id
      WHERE o.status <> 'Cancelled'
      GROUP BY c.customer_id, c.name, c.city
      HAVING SUM(o.total_amount) > 5000
      ORDER BY total_spent DESC`,
  },
  'monthly-revenue': {
    title: 'Monthly revenue with running total',
    technique: 'Subquery + window functions (SUM OVER, LAG)',
    sql: `
      SELECT month,
             revenue,
             SUM(revenue) OVER (ORDER BY month)           AS running_total,
             revenue - LAG(revenue) OVER (ORDER BY month) AS change_vs_prev_month
      FROM (
        SELECT DATE_FORMAT(order_date, '%Y-%m') AS month,
               SUM(total_amount)                AS revenue
        FROM orders
        WHERE status <> 'Cancelled'
        GROUP BY DATE_FORMAT(order_date, '%Y-%m')
      ) m
      ORDER BY month`,
  },
  'unsold-products': {
    title: 'Products never ordered',
    technique: 'Correlated subquery with NOT EXISTS',
    sql: `
      SELECT p.product_id, p.name, p.price, p.stock
      FROM products p
      WHERE NOT EXISTS (
        SELECT 1 FROM order_items oi WHERE oi.product_id = p.product_id
      )`,
  },
  'category-leaders': {
    title: 'Top 2 products in each category',
    technique: 'RANK() OVER (PARTITION BY ...)',
    sql: `
      SELECT category, product, units_sold, revenue, rank_in_category
      FROM (
        SELECT cat.name AS category,
               p.name   AS product,
               SUM(oi.quantity)                 AS units_sold,
               SUM(oi.quantity * oi.unit_price) AS revenue,
               RANK() OVER (PARTITION BY cat.category_id
                            ORDER BY SUM(oi.quantity * oi.unit_price) DESC) AS rank_in_category
        FROM order_items oi
        JOIN orders o       ON o.order_id = oi.order_id AND o.status <> 'Cancelled'
        JOIN products p     ON p.product_id = oi.product_id
        JOIN categories cat ON cat.category_id = p.category_id
        GROUP BY cat.category_id, cat.name, p.product_id, p.name
      ) ranked
      WHERE rank_in_category <= 2
      ORDER BY category, rank_in_category`,
  },
  'above-average-customers': {
    title: 'Customers with above-average order value',
    technique: 'Scalar subquery inside HAVING',
    sql: `
      SELECT c.name,
             ROUND(AVG(o.total_amount), 2) AS avg_order_value
      FROM customers c
      JOIN orders o ON o.customer_id = c.customer_id
      WHERE o.status <> 'Cancelled'
      GROUP BY c.customer_id, c.name
      HAVING AVG(o.total_amount) > (
        SELECT AVG(total_amount) FROM orders WHERE status <> 'Cancelled'
      )
      ORDER BY avg_order_value DESC`,
  },
  'low-stock': {
    title: 'Low-stock products and their suppliers',
    technique: 'JOIN + WHERE filter',
    sql: `
      SELECT p.name AS product, p.stock, s.name AS supplier, s.email AS supplier_email
      FROM products p
      JOIN suppliers s ON s.supplier_id = p.supplier_id
      WHERE p.stock < 15
      ORDER BY p.stock ASC`,
  },
  'customer-segments': {
    title: 'Customer segments by lifetime value',
    technique: 'CTE (WITH) + CASE + LEFT JOIN',
    sql: `
      WITH customer_value AS (
        SELECT c.customer_id, c.name,
               COALESCE(SUM(o.total_amount), 0) AS lifetime_value
        FROM customers c
        LEFT JOIN orders o ON o.customer_id = c.customer_id AND o.status <> 'Cancelled'
        GROUP BY c.customer_id, c.name
      )
      SELECT name, lifetime_value,
             CASE
               WHEN lifetime_value >= 10000 THEN 'Gold'
               WHEN lifetime_value >= 4000  THEN 'Silver'
               WHEN lifetime_value > 0      THEN 'Bronze'
               ELSE 'Inactive'
             END AS segment
      FROM customer_value
      ORDER BY lifetime_value DESC`,
  },
  'product-ratings': {
    title: 'Product ratings (2+ reviews)',
    technique: 'LEFT JOIN + GROUP BY + HAVING',
    sql: `
      SELECT p.name AS product,
             COUNT(r.review_id)      AS review_count,
             ROUND(AVG(r.rating), 2) AS avg_rating
      FROM products p
      LEFT JOIN reviews r ON r.product_id = p.product_id
      GROUP BY p.product_id, p.name
      HAVING COUNT(r.review_id) >= 2
      ORDER BY avg_rating DESC, review_count DESC`,
  },
};

// List available reports
router.get('/', (req, res) => {
  res.json(Object.entries(REPORTS).map(([key, r]) => ({ key, title: r.title, technique: r.technique })));
});

// Run one report
router.get('/:key', async (req, res, next) => {
  try {
    const report = REPORTS[req.params.key];
    if (!report) return res.status(404).json({ error: 'Unknown report' });
    const [rows] = await pool.query(report.sql);
    res.json({ title: report.title, technique: report.technique, sql: report.sql.replace(/^\n/, ''), rows });
  } catch (err) { next(err); }
});

module.exports = router;
