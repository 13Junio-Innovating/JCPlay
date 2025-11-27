import { chromium } from 'playwright'
import fs from 'fs/promises'

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080'
const VIDEO_DIR = 'videos'

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const ensureDir = async (d) => {
  try {
    await fs.mkdir(d, { recursive: true })
  } catch {}
}

const recordClip = async (name, fn) => {
  await ensureDir(VIDEO_DIR)
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: { dir: VIDEO_DIR, size: { width: 1920, height: 1080 } } })
  const page = await context.newPage()
  await page.goto(BASE_URL)
  await sleep(500)
  await fn(page)
  const tmp = await page.video().path()
  await page.close()
  await context.close()
  const target = `${VIDEO_DIR}/${name}.webm`
  try {
    await fs.rename(tmp, target)
  } catch {}
  await browser.close()
}

const run = async () => {
  await recordClip('01-intro', async (page) => {
    await page.getByText('Começar agora').click()
    await sleep(1200)
  })

  await recordClip('02-login', async (page) => {
    await page.goto(`${BASE_URL}/login`)
    await page.fill('#login-email', 'demo@example.com')
    await page.fill('#login-password', 'senha123')
    await sleep(500)
    await page.getByRole('button', { name: 'Entrar' }).click()
    await sleep(1200)
    await page.getByRole('button', { name: 'Esqueci minha senha' }).click()
    await sleep(800)
  })

  await recordClip('03-midias', async (page) => {
    await page.goto(`${BASE_URL}/media`)
    await sleep(800)
    await page.getByRole('button', { name: 'Upload' }).click()
    await sleep(800)
  })

  await recordClip('04-playlists', async (page) => {
    await page.goto(`${BASE_URL}/playlists`)
    await sleep(800)
    await page.getByRole('button', { name: 'Nova Playlist' }).click()
    await sleep(800)
    await page.fill('#playlist-name', 'Playlist Demonstração')
    await sleep(500)
  })

  await recordClip('05-telas-player', async (page) => {
    await page.goto(`${BASE_URL}/screens`)
    await sleep(800)
    await page.getByRole('button', { name: 'Nova Tela' }).click()
    await sleep(800)
    await page.fill('#screen-name', 'Tela Demonstração')
    await sleep(600)
  })

  await recordClip('06-dashboard-logs', async (page) => {
    await page.goto(`${BASE_URL}/dashboard`)
    await sleep(1000)
    await page.goto(`${BASE_URL}/logs`)
    await sleep(1000)
  })
}

run()