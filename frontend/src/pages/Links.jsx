import { useEffect, useState } from 'react';
import { getLinks, getStats } from '../api';
import { Link2, BarChart3, Clock, TrendingUp, Copy, QrCode, ExternalLink, RefreshCw } from 'lucide-react';
import { CopyButton, QRModal } from '../components/UIComponents';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div className="stat-info">
        <h3>{value ?? '—'}</h3>
        <p>{label}</p>
      </div>
    </div>
  );
}

export default function Links() {
  const [links, setLinks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qrUrl, setQrUrl] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const [linksRes, statsRes] = await Promise.all([getLinks(), getStats()]);
      setLinks(linksRes.data.links);
      setStats(statsRes.data);
    } catch {
      toast.error('Failed to load links.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div>
      <div className="page-header">
        <h2>My Links</h2>
        <p>Manage and track all your shortened URLs</p>
      </div>

      <div className="page-body">
        {/* Stats Row */}
        <div className="stats-grid">
          <StatCard icon={<Link2 size={20} />} label="Total Links" value={stats?.total_links} color="purple" />
          <StatCard icon={<TrendingUp size={20} />} label="Total Clicks" value={stats?.total_clicks} color="violet" />
          <StatCard icon={<Clock size={20} />} label="Links Today" value={stats?.links_today} color="cyan" />
          <StatCard icon={<BarChart3 size={20} />} label="Clicks Today" value={stats?.clicks_today} color="green" />
        </div>

        {/* Links Table */}
        <div className="table-card">
          <div className="table-header">
            <h3>All Links</h3>
            <button className="btn-secondary" onClick={load}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="loading-spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
              <p style={{ marginTop: 12 }}>Loading links...</p>
            </div>
          ) : links.length === 0 ? (
            <div className="empty-state">
              <Link2 size={48} />
              <p>No links yet. Go shorten something!</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Short Code</th>
                  <th>Original URL</th>
                  <th>Title</th>
                  <th>Clicks</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <tr key={link.code}>
                    <td>
                      <span className="short-code">/{link.code}</span>
                    </td>
                    <td>
                      <span className="original-url" title={link.original_url}>
                        {link.original_url}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                        {link.title || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-blue">{link.total_clicks ?? 0} clicks</span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                        {formatDate(link.created_at)}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button
                          className="icon-btn"
                          title="Copy link"
                          onClick={async () => {
                            await navigator.clipboard.writeText(link.short_url);
                            toast.success('Copied!');
                          }}
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          className="icon-btn"
                          title="QR Code"
                          onClick={() => setQrUrl(link.short_url)}
                        >
                          <QrCode size={14} />
                        </button>
                        <button
                          className="icon-btn"
                          title="Analytics"
                          onClick={() => navigate(`/analytics/${link.code}`)}
                        >
                          <BarChart3 size={14} />
                        </button>
                        <a href={link.short_url} target="_blank" rel="noreferrer">
                          <button className="icon-btn" title="Open link">
                            <ExternalLink size={14} />
                          </button>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {qrUrl && <QRModal url={qrUrl} onClose={() => setQrUrl(null)} />}
    </div>
  );
}
