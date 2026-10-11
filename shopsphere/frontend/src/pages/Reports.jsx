import { useEffect, useState } from 'react';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [activeKey, setActiveKey] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/reports')
      .then((res) => {
        if (!res.ok) throw new Error('Could not load reports');
        return res.json();
      })
      .then((list) => {
        setReports(list);
        if (list.length) setActiveKey(list[0].key);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!activeKey) return;
    setLoading(true);
    setError('');
    fetch(`/api/reports/${activeKey}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Report failed');
        setResult(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [activeKey]);

  const columns = result && result.rows.length ? Object.keys(result.rows[0]) : [];

  return (
    <div>
      <h2>Reports</h2>
      <p className="muted">Each report runs a different kind of SQL query. The query is shown under the results.</p>
      {error && <div className="msg error">{error}</div>}

      <div className="reports-layout">
        <div>
          {reports.map((r) => (
            <button
              key={r.key}
              className={activeKey === r.key ? 'report-item active' : 'report-item'}
              onClick={() => setActiveKey(r.key)}
            >
              {r.title}
              <small>{r.technique}</small>
            </button>
          ))}
        </div>

        <div>
          {loading && <p className="muted">Running query...</p>}
          {result && !loading && (
            <>
              <div className="card">
                <h3>{result.title}</h3>
                <p className="muted" style={{ marginTop: 0 }}>{result.technique}</p>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>{columns.map((c) => <th key={c}>{c.replace(/_/g, ' ')}</th>)}</tr>
                    </thead>
                    <tbody>
                      {result.rows.map((row, i) => (
                        <tr key={i}>
                          {columns.map((c) => <td key={c}>{row[c] === null ? '-' : String(row[c])}</td>)}
                        </tr>
                      ))}
                      {result.rows.length === 0 && (
                        <tr><td className="muted">No rows returned</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <pre className="sql">{result.sql}</pre>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
