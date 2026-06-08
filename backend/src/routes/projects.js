import { Router } from 'express'
import { getDb } from '../db/index.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// GET /api/projects — 公开项目列表
router.get('/', (req, res) => {
  const db = getDb()
  const { published, page = 1, per_page = 50 } = req.query
  const offset = (Math.max(1, Number(page)) - 1) * Number(per_page)

  let where = ''
  if (published === '1') where = 'WHERE published = 1'
  else if (published === '0') where = 'WHERE published = 0'

  const total = db.prepare(`SELECT COUNT(*) as count FROM projects ${where}`).get().count

  const rows = db.prepare(`
    SELECT id, title, excerpt, tags, cover_image, url, published, created_at, updated_at
    FROM projects ${where}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(Number(per_page), offset)

  const data = rows.map(r => ({ ...r, tags: JSON.parse(r.tags || '[]'), date: r.created_at }))
  res.json({ data, total, page: Number(page), per_page: Number(per_page) })
})

// GET /api/projects/:id — 单个项目
router.get('/:id', (req, res) => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id)
  if (!row) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Project not found' } })
  res.json({ data: { ...row, tags: JSON.parse(row.tags || '[]'), date: row.created_at } })
})

// POST /api/projects — 创建项目
router.post('/', requireAuth, (req, res) => {
  const db = getDb()
  const { title, excerpt, content, tags, cover_image, url, published } = req.body

  if (!title) {
    return res.status(400).json({ error: { code: 'VALIDATION', message: 'Title is required' } })
  }

  const result = db.prepare(`
    INSERT INTO projects (title, excerpt, content, tags, cover_image, url, published)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(title, excerpt || '', content || '', JSON.stringify(tags || []), cover_image || null, url || null, published ? 1 : 0)

  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid)
  res.status(201).json({ data: { ...project, tags: JSON.parse(project.tags || '[]'), date: project.created_at } })
})

// PUT /api/projects/:id — 更新项目
router.put('/:id', requireAuth, (req, res) => {
  const db = getDb()
  const { title, excerpt, content, tags, cover_image, url, published } = req.body

  const existing = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id)
  if (!existing) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Project not found' } })

  db.prepare(`
    UPDATE projects SET title=?, excerpt=?, content=?, tags=?, cover_image=?, url=?, published=?, updated_at=datetime('now')
    WHERE id=?
  `).run(
    title ?? existing.title,
    excerpt ?? existing.excerpt,
    content ?? existing.content,
    JSON.stringify(tags ?? JSON.parse(existing.tags)),
    cover_image ?? existing.cover_image,
    url ?? existing.url,
    published !== undefined ? (published ? 1 : 0) : existing.published,
    req.params.id,
  )

  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id)
  res.json({ data: { ...updated, tags: JSON.parse(updated.tags || '[]'), date: updated.created_at } })
})

// DELETE /api/projects/:id — 删除项目
router.delete('/:id', requireAuth, (req, res) => {
  const db = getDb()
  const result = db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id)
  if (result.changes === 0) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Project not found' } })
  res.json({ data: { id: Number(req.params.id), deleted: true } })
})

export default router
