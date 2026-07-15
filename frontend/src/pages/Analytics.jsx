import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAnalytics } from '../api';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { ArrowLeft, TrendingUp, MousePointer, Calendar, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 8, padding: '10px 14px', fontSize: 13,
      }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>{label}</p>
        <p style={{ color: 'var(--accent)', fontWeight: 600 }}>
          {payload[0].value} clicks
        </p>
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getAnalytics(code);
        setData(res.data);
      } catch {
        toast.error('Analytics not found.');
        navigate('/links');
      } finally {
        setLoading(false);
      }
    })();
  }, [code]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <div className="loading-spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      <div className="page-header">
        <div className="analytics-header">
          <button className="back-btn" onClick={() => navigate('/links')}>
            <ArrowLeft size={14} /> Back
          </button>
          <div>
            <h2>/{code} Analytics</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 600 }}>
              {data.original_url}
            </p>
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* KPI Row */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', maxWidth: 720 }}>
          {[
            { icon: <MousePointer size={20} />, label: 'Total Clicks', value: data.total_clicks, color: 'purple' },
            { icon: <Calendar size={20} />, label: 'Created', value: new Date(data.created_at).toLocaleDateString(), color: 'cyan' },
            { icon: <TrendingUp size={20} />, label: 'Unique Days', value: data.clicks_by_day?.length, color: 'green' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className={`stat-icon ${s.color}`}>{s.icon}</div>
              <div className="stat-info">
                <h3>{s.value ?? '—'}</h3>
                <p>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Clicks Over Time Chart */}
        <div className="chart-card" style={{ marginBottom: 16 }}>
          <h3>Clicks Over Time</h3>
          {data.clicks_by_day?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.clicks_by_day} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="clickGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 11 }} />
                <YAxis stroke="#475569" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="clicks" stroke="#6366f1" fill="url(#clickGrad)" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state"><p>No click data yet.</p></div>
          )}
        </div>

        {/* Device & Browser Charts */}
        <div className="charts-grid">
          <div className="chart-card">
            <h3>Clicks by Browser</h3>
            {data.clicks_by_browser?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.clicks_by_browser} layout="vertical" margin={{ left: 20, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" stroke="#475569" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="browser" stroke="#475569" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  <Bar dataKey="clicks" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state"><p>No data yet.</p></div>
            )}
          </div>

          <div className="chart-card">
            <h3>Clicks by Device</h3>
            {data.clicks_by_device?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data.clicks_by_device}
                    dataKey="clicks"
                    nameKey="device"
                    cx="50%" cy="50%"
                    outerRadius={70}
                    label={({ device, percent }) => `${device} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {data.clicks_by_device.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state"><p>No data yet.</p></div>
            )}
          </div>
        </div>

        {/* Recent Clicks */}
        {data.recent_clicks?.length > 0 && (
          <div className="table-card" style={{ marginTop: 16 }}>
            <div className="table-header"><h3>Recent Clicks</h3></div>
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Device</th>
                  <th>Browser</th>
                  <th>OS</th>
                  <th>Referrer</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_clicks.map((click, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {new Date(click.clicked_at).toLocaleString()}
                    </td>
                    <td><span className="badge badge-blue">{click.device}</span></td>
                    <td style={{ fontSize: 13 }}>{click.browser}</td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{click.os}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {click.referrer || 'Direct'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
