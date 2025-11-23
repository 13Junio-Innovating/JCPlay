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

const randomCode = () => String(Math.floor(100000 + Math.random() * 900000))
const WHATSAPP_WEBHOOK_URL = Deno.env.get('WHATSAPP_WEBHOOK_URL')
const WEBHOOK_API_KEY = Deno.env.get('WEBHOOK_API_KEY')

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors(req.headers.get('Origin') || '*') })
  try {
    const { phone, userId } = await req.json()
    if (!phone || !userId) return new Response(JSON.stringify({ error: 'Missing phone or userId' }), { status: 400, headers: cors(req.headers.get('Origin') || '*') })

    const code = randomCode()
    const { error: updErr } = await supabase
      .from('profiles')
      .update({ phone, phone_verification_code: code, whatsapp_verified: false })
      .eq('id', userId)
    if (updErr) return new Response(JSON.stringify({ error: 'Update failed' }), { status: 500, headers: cors(req.headers.get('Origin') || '*') })

    if (WHATSAPP_WEBHOOK_URL) {
      await fetch(WHATSAPP_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(WEBHOOK_API_KEY ? { apikey: WEBHOOK_API_KEY } : {}) },
        body: JSON.stringify({ type: 'verify', to: phone, code }),
      })
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: cors(req.headers.get('Origin') || '*') })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: cors(req.headers.get('Origin') || '*') })
  }
}

export default handler
