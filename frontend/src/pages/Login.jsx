import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';

export default function Login() {
  const { user, signInWithGoogle } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-icon">
            <LogIn size={32} />
          </div>
          <h1>Welcome Back</h1>
          <p>Sign in to manage your short links</p>
        </div>
        
        <div className="login-actions">
          <button 
            className="google-btn"
            onClick={signInWithGoogle}
          >
            <img 
              src="https://www.svgrepo.com/show/475656/google-color.svg" 
              alt="Google" 
              className="google-icon"
            />
            Continue with Google
          </button>
        </div>
        
        <div className="login-footer">
          <p>By signing in, you agree to our Terms of Service and Privacy Policy.</p>
        </div>
      </div>
    </div>
  );
}
