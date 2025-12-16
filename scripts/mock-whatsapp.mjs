import http from 'http'

const PORT = process.env.PORT || 3000
const PATH = '/mock-whatsapp'
const APIKEY = process.env.WEBHOOK_API_KEY || 'dev-key'

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
    })
    return res.end()
  }
  if (req.method !== 'POST' || req.url !== PATH) {
    res.writeHead(404, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ error: 'Not found' }))
  }
  let body = ''
  req.on('data', chunk => (body += chunk))
  req.on('end', () => {
    try {
      const payload = JSON.parse(body || '{}')
      const apikey = req.headers['apikey'] || req.headers['x-api-key']
      const okKey = !APIKEY || apikey === APIKEY
      console.log('[Mock WhatsApp] Incoming:', JSON.stringify(payload))
      if (!okKey) {
        res.writeHead(401, { 'Content-Type': 'application/json' })
        return res.end(JSON.stringify({ error: 'Invalid apikey' }))
      }
      // Simular envio
      res.writeHead(200, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify({ ok: true }))
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      return res.end(JSON.stringify({ error: 'Bad JSON' }))
    }
  })
})

server.listen(PORT, () => {
  console.log(`Mock WhatsApp listening on http://localhost:${PORT}${PATH}`)
})
