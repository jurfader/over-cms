import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, desc, count } from '@overcms/core'
import { db, media } from '@overcms/core'
import { requireAuth } from '../middleware/auth'
import { ApiError } from '../middleware/error'
import path from 'node:path'
import fs from 'node:fs/promises'
import ffmpeg from 'fluent-ffmpeg'
import type { AppEnv } from '../types'

// ─── Sharp (lazy ESM interop) ─────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sharpLib: any
async function getSharp() {
  if (!sharpLib) {
    const mod = await import('sharp')
    sharpLib = mod.default ?? mod
  }
  return sharpLib
}

// ─── Constants ────────────────────────────────────────────────────────────────

const router    = new Hono<AppEnv>()
const UPLOAD_DIR = path.resolve('public/uploads')
const BASE_URL   = process.env['API_BASE_URL'] ?? '/api'
const MAX_SIZE   = 50 * 1024 * 1024 // 50 MB

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/avif',
  'image/gif', 'image/svg+xml',
])
const ALLOWED_VIDEO_TYPES = new Set([
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
])
const ALLOWED_OTHER_TYPES = new Set([
  'application/pdf', 'text/plain', 'text/csv', 'application/json',
  'audio/mpeg', 'audio/wav', 'audio/ogg',
])
const ALLOWED_FILE_TYPES = new Set([
  ...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_OTHER_TYPES,
])

// ─── Image → AVIF/WebP ────────────────────────────────────────────────────────

interface ImageResult {
  buffer:   Buffer
  filename: string
  mimeType: string
  width:    number | null
  height:   number | null
}

async function convertImage(buffer: Buffer, basename: string): Promise<ImageResult> {
  const sharp = await getSharp()
  const img   = sharp(buffer)
  const meta  = await img.metadata()
  const width  = meta.width  ?? null
  const height = meta.height ?? null

  const resized = img.resize({ width: 2400, withoutEnlargement: true })

  // Try AVIF first — best compression, broadly supported
  try {
    const avifBuf = await resized.clone().avif({ quality: 60, effort: 4 }).toBuffer()
    return { buffer: avifBuf, filename: `${basename}.avif`, mimeType: 'image/avif', width, height }
  } catch {
    // AVIF failed (rare) → fall back to WebP
  }

  const webpBuf = await resized.webp({ quality: 85 }).toBuffer()
  return { buffer: webpBuf, filename: `${basename}.webp`, mimeType: 'image/webp', width, height }
}

// ─── Video → WebM (background, VP9 + Opus) ───────────────────────────────────

function convertVideoToWebM(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libvpx-vp9')
      .audioCodec('libopus')
      .outputOptions([
        '-crf 33',        // Quality (lower = better, 33 is good balance)
        '-b:v 0',         // Variable bitrate (required for CRF mode in VP9)
        '-deadline good', // Encoding speed: good = balance of speed/quality
        '-cpu-used 2',    // 0-5, higher = faster but lower quality
        '-row-mt 1',      // Multi-threading
        '-b:a 128k',
      ])
      .format('webm')
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .save(outputPath)
  })
}

async function processVideoBackground(
  originalPath: string,
  originalFilename: string,
  mediaId: string,
  basename: string,
): Promise<void> {
  const webmFilename = `${basename}.webm`
  const webmPath     = path.join(UPLOAD_DIR, webmFilename)

  try {
    await convertVideoToWebM(originalPath, webmPath)

    const stat = await fs.stat(webmPath)
    const url  = `${BASE_URL}/uploads/${webmFilename}`

    await db
      .update(media)
      .set({ filename: webmFilename, url, mimeType: 'video/webm', size: stat.size })
      .where(eq(media.id, mediaId))

    // Delete original only if different from output
    if (originalFilename !== webmFilename) {
      await fs.rm(originalPath, { force: true })
    }
  } catch (err) {
    console.error(`[media] WebM conversion failed for ${originalFilename}:`, err)
    // Keep original — no DB update, so URL stays pointing to original
  }
}

// ─── GET / — lista plików ─────────────────────────────────────────────────────

