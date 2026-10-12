
import { useState } from 'react';
import { supabase } from './supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-midnight-950 px-4 text-midnight-50">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md space-y-5 rounded-2xl border border-midnight-700 bg-midnight-900 p-8 shadow-2xl"
      >
        <div className="text-center">
          <div className="mb-4 text-sm font-semibold tracking-[0.25em] text-teal-400">
            CAMPUS PULSE AI
          </div>
          <h1 className="text-2xl font-bold">Staff Sign In</h1>
          <p className="mt-2 text-sm text-midnight-300">
            Sign in with your authorized staff account.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm">
            Staff email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-midnight-700 bg-midnight-950 px-3 py-3 outline-none focus:border-teal-400"
            placeholder="you@college.edu"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-midnight-700 bg-midnight-950 px-3 py-3 outline-none focus:border-teal-400"
            placeholder="Enter your password"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-teal-500 px-4 py-3 font-semibold text-midnight-950 hover:bg-teal-400 disabled:opacity-60"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <p className="text-center text-xs text-midnight-400">
          Access is for authorized staff only.
        </p>
      </form>
    </div>
  );
}
