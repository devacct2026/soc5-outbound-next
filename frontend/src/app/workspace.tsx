'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';

type Profile = { id: string; email: string | null; role: string | null };

let browserClient: SupabaseClient | undefined;

function getBrowserClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return null;
  browserClient ??= createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  return browserClient;
}

export default function Workspace() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  useEffect(() => {
    const client = getBrowserClient();
    if (!client) return;

    let active = true;
    const loadProfile = async (token?: string) => {
      if (!token) {
        if (active) setProfile(null);
        return;
      }
      try {
        const response = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (!response.ok) {
          throw new Error(response.status === 403
            ? 'Your account does not have an operational role.'
            : 'Your session could not be verified. Please sign in again.');
        }
        const user = await response.json() as Profile;
        if (active) {
          setProfile(user);
          setError('');
        }
      } catch (reason) {
        if (active) {
          setProfile(null);
          setError(reason instanceof Error ? reason.message : 'Unable to verify session.');
        }
      }
    };

    void client.auth.getSession().then(({ data }) => {
      void loadProfile(data.session?.access_token);
    });
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      void loadProfile(session?.access_token);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setPending(true);
    try {
      const client = getBrowserClient();
      if (!client) throw new Error('Supabase authentication is not configured.');
      const { error: signInError } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw new Error('Email or password was not accepted.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to sign in.');
    } finally {
      setPending(false);
    }
  }

  async function signOut() {
    const client = getBrowserClient();
    if (!client) return;
    await client.auth.signOut();
    setProfile(null);
    setPassword('');
  }

  return (
    <main className="workspace">
      <section className="identity-panel" aria-label="SOC5 Outbound">
        <div className="identity-mark">S5<span>/</span>O</div>
        <div className="identity-copy">
          <p className="eyebrow">OPERATIONS CONTROL</p>
          <h1>SOC5<br />Outbound</h1>
          <p className="identity-caption">Truck request coordination</p>
        </div>
        <div className="identity-footer">
          <span className="status-light" />
          <span>MANILA OPERATIONS</span>
          <span className="identity-timezone">UTC+08</span>
        </div>
      </section>

      <section className="session-panel">
        <div className="session-topline">
          <span>WORKSPACE ACCESS</span>
          <span className="session-environment">DEVELOPMENT</span>
        </div>
        {profile ? (
          <div className="session-content" aria-live="polite">
            <p className="eyebrow">SESSION VERIFIED</p>
            <h2>Welcome back</h2>
            <p className="session-description">Your account is authenticated with SOC5 Outbound.</p>
            <dl className="profile-details">
              <div><dt>Account</dt><dd>{profile.email ?? profile.id}</dd></div>
              <div><dt>Operational role</dt><dd>{profile.role ?? 'Not assigned'}</dd></div>
            </dl>
            {!profile.role && <p className="error-message">An administrator must assign your operational role.</p>}
            <button className="secondary-button" onClick={() => void signOut()} type="button">Sign out</button>
          </div>
        ) : (
          <div className="session-content">
            <p className="eyebrow">SECURE SIGN IN</p>
            <h2>Access your<br />operations workspace</h2>
            <p className="session-description">Use your assigned SOC5 account to continue.</p>
            {!configured ? (
              <p className="error-message" role="alert">Supabase authentication is not configured.</p>
            ) : (
              <form className="sign-in-form" onSubmit={signIn}>
                <label htmlFor="email">Work email</label>
                <input autoComplete="username" id="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
                <label htmlFor="password">Password</label>
                <input autoComplete="current-password" id="password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} />
                {error && <p className="error-message" role="alert">{error}</p>}
                <button className="primary-button" disabled={pending} type="submit">
                  {pending ? 'Verifying...' : 'Sign in'}<span aria-hidden="true">→</span>
                </button>
              </form>
            )}
          </div>
        )}
        <footer className="session-footer">
          <span>Asia/Manila</span><span>Access is role controlled</span>
        </footer>
      </section>
    </main>
  );
}