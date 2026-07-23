import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import Links from './pages/Links';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import Redirect from './pages/Redirect';
import { AuthProvider, useAuth } from './context/AuthContext';
import './index.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              fontSize: 14,
            },
          }}
        />
        <Routes>
          {/* Public: short-link redirect — must be before the catch-all */}
          <Route path="/r/:code" element={<Redirect />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/*" 
            element={
              <PrivateRoute>
                <div className="app-container">
                  <Sidebar />
                  <main className="main-content">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/links" element={<Links />} />
                      <Route path="/analytics/:code" element={<Analytics />} />
                    </Routes>
                  </main>
                </div>
              </PrivateRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
