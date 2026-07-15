import { useState } from 'react';
import { Link2, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { shortenUrl } from '../api';
import { ResultCard } from '../components/UIComponents';
import toast from 'react-hot-toast';

export default function Home() {
  const [url, setUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [title, setTitle] = useState('');
  const [expiresIn, setExpiresIn] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleShorten = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    try {
      const res = await shortenUrl({
        url: url.trim(),
        custom_code: customCode || undefined,
        title: title || undefined,
        expires_in_days: expiresIn ? parseInt(expiresIn) : undefined,
      });
      setResult(res.data);
      toast.success('URL shortened successfully!');
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Failed to shorten URL. Try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="hero">
        <div className="hero-badge">
          <Zap size={12} /> Powered by FastAPI + Redis
        </div>
        <h1>
          Shorten URLs,<br />
          <span className="gradient-text">Track Everything</span>
        </h1>
        <p>
          Create short, memorable links in seconds. Get real-time analytics on every click.
        </p>

        <div className="shorten-card">
          <form onSubmit={handleShorten}>
            <div className="url-input-row">
              <input
                className="input-field"
                type="text"
                placeholder="Paste your long URL here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? <span className="loading-spinner" /> : <Link2 size={16} />}
                {loading ? 'Shortening...' : 'Shorten'}
              </button>
            </div>

            <button
              type="button"
              className="advanced-toggle"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showAdvanced ? 'Hide' : 'Show'} advanced options
            </button>

            {showAdvanced && (
              <div className="advanced-options">
                <div className="input-group">
                  <label className="input-label">Custom alias (optional)</label>
                  <input
                    className="input-field"
                    type="text"
                    placeholder="e.g. my-brand"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Link title (optional)</label>
                  <input
                    className="input-field"
                    type="text"
                    placeholder="e.g. My Portfolio"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Expires in (days)</label>
                  <input
                    className="input-field"
                    type="number"
                    placeholder="e.g. 30"
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(e.target.value)}
                    min="1"
                  />
                </div>
              </div>
            )}
          </form>

          {result && <ResultCard result={result} />}
        </div>
      </div>

      {/* Features Row */}
      <div style={{ padding: '48px 40px 0', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, maxWidth: 720, margin: '0 auto' }}>
        {[
          { icon: '⚡', title: 'Lightning Fast', desc: 'Redis-cached redirects in <5ms' },
          { icon: '📊', title: 'Real-time Analytics', desc: 'Clicks, devices, referrers tracked live' },
          { icon: '🔒', title: 'Rate Protected', desc: '10 links/min per IP via Redis' },
        ].map((f) => (
          <div key={f.title} className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ fontSize: 24 }}>{f.icon}</span>
            <strong style={{ fontSize: 14 }}>{f.title}</strong>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
