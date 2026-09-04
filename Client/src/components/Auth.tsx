import React, { useState } from 'react';

interface AuthProps {
  setToken: (token: string) => void;
}

const Auth: React.FC<AuthProps> = ({ setToken }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = isLogin ? { email, password } : { name, email, password };

      const res = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      if (isLogin) {
        // Successful login
        localStorage.setItem('token', data.token);
        // ADDED: Storing the user data in localStorage so we can display the user's name/initials in the UI
        localStorage.setItem('user', JSON.stringify(data.user)); 
        setToken(data.token);
      } else {
        // Successful registration
        setIsLogin(true); // Switch to login view
        setPassword(''); // Clear password for safety
        alert('Registration successful! Please log in.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#111827] w-screen h-screen flex flex-col justify-center items-center">
      <div className="bg-[#1F2937] p-8 rounded-xl shadow-lg w-96 max-w-[90%] border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-gray-400 text-sm mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#374151] text-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 border border-transparent"
                placeholder="John Doe"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-gray-400 text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#374151] text-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 border border-transparent"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#374151] text-white rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500 border border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors mt-2 disabled:opacity-50"
          >
            {isLoading ? 'Processing...' : (isLogin ? 'Log In' : 'Register')}
          </button>
        </form>

        <p className="text-gray-400 text-sm text-center mt-6">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