router.get('/', requireAuth, async (c) => {
  const page   = Math.max(1, parseInt(c.req.query('page')  ?? '1'))
  const limit  = Math.max(1, parseInt(c.req.query('limit') ?? '40'))
  const folder = c.req.query('folder') ?? '/'
  const type   = c.req.query('type')  // 'image' | 'file' | undefined

  const where = eq(media.folder, folder)

  const rows = await db
    .select()
    .from(media)
    .where(where)
    .orderBy(desc(media.createdAt))
    .limit(limit)
    .offset((page - 1) * limit)

  const filtered = type === 'image'
    ? rows.filter((r) => r.mimeType.startsWith('image/'))
    : type === 'file'
    ? rows.filter((r) => !r.mimeType.startsWith('image/'))
    : rows

  const [totals] = await db.select({ total: count() }).from(media).where(where)
  const total = Number(totals?.total ?? 0)

  return c.json({
    data: filtered,
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
  })
})

// ─── POST / — upload ──────────────────────────────────────────────────────────

router.post('/', requireAuth, async (c) => {
  const uploader = c.get('user')

  const contentType = c.req.header('content-type') ?? ''
  if (!contentType.includes('multipart/form-data')) {
    throw ApiError.badRequest('Expected multipart/form-data')
  }

  const formData = await c.req.formData()
  const file     = formData.get('file') as File | null

  if (!file)                              throw ApiError.badRequest('Brak pliku w żądaniu')
  if (file.size > MAX_SIZE)              throw new ApiError('Plik jest za duży (maks. 50 MB)', 413)
  if (!ALLOWED_FILE_TYPES.has(file.type)) throw new ApiError(`Nieobsługiwany typ pliku: ${file.type}`, 415)

  await fs.mkdir(UPLOAD_DIR, { recursive: true })

  const bytes    = await file.arrayBuffer()
  const buffer   = Buffer.from(bytes)
  const basename = `${Date.now()}-${Math.random().toString(36).slice(2)}`

  const isRasterImage = ALLOWED_IMAGE_TYPES.has(file.type) && file.type !== 'image/svg+xml'
  const isVideo       = ALLOWED_VIDEO_TYPES.has(file.type)

  let filename: string
  let finalBuffer: Buffer   = buffer
  let finalMime: string     = file.type
  let width:  number | null = null
  let height: number | null = null

  if (isRasterImage) {
    // ── Image: convert to AVIF (WebP fallback) ──────────────────────────────
    const result = await convertImage(buffer, basename)
    filename    = result.filename
    finalBuffer = result.buffer
    finalMime   = result.mimeType
    width       = result.width
    height      = result.height

  } else if (isVideo) {
    // ── Video: save original now, convert to WebM in background ─────────────
    const ext = path.extname(file.name) || '.mp4'
    filename  = `${basename}${ext}`
    await fs.writeFile(path.join(UPLOAD_DIR, filename), finalBuffer)

  } else {
    // ── Other files: save as-is ──────────────────────────────────────────────
    const ext = path.extname(file.name) || ''
    filename  = `${basename}${ext}`
  }

  // Write file (for non-video types that didn't write yet)
  if (!isVideo) {
    await fs.writeFile(path.join(UPLOAD_DIR, filename), finalBuffer)
  }

  const url = `${BASE_URL}/uploads/${filename}`

  const [inserted] = await db
    .insert(media)
    .values({
      filename,
      originalName: file.name,
      url,
      size:       finalBuffer.byteLength,
      mimeType:   finalMime,
      width,
      height,
      uploadedBy: uploader?.id ?? null,
      folder: '/',
    })
    .returning()

  // Kick off background WebM conversion (non-blocking)
  if (isVideo && inserted) {
    const originalPath = path.join(UPLOAD_DIR, filename)
    setImmediate(() => {
      processVideoBackground(originalPath, filename, inserted.id, basename).catch(() => {})
    })
  }

  return c.json({ data: inserted }, 201)
})

// ─── PATCH /:id — alt / caption ───────────────────────────────────────────────

router.patch(
  '/:id',
  requireAuth,
  zValidator('json', z.object({ alt: z.string().optional(), caption: z.string().optional() })),
  async (c) => {
    const id   = c.req.param('id')!
    const body = c.req.valid('json')

    const [updated] = await db
      .update(media)
      .set(body)
      .where(eq(media.id, id))
      .returning()

    if (!updated) throw ApiError.notFound('Media not found')
    return c.json({ data: updated })
  },
)

// ─── DELETE /:id ──────────────────────────────────────────────────────────────

router.delete('/:id', requireAuth, async (c) => {
  const id = c.req.param('id')!

  const [row] = await db.select().from(media).where(eq(media.id, id)).limit(1)
  if (!row) throw ApiError.notFound('Media not found')

  await fs.rm(path.join(UPLOAD_DIR, row.filename), { force: true })
  await db.delete(media).where(eq(media.id, id))

  return c.json({ success: true })
})

export default router
