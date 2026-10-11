import { useEffect, useState } from 'react';

const STATUSES = ['Pending', 'Shipped', 'Delivered', 'Cancelled'];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null); // order detail
  const [message, setMessage] = useState(null);

  // New order form
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [lines, setLines] = useState([{ product_id: '', quantity: 1 }]);

  async function loadOrders() {
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) throw new Error('Failed to load orders');
      setOrders(await res.json());
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  async function loadProducts() {
    const res = await fetch('/api/products');
    if (res.ok) setProducts(await res.json());
  }

  useEffect(() => {
    loadOrders();
    loadProducts();
    fetch('/api/customers').then((r) => r.json()).then(setCustomers).catch(() => {});
  }, []);

  function updateLine(index, field, value) {
    setLines(lines.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  }

  const draftTotal = lines.reduce((sum, l) => {
    const p = products.find((x) => String(x.product_id) === String(l.product_id));
    return sum + (p ? p.price * (Number(l.quantity) || 0) : 0);
  }, 0);

  async function handleCreate(e) {
    e.preventDefault();
    setMessage(null);
    const items = lines
      .filter((l) => l.product_id)
      .map((l) => ({ product_id: Number(l.product_id), quantity: Number(l.quantity) }));
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: Number(customerId), payment_method: paymentMethod, items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not place order');
      setMessage({ type: 'ok', text: `Order #${data.order_id} placed (₹${Number(data.total_amount).toLocaleString('en-IN')})` });
      setCustomerId('');
      setLines([{ product_id: '', quantity: 1 }]);
      loadOrders();
      loadProducts(); // stock changed
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  async function openOrder(id) {
    try {
      const res = await fetch(`/api/orders/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load order');
      setSelected(data);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  async function changeStatus(id, status) {
    setMessage(null);
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not update status');
      setMessage({ type: 'ok', text: `Order #${id} is now ${status}` });
      loadOrders();
      loadProducts();
      openOrder(id);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  }

  return (
    <div>
      <h2>Orders</h2>
      {message && <div className={`msg ${message.type}`}>{message.text}</div>}

      <form className="card" onSubmit={handleCreate}>
        <h3>Place a new order</h3>
        <div className="form-grid">
          <label>Customer
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
              <option value="">Select...</option>
              {customers.map((c) => <option key={c.customer_id} value={c.customer_id}>{c.name} ({c.city})</option>)}
            </select>
          </label>
          <label>Payment method
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <option>UPI</option>
              <option>Card</option>
              <option>COD</option>
            </select>
          </label>
        </div>

        {lines.map((line, i) => (
          <div className="row" key={i}>
            <select value={line.product_id} onChange={(e) => updateLine(i, 'product_id', e.target.value)} required>
              <option value="">Select product...</option>
              {products.map((p) => (
                <option key={p.product_id} value={p.product_id} disabled={p.stock === 0}>
                  {p.name} - ₹{p.price} ({p.stock} in stock)
                </option>
              ))}
            </select>
            <input
              type="number" min="1" step="1" style={{ width: 90 }}
              value={line.quantity} onChange={(e) => updateLine(i, 'quantity', e.target.value)}
            />
            {lines.length > 1 && (
              <button type="button" className="btn danger small" onClick={() => setLines(lines.filter((_, j) => j !== i))}>
                Remove
              </button>
            )}
          </div>
        ))}

        <div className="row">
          <button type="button" className="btn secondary small" onClick={() => setLines([...lines, { product_id: '', quantity: 1 }])}>
            + Add another product
          </button>
          <strong>Total: ₹{draftTotal.toLocaleString('en-IN')}</strong>
        </div>
        <button className="btn" type="submit">Place order</button>
      </form>

      {selected && (
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0 }}>Order #{selected.order_id} - {selected.customer}</h3>
            <button className="btn secondary small" onClick={() => setSelected(null)}>Close</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Product</th><th>Qty</th><th>Unit price</th><th>Line total</th></tr></thead>
              <tbody>
                {selected.items.map((it) => (
                  <tr key={it.item_id}>
                    <td>{it.product}</td>
                    <td>{it.quantity}</td>
                    <td>₹{Number(it.unit_price).toLocaleString('en-IN')}</td>
                    <td>₹{Number(it.line_total).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <span>Status:</span>
            <select
              value={selected.status}
              disabled={selected.status === 'Cancelled'}
              onChange={(e) => changeStatus(selected.order_id, e.target.value)}
            >
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <strong>Total: ₹{Number(selected.total_amount).toLocaleString('en-IN')}</strong>
          </div>
          <p className="muted" style={{ margin: 0 }}>Cancelling an order restores stock and refunds the payment.</p>
        </div>
      )}

      <div className="card">
        <h3>All orders</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Order</th><th>Customer</th><th>Date</th><th>Items</th><th>Payment</th><th>Status</th><th>Total</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.order_id} className="clickable" onClick={() => openOrder(o.order_id)}>
                  <td>#{o.order_id}</td>
                  <td>{o.customer}</td>
                  <td>{new Date(o.order_date).toLocaleDateString('en-IN')}</td>
                  <td>{o.line_items}</td>
                  <td>
                    {o.payment_method
                      ? <>{o.payment_method} <span className={`badge ${o.payment_status}`}>{o.payment_status}</span></>
                      : <span className="muted">-</span>}
                  </td>
                  <td><span className={`badge ${o.status}`}>{o.status}</span></td>
                  <td>₹{Number(o.total_amount).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
