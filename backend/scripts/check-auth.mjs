import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const base = 'http://localhost:3001/api';

async function request(path, token) {
  return fetch(`${base}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    signal: AbortSignal.timeout(15000),
  });
}

assert.equal((await request('/health')).status, 200);
console.log('PASS: Health endpoint is public.');

assert.equal((await request('/auth/me')).status, 401);
console.log('PASS: Missing token is rejected.');

assert.equal((await request('/auth/me', 'invalid-token')).status, 401);
console.log('PASS: Invalid token is rejected.');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
);

const { data, error } = await supabase.auth.signInWithPassword({
  email: process.env.SOC5_TEST_EMAIL,
  password: process.env.SOC5_TEST_PASSWORD,
});

if (error) throw new Error(`Test login failed: ${error.message}`);
if (!data.session) throw new Error('Test login returned no session.');

try {
  const response = await request('/auth/me', data.session.access_token);
  assert.equal(response.status, 200);

  const user = await response.json();
  assert.equal(user.id, data.user.id);

  console.log('PASS: Valid login returns the correct user.');
} finally {
  await supabase.auth.signOut({ scope: 'local' });
}
