import ffmpeg from 'ffmpeg-static'
import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'

const DIR = 'videos'
const FONT = process.env.FFMPEG_FONT || 'C:/Windows/Fonts/arial.ttf'
const WIDTH = 1920
const HEIGHT = 1080
const FPS = 30
const DEFAULT_SECONDS = parseFloat(process.env.DEFAULT_SECONDS || '4')
const FADE = parseFloat(process.env.FADE_SECONDS || '0.5')

const run = (bin, args) => new Promise((resolve, reject) => {
  const p = spawn(bin, args, { stdio: 'inherit' })
  p.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(String(code)))))
})

const sanitize = (s) => s.replace(/[\n\r\t]/g, ' ').replace(/[:]/g, '\\:')

const parseList = async () => {
  const listPath = path.join(DIR, 'files.txt')
  try {
    const raw = await fs.readFile(listPath, 'utf-8')
    const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length > 0 && lines[0].startsWith("file ")) {
      throw new Error('legacy concat list')
    }
    return lines.map((l) => {
      const [file, seconds, caption] = l.split('|')
      return { file: file.trim(), seconds: seconds ? parseFloat(seconds) : DEFAULT_SECONDS, caption: caption ? caption.trim() : path.parse(file).name }
    })
  } catch {
    const files = await fs.readdir(DIR)
    const media = files.filter((f) => /\.(png|jpg|jpeg|webp|mp4|webm)$/i.test(f)).sort()
    return media.map((file) => ({ file, seconds: DEFAULT_SECONDS, caption: path.parse(file).name }))
  }
}

const makeSegment = async (index, file, seconds, caption) => {
  const input = path.join(DIR, file)
  const base = path.parse(file).name
  const out = path.join(DIR, `titled-${String(index + 1).padStart(2, '0')}-${base}.mp4`)
  const draw = `drawtext=fontfile=${FONT}:text='${sanitize(caption)}':fontcolor=white:fontsize=48:x=(w/2-text_w/2):y=h-120:box=1:boxcolor=black@0.6:boxborderw=10`
  const scalePad = `scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=decrease,pad=${WIDTH}:${HEIGHT}:(ow-iw)/2:(oh-ih)/2:black`
  const fadeIn = `fade=t=in:st=0:d=${FADE}`
  const fadeOut = `fade=t=out:st=${Math.max(0, seconds - FADE)}:d=${FADE}`
  const vf = `${scalePad},${draw},${fadeIn},${fadeOut},format=yuv420p`
  const isImage = /\.(png|jpg|jpeg|webp)$/i.test(file)
  const args = isImage
    ? ['-y', '-loop', '1', '-t', String(seconds), '-i', input, '-vf', vf, '-r', String(FPS), '-pix_fmt', 'yuv420p', '-c:v', 'libx264', '-b:v', '8M', out]
    : ['-y', '-i', input, '-t', String(seconds), '-vf', vf, '-r', String(FPS), '-pix_fmt', 'yuv420p', '-an', '-c:v', 'libx264', '-b:v', '8M', out]
  await run(ffmpeg, args)
  return out
}

const concatSegments = async (segments) => {
  const listPath = path.join(DIR, 'files.txt.tmp')
  const content = segments.map((p) => `file '${path.basename(p).replace(/'/g, "'\\''")}'`).join('\n')
  await fs.writeFile(listPath, content)
  const out = path.join(DIR, 'concat.mp4')
  await run(ffmpeg, ['-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', out])
  return out
}

const addAudio = async (videoPath) => {
  const narration = path.join(DIR, 'narracao.wav')
  const bg = path.join(DIR, 'bg-music.mp3')
  const hasNarration = await fs.access(narration).then(() => true).catch(() => false)
  const hasBg = await fs.access(bg).then(() => true).catch(() => false)
  const out = path.join(DIR, 'tutorial.mp4')
  if (hasNarration && hasBg) {
    await run(ffmpeg, ['-y', '-i', videoPath, '-i', narration, '-i', bg, '-map', '0:v:0', '-filter_complex', '[1:a]aresample=22050,volume=1.0[n];[2:a]volume=0.08[b];[n][b]amix=inputs=2:duration=longest,volume=1.0[a]', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', out])
  } else if (hasNarration) {
    await run(ffmpeg, ['-y', '-i', videoPath, '-i', narration, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', out])
  } else if (hasBg) {
    await run(ffmpeg, ['-y', '-i', videoPath, '-i', bg, '-map', '0:v:0', '-map', '1:a:0', '-shortest', '-c:v', 'copy', '-c:a', 'aac', out])
  } else {
    await fs.copyFile(videoPath, out)
  }
  return out
}

const main = async () => {
  await fs.mkdir(DIR, { recursive: true })
  const items = await parseList()
  const segs = []
  for (let i = 0; i < items.length; i++) {
    const { file, seconds, caption } = items[i]
    segs.push(await makeSegment(i, file, seconds, caption))
  }
  const concat = await concatSegments(segs)
  await addAudio(concat)
}

main()