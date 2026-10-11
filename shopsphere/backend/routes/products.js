const express = require('express');
const pool = require('../db');
const router = express.Router();

function validate(body) {
  const { name, category_id, supplier_id, price, stock } = body;
  if (!name || !String(name).trim()) return 'Name is required';
  if (!category_id || !supplier_id) return 'Category and supplier are required';
  if (price === undefined || Number(price) < 0 || Number.isNaN(Number(price))) return 'Price must be 0 or more';
  if (stock === undefined || !Number.isInteger(Number(stock)) || Number(stock) < 0) return 'Stock must be a whole number, 0 or more';
  return null;
}

// List products (optional ?search= and ?category_id=)
router.get('/', async (req, res, next) => {
  try {
    const { search, category_id } = req.query;
    const where = [];
    const params = [];
    if (search) { where.push('p.name LIKE ?'); params.push(`%${search}%`); }
    if (category_id) { where.push('p.category_id = ?'); params.push(category_id); }

    const [rows] = await pool.query(
      `SELECT p.product_id, p.name, p.price, p.stock,
              p.category_id, c.name AS category,
              p.supplier_id, s.name AS supplier
       FROM products p
       JOIN categories c ON c.category_id = p.category_id
       JOIN suppliers  s ON s.supplier_id = p.supplier_id
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY p.product_id`,
      params
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const error = validate(req.body);
    if (error) return res.status(400).json({ error });
    const { name, category_id, supplier_id, price, stock } = req.body;
    const [result] = await pool.query(
      'INSERT INTO products (name, category_id, supplier_id, price, stock) VALUES (?, ?, ?, ?, ?)',
      [name.trim(), category_id, supplier_id, price, stock]
    );
    res.status(201).json({ product_id: result.insertId });
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const error = validate(req.body);
    if (error) return res.status(400).json({ error });
    const { name, category_id, supplier_id, price, stock } = req.body;
    const [result] = await pool.query(
      'UPDATE products SET name=?, category_id=?, supplier_id=?, price=?, stock=? WHERE product_id=?',
      [name.trim(), category_id, supplier_id, price, stock, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Product not found' });
    res.json({ updated: true });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM products WHERE product_id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Product not found' });
    res.json({ deleted: true });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ error: 'Cannot delete: this product appears in existing orders' });
    }
    next(err);
  }
});

module.exports = router;
