import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => {
        if (!res.ok) throw new Error('Could not load dashboard');
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="msg error">{error}. Is the backend running on port 5000?</div>;
  if (!data) return <p className="muted">Loading...</p>;

  const { totals, byStatus, recent } = data;

  return (
    <div>
      <h2>Dashboard</h2>
      <div className="grid">
        <div className="stat"><div className="label">Revenue</div><div className="value">₹{Number(totals.revenue).toLocaleString('en-IN')}</div></div>
        <div className="stat"><div className="label">Orders</div><div className="value">{totals.orders}</div></div>
        <div className="stat"><div className="label">Customers</div><div className="value">{totals.customers}</div></div>
        <div className="stat"><div className="label">Products</div><div className="value">{totals.products}</div></div>
        <div className="stat"><div className="label">Low stock items</div><div className={totals.low_stock > 0 ? 'value low' : 'value'}>{totals.low_stock}</div></div>
      </div>

      <div className="card">
        <h3>Orders by status</h3>
        <div className="row">
          {byStatus.map((s) => (
            <span key={s.status} className={`badge ${s.status}`}>{s.status}: {s.count}</span>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Recent orders</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Order</th><th>Customer</th><th>Date</th><th>Status</th><th>Total</th></tr>
            </thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.order_id}>
                  <td>#{o.order_id}</td>
                  <td>{o.customer}</td>
                  <td>{new Date(o.order_date).toLocaleDateString('en-IN')}</td>
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
