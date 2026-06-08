import { Router } from 'express'
import multer from 'multer'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { requireAuth } from '../middleware/auth.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const UPLOAD_DIR = join(__dirname, '..', '..', 'uploads')

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop()
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    cb(null, name)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    cb(null, allowed.includes(file.mimetype))
  },
})

const router = Router()

router.post('/', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: { code: 'NO_FILE', message: 'No file uploaded' } })
  }
  const url = `/uploads/${req.file.filename}`
  res.json({ data: { url, filename: req.file.filename } })
})

export default router
