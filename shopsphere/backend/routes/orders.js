const express = require('express');
const pool = require('../db');
const router = express.Router();

const STATUSES = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];

// List orders with customer name and item count
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT o.order_id, c.name AS customer, o.order_date, o.status, o.total_amount,
             COUNT(oi.item_id) AS line_items,
             p.method AS payment_method, p.status AS payment_status
      FROM orders o
      JOIN customers c    ON c.customer_id = o.customer_id
      LEFT JOIN order_items oi ON oi.order_id = o.order_id
      LEFT JOIN payments p     ON p.order_id = o.order_id
      GROUP BY o.order_id, c.name, o.order_date, o.status, o.total_amount, p.method, p.status
      ORDER BY o.order_date DESC
    `);
    res.json(rows);
  } catch (err) { next(err); }
});

// Single order with its items
router.get('/:id', async (req, res, next) => {
  try {
    const [[order]] = await pool.query(
      `SELECT o.order_id, c.name AS customer, c.email, o.order_date, o.status, o.total_amount
       FROM orders o JOIN customers c ON c.customer_id = o.customer_id
       WHERE o.order_id = ?`,
      [req.params.id]
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const [items] = await pool.query(
      `SELECT oi.item_id, p.name AS product, oi.quantity, oi.unit_price,
              oi.quantity * oi.unit_price AS line_total
       FROM order_items oi JOIN products p ON p.product_id = oi.product_id
       WHERE oi.order_id = ?`,
      [req.params.id]
    );
    res.json({ ...order, items });
  } catch (err) { next(err); }
});

// Create order: runs as ONE transaction (order + items + stock update + payment)
router.post('/', async (req, res, next) => {
  const { customer_id, items, payment_method } = req.body;
  if (!customer_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'customer_id and at least one item are required' });
  }
  if (!['UPI', 'Card', 'COD'].includes(payment_method)) {
    return res.status(400).json({ error: 'payment_method must be UPI, Card or COD' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [orderResult] = await conn.query(
      "INSERT INTO orders (customer_id, status, total_amount) VALUES (?, 'Pending', 0)",
      [customer_id]
    );
    const orderId = orderResult.insertId;
    let total = 0;

    for (const line of items) {
      const qty = Number(line.quantity);
      if (!line.product_id || !Number.isInteger(qty) || qty <= 0) {
        throw Object.assign(new Error('Each item needs product_id and a positive whole quantity'), { status: 400 });
      }
      // Lock the product row so two orders cannot oversell the same stock
      const [[product]] = await conn.query(
        'SELECT product_id, name, price, stock FROM products WHERE product_id = ? FOR UPDATE',
        [line.product_id]
      );
      if (!product) throw Object.assign(new Error(`Product ${line.product_id} not found`), { status: 404 });
      if (product.stock < qty) {
        throw Object.assign(new Error(`Not enough stock for ${product.name} (available: ${product.stock})`), { status: 409 });
      }
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [orderId, product.product_id, qty, product.price]
      );
      await conn.query('UPDATE products SET stock = stock - ? WHERE product_id = ?', [qty, product.product_id]);
      total += qty * product.price;
    }

    await conn.query('UPDATE orders SET total_amount = ? WHERE order_id = ?', [total, orderId]);
    await conn.query(
      "INSERT INTO payments (order_id, method, amount, status) VALUES (?, ?, ?, 'Paid')",
      [orderId, payment_method, total]
    );

    await conn.commit();
    res.status(201).json({ order_id: orderId, total_amount: total });
  } catch (err) {
    await conn.rollback();
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  } finally {
    conn.release();
  }
});

// Update status. Cancelling restores stock and refunds the payment (also a transaction).
router.patch('/:id/status', async (req, res, next) => {
  const { status } = req.body;
  if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[order]] = await conn.query('SELECT status FROM orders WHERE order_id = ? FOR UPDATE', [req.params.id]);
    if (!order) {
      await conn.rollback();
      return res.status(404).json({ error: 'Order not found' });
    }
    if (order.status === 'Cancelled') {
      await conn.rollback();
      return res.status(409).json({ error: 'Cancelled orders cannot be changed' });
    }

    if (status === 'Cancelled') {
      await conn.query(
        `UPDATE products p
         JOIN order_items oi ON oi.product_id = p.product_id
         SET p.stock = p.stock + oi.quantity
         WHERE oi.order_id = ?`,
        [req.params.id]
      );
      await conn.query("UPDATE payments SET status = 'Refunded' WHERE order_id = ?", [req.params.id]);
    }
    await conn.query('UPDATE orders SET status = ? WHERE order_id = ?', [status, req.params.id]);

    await conn.commit();
    res.json({ updated: true });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
});

module.exports = router;
