import { useState } from 'react';
import { Link2, BarChart3, Home, ExternalLink, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();

  const links = [
    { icon: <Home size={18} />, label: 'Shorten', path: '/' },
    { icon: <Link2 size={18} />, label: 'My Links', path: '/links' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>⚡ Shrinkify</h1>
        <p>URL Shortener</p>
      </div>
      <nav className="sidebar-nav">
        {links.map((l) => (
          <button
            key={l.path}
            className={`nav-link ${location.pathname === l.path ? 'active' : ''}`}
            onClick={() => navigate(l.path)}
          >
            {l.icon}
            <span>{l.label}</span>
          </button>
        ))}
        <a
          href="http://localhost:8000/docs"
          target="_blank"
          rel="noreferrer"
          className="nav-link"
          style={{ marginTop: 'auto' }}
        >
          <ExternalLink size={18} />
          <span>API Docs</span>
        </a>
        <button className="nav-link" onClick={signOut}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </nav>
    </aside>
  );
}
