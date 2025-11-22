// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

// Simple CORS
const cors = (origin: string) => ({
  'Access-Control-Allow-Origin': origin || '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
})

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const APP_BASE_URL = Deno.env.get('APP_BASE_URL') || 'http://localhost:8080'
const EXTRA_NOTIFY_EMAILS = (Deno.env.get('EXTRA_NOTIFY_EMAILS') || '').split(',').map((s) => s.trim()).filter(Boolean)
const WEBHOOK_URL = Deno.env.get('WEBHOOK_URL')
const WHATSAPP_WEBHOOK_URL = Deno.env.get('WHATSAPP_WEBHOOK_URL')

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const sendEmail = async (to: string, subject: string, html: string, text: string) => {
  if (!RESEND_API_KEY) throw new Error('Missing RESEND_API_KEY')
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'JC Vision Play <no-reply@jcvplay.local>',
      to: [to],
      subject,
      html,
      text,
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend error: ${res.status} ${body}`)
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: cors(req.headers.get('Origin') || '*') })
  }
  try {
    const { playerKey, status } = await req.json()
    if (!playerKey || (status !== 'online' && status !== 'offline')) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers: cors(req.headers.get('Origin') || '*') })
    }

    // Find screen by player_key
    const { data: screen, error: screenError } = await supabase
      .from('screens')
      .select('id, name, created_by, assigned_playlist, notification_emails')
      .eq('player_key', playerKey)
      .single()

    if (screenError || !screen) {
      return new Response(JSON.stringify({ error: 'Screen not found' }), { status: 404, headers: cors(req.headers.get('Origin') || '*') })
    }

    // Get user email
    const { data: user } = await supabase.auth.admin.getUserById(screen.created_by)
    const email = user?.user?.email
    const extra = Array.isArray((screen as any).notification_emails) ? (screen as any).notification_emails as string[] : []
    const recipients = [email, ...extra, ...EXTRA_NOTIFY_EMAILS].filter((v, i, a) => !!v && a.indexOf(v) === i)
    if (recipients.length === 0) {
      return new Response(JSON.stringify({ error: 'No recipients' }), { status: 404, headers: cors(req.headers.get('Origin') || '*') })
    }

    const fullUrl = `${APP_BASE_URL}/player/${playerKey}`
    const shortUrl = `${APP_BASE_URL}/p/${playerKey}`

    let playlistName = null as string | null
    if ((screen as any).assigned_playlist) {
      const { data: pl } = await supabase
        .from('playlists')
        .select('name')
        .eq('id', (screen as any).assigned_playlist)
        .single()
      playlistName = pl?.name || null
    }

    const subject = status === 'offline'
      ? `Tela offline: ${screen.name}`
      : `Tela online novamente: ${screen.name}`

    const text = `Status da tela "${screen.name}": ${status}.
Playlist: ${playlistName ?? 'Nenhuma'}
Player: ${fullUrl}
URL curta: ${shortUrl}
`
    const html = `<div style="font-family: Arial, sans-serif;">
      <h2>Status da tela: ${screen.name}</h2>
      <p>A programação está <strong>${status}</strong>.</p>
      <p>Playlist: <strong>${playlistName ?? 'Nenhuma'}</strong></p>
      <p>Player: <a href="${fullUrl}">${fullUrl}</a><br/>
      URL curta: <a href="${shortUrl}">${shortUrl}</a></p>
    </div>`

    for (const rcpt of recipients) {
      await sendEmail(rcpt, subject, html, text)
    }

    const payload = { playerKey, status, screen: { id: screen.id, name: screen.name }, playlistName, urls: { fullUrl, shortUrl } }
    if (WEBHOOK_URL) {
      await fetch(WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    }
    if (WHATSAPP_WEBHOOK_URL) {
      await fetch(WHATSAPP_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: cors(req.headers.get('Origin') || '*') })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: cors(req.headers.get('Origin') || '*') })
  }
}

export default handler
