// ============================================================
// FILE: api/supabase.js
// PURPOSE: Serverless function that handles all Supabase
//          database writes — waitlist signups and contact
//          form submissions. Keeps Supabase keys server-side.
// ENV VARS: storage_SUPABASE_URL, storage_SUPABASE_ANON_KEY
// ============================================================

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SUPABASE_URL = process.env.storage_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.storage_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  const { type, data } = req.body;

  // Determine which table to insert into
  const table = type === 'waitlist' ? 'waitlist' : 'contact_submissions';

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(err);
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Supabase error:', err);
    return res.status(500).json({ error: err.message });
  }
}
