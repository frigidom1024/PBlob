import { Router } from 'express'
import { getDb } from '../db/index.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// GET /api/articles — 公开文章列表
router.get('/', (req, res) => {
  const db = getDb()
  const { published, category, page = 1, per_page = 50 } = req.query
  const offset = (Math.max(1, Number(page)) - 1) * Number(per_page)

  const conditions = []
  const params = []
  if (published === '1') { conditions.push('published = 1') }
  else if (published === '0') { conditions.push('published = 0') }
  if (category) { conditions.push('category = ?'); params.push(category) }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''

  const total = db.prepare(`SELECT COUNT(*) as count FROM articles ${where}`).get(...params).count

  const rows = db.prepare(`
    SELECT id, slug, title, excerpt, tags, category, cover_image, published, created_at, updated_at
    FROM articles ${where}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, Number(per_page), offset)

  const data = rows.map(r => ({ ...r, tags: JSON.parse(r.tags || '[]'), date: r.created_at }))

  res.json({ data, total, page: Number(page), per_page: Number(per_page) })
})

// GET /api/articles/:slug — 单篇文章（含 content）
router.get('/:slug', (req, res) => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM articles WHERE slug = ?').get(req.params.slug)
  if (!row) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Article not found' } })
  }
  res.json({ data: { ...row, tags: JSON.parse(row.tags || '[]'), date: row.created_at } })
})

// POST /api/articles — 创建文章
router.post('/', requireAuth, (req, res) => {
  const db = getDb()
  const { slug, title, excerpt, content, tags, category, cover_image, published } = req.body

  if (!title) {
    return res.status(400).json({ error: { code: 'VALIDATION', message: 'Title is required' } })
  }

  const finalSlug = slug || title.toLowerCase().replace(/[^\w一-鿿]+/g, '-').replace(/^-+|-+$/g, '')

  try {
    const result = db.prepare(`
      INSERT INTO articles (slug, title, excerpt, content, tags, category, cover_image, published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(finalSlug, title, excerpt || '', content || '', JSON.stringify(tags || []), category || '随笔', cover_image || null, published ? 1 : 0)

    const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ data: { ...article, tags: JSON.parse(article.tags || '[]'), date: article.created_at } })
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: { code: 'CONFLICT', message: 'Slug already exists' } })
    }
    throw err
  }
})

// PUT /api/articles/:id — 更新文章
router.put('/:id', requireAuth, (req, res) => {
  const db = getDb()
  const { title, excerpt, content, tags, category, cover_image, published, slug } = req.body

  const existing = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id)
  if (!existing) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Article not found' } })
  }

  db.prepare(`
    UPDATE articles SET title=?, slug=?, excerpt=?, content=?, tags=?, category=?, cover_image=?, published=?, updated_at=datetime('now')
    WHERE id=?
  `).run(
    title ?? existing.title,
    slug ?? existing.slug,
    excerpt ?? existing.excerpt,
    content ?? existing.content,
    JSON.stringify(tags ?? JSON.parse(existing.tags)),
    category ?? existing.category,
    cover_image ?? existing.cover_image,
    published !== undefined ? (published ? 1 : 0) : existing.published,
    req.params.id,
  )

  const updated = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id)
  res.json({ data: { ...updated, tags: JSON.parse(updated.tags || '[]'), date: updated.created_at } })
})

// DELETE /api/articles/:id — 删除文章
router.delete('/:id', requireAuth, (req, res) => {
  const db = getDb()
  const result = db.prepare('DELETE FROM articles WHERE id = ?').run(req.params.id)
  if (result.changes === 0) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Article not found' } })
  }
  res.json({ data: { id: Number(req.params.id), deleted: true } })
})

export default router
