import { useState } from 'react';
import Dashboard from './pages/Dashboard.jsx';
import Products from './pages/Products.jsx';
import Orders from './pages/Orders.jsx';
import Reports from './pages/Reports.jsx';

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'products', label: 'Products' },
  { key: 'orders', label: 'Orders' },
  { key: 'reports', label: 'Reports' },
];

export default function App() {
  const [tab, setTab] = useState('dashboard');

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">Shop<span>Sphere</span></div>
        <nav>
          {TABS.map((t) => (
            <button
              key={t.key}
              className={tab === t.key ? 'nav-btn active' : 'nav-btn'}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="content">
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'products' && <Products />}
        {tab === 'orders' && <Orders />}
        {tab === 'reports' && <Reports />}
      </main>
    </div>
  );
}
