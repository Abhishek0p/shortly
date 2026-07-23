import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

/**
 * Handles short-link redirects at the Vercel (frontend) level.
 * When someone opens https://your-app.vercel.app/JV2rTN, this component
 * calls the FastAPI backend which returns a 302 redirect, causing the
 * browser to follow through to the original URL.
 */
export default function Redirect() {
  const { code } = useParams();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    if (code) {
      // Navigate the entire browser window to the backend redirect endpoint.
      // The backend will 302 → original URL and log the click.
      window.location.replace(`${API_URL}/${code}`);
    }
  }, [code]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      color: 'var(--text-secondary)',
      gap: 16,
      fontFamily: 'var(--font)',
    }}>
      <div style={{
        width: 40,
        height: 40,
        border: '3px solid var(--accent)',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ fontSize: 15 }}>Redirecting you…</p>
    </div>
  );
}
