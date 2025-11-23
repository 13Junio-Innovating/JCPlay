// @ts-nocheck
// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const cors = (origin: string) => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
})

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors(req.headers.get('Origin') || '*') })
  try {
    const { userId, code } = await req.json()
    if (!userId || !code) return new Response(JSON.stringify({ error: 'Missing userId or code' }), { status: 400, headers: cors(req.headers.get('Origin') || '*') })

    const { data: profile, error: err } = await supabase
      .from('profiles')
      .select('phone_verification_code')
      .eq('id', userId)
      .single()
    if (err || !profile) return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 404, headers: cors(req.headers.get('Origin') || '*') })

    const ok = String(profile.phone_verification_code || '') === String(code)
    if (!ok) return new Response(JSON.stringify({ ok: false, error: 'Invalid code' }), { status: 200, headers: cors(req.headers.get('Origin') || '*') })

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ whatsapp_verified: true, phone_verification_code: null, phone_verified_at: new Date().toISOString() })
      .eq('id', userId)
    if (updateErr) return new Response(JSON.stringify({ error: 'Update failed' }), { status: 500, headers: cors(req.headers.get('Origin') || '*') })

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: cors(req.headers.get('Origin') || '*') })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: cors(req.headers.get('Origin') || '*') })
  }
}

export default handler