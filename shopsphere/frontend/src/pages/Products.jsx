import { useEffect, useState } from 'react';

const EMPTY = { name: '', category_id: '', supplier_id: '', price: '', stock: '' };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState(null); // { type: 'ok' | 'error', text }

  async function loadProducts() {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (categoryFilter) params.set('category_id', categoryFilter);
    try {
      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load products');
      setProducts(await res.json());
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  useEffect(() => {
    fetch('/api/categories').then((r) => r.json()).then(setCategories).catch(() => {});
    fetch('/api/suppliers').then((r) => r.json()).then(setSuppliers).catch(() => {});
  }, []);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryFilter]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);
    const url = editingId ? `/api/products/${editingId}` : '/api/products';
    const method = editingId ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          stock: Number(form.stock),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setMessage({ type: 'ok', text: editingId ? 'Product updated' : 'Product added' });
      setForm(EMPTY);
      setEditingId(null);
      loadProducts();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  function startEdit(p) {
    setEditingId(p.product_id);
    setForm({
      name: p.name,
      category_id: p.category_id,
      supplier_id: p.supplier_id,
      price: p.price,
      stock: p.stock,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(p) {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    setMessage(null);
    try {
      const res = await fetch(`/api/products/${p.product_id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      setMessage({ type: 'ok', text: 'Product deleted' });
      loadProducts();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  return (
    <div>
      <h2>Products</h2>
      {message && <div className={`msg ${message.type}`}>{message.text}</div>}

      <form className="card" onSubmit={handleSubmit}>
        <h3>{editingId ? `Edit product #${editingId}` : 'Add product'}</h3>
        <div className="form-grid">
          <label>Name
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label>Category
            <select name="category_id" value={form.category_id} onChange={handleChange} required>
              <option value="">Select...</option>
              {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
            </select>
          </label>
          <label>Supplier
            <select name="supplier_id" value={form.supplier_id} onChange={handleChange} required>
              <option value="">Select...</option>
              {suppliers.map((s) => <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>)}
            </select>
          </label>
          <label>Price (₹)
            <input name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} required />
          </label>
          <label>Stock
            <input name="stock" type="number" min="0" step="1" value={form.stock} onChange={handleChange} required />
          </label>
        </div>
        <div className="row">
          <button className="btn" type="submit">{editingId ? 'Save changes' : 'Add product'}</button>
          {editingId && (
            <button className="btn secondary" type="button" onClick={() => { setEditingId(null); setForm(EMPTY); }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="card">
        <div className="row">
          <input placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
          </select>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>ID</th><th>Name</th><th>Category</th><th>Supplier</th><th>Price</th><th>Stock</th><th></th></tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.product_id}>
                  <td>{p.product_id}</td>
                  <td>{p.name}</td>
                  <td>{p.category}</td>
                  <td>{p.supplier}</td>
                  <td>₹{Number(p.price).toLocaleString('en-IN')}</td>
                  <td className={p.stock < 15 ? 'low' : ''}>{p.stock}</td>
                  <td>
                    <div className="row" style={{ margin: 0 }}>
                      <button className="btn secondary small" onClick={() => startEdit(p)}>Edit</button>
                      <button className="btn danger small" onClick={() => handleDelete(p)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan="7" className="muted">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
