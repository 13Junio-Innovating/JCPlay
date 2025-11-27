import ffmpeg from 'ffmpeg-static'
import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'

const DIR = 'videos'
const FONT = process.env.FFMPEG_FONT || 'C:/Windows/Fonts/arial.ttf'

const segments = [
  { file: '01-intro.webm', title: 'Introdução', seconds: 30 },
  { file: '02-login.webm', title: 'Login e Cadastro', seconds: 35 },
  { file: '06-dashboard-logs.webm', title: 'Dashboard', seconds: 35 },
  { file: '03-midias.webm', title: 'Mídias', seconds: 40 },
  { file: '04-playlists.webm', title: 'Playlists', seconds: 40 },
  { file: '05-telas-player.webm', title: 'Telas e Player', seconds: 45 },
  { file: '06-dashboard-logs.webm', title: 'Verificação: Dashboard e Logs', seconds: 30 },
  { file: '01-intro.webm', title: 'Resumo', seconds: 20 },
  { file: '01-intro.webm', title: 'Vamos começar!', seconds: 10 },
]

const run = (bin, args) => new Promise((resolve, reject) => {
  const p = spawn(bin, args, { stdio: 'inherit' })
  p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(String(code)))))
})

const SLOW_FACTOR = parseFloat(process.env.SLOW_FACTOR || '1.6')

const processClip = async (file, title, seconds) => {
  const input = path.join(DIR, file)
  const safeTitle = title.replace(/[^\w\- ]/g, '_')
  const output = path.join(DIR, `seg-${path.parse(file).name}-${safeTitle.replace(/\s+/g,'_')}.mp4`)
  const draw = `drawtext=fontfile=${FONT}:text='${title.replace(/:/g,'\\:')}'::fontcolor=white:fontsize=48:x=60:y=60:box=1:boxcolor=black@0.5:boxborderw=10`
  const filter = `setpts=${SLOW_FACTOR}*PTS,${draw},tpad=stop_mode=clone:stop_duration=${Math.max(0, seconds)}`
  await run(ffmpeg, ['-y', '-i', input, '-vf', filter, '-r', '30', '-pix_fmt', 'yuv420p', '-c:v', 'libx264', '-b:v', '8M', '-t', String(seconds), output])
  return output
}

const main = async () => {
  await fs.mkdir(DIR, { recursive: true })
  const processed = []
  for (const { file, title, seconds } of segments) {
    processed.push(await processClip(file, title, seconds))
  }
  const listPath = path.join(DIR, 'files.txt')
  const listContent = processed.map((p) => `file '${path.basename(p).replace(/'/g, "'\\''")}'`).join('\n')
  await fs.writeFile(listPath, listContent)
  const concatOut = path.join(DIR, 'concat.mp4')
  await run(ffmpeg, ['-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', concatOut])
  const narration = path.join(DIR, 'narracao.wav')
  const bgMusic = path.join(DIR, 'bg-music.mp3')
  const finalOut = path.join(DIR, 'tutorial.mp4')
  let hasBg = false
  try { await fs.access(bgMusic); hasBg = true } catch {}
  if (hasBg) {
    await run(ffmpeg, ['-y', '-i', concatOut, '-i', narration, '-i', bgMusic, '-map', '0:v:0', '-filter_complex', "[1:a]aresample=22050,volume=1.0[n];[2:a]volume=0.08[b];[n][b]amix=inputs=2:duration=longest,volume=1.0[a]", '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', finalOut])
  } else {
    await run(ffmpeg, ['-y', '-i', concatOut, '-i', narration, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', finalOut])
  }
}

main()