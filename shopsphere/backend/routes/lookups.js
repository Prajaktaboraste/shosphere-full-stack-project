const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/categories', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT category_id, name FROM categories ORDER BY name');
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/suppliers', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT supplier_id, name FROM suppliers ORDER BY name');
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/customers', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT customer_id, name, email, city FROM customers ORDER BY name');
    res.json(rows);
  } catch (err) { next(err); }
});

// Dashboard summary: several aggregates in one round trip
router.get('/dashboard', async (req, res, next) => {
  try {
    const [[totals]] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM customers)  AS customers,
        (SELECT COUNT(*) FROM products)   AS products,
        (SELECT COUNT(*) FROM orders)     AS orders,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status <> 'Cancelled') AS revenue,
        (SELECT COUNT(*) FROM products WHERE stock < 15) AS low_stock
    `);
    const [byStatus] = await pool.query(
      'SELECT status, COUNT(*) AS count FROM orders GROUP BY status ORDER BY count DESC'
    );
    const [recent] = await pool.query(`
      SELECT o.order_id, c.name AS customer, o.order_date, o.status, o.total_amount
      FROM orders o
      JOIN customers c ON c.customer_id = o.customer_id
      ORDER BY o.order_date DESC
      LIMIT 5
    `);
    res.json({ totals, byStatus, recent });
  } catch (err) { next(err); }
});

module.exports = router;
