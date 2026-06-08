import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getDb } from './index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return null
  const frontmatter = {}
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.+)$/)
    if (kv) {
      let val = kv[2].trim()
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
      if (val.startsWith('[')) val = JSON.parse(val.replace(/'/g, '"'))
      frontmatter[kv[1]] = val
    }
  }
  return { frontmatter, body: match[2].trim() }
}

const CONTENT_DIR = join(__dirname, '..', '..', '..', 'content')

function seedArticles() {
  const db = getDb()
  const dir = join(CONTENT_DIR, 'articles')
  let files
  try { files = readdirSync(dir) } catch {
    console.log('  No articles directory found, skipping.')
    return
  }

  let count = 0
  for (const file of files) {
    if (!file.endsWith('.md')) continue
    const raw = readFileSync(join(dir, file), 'utf-8')
    const parsed = parseFrontmatter(raw)
    if (!parsed) continue

    const { frontmatter, body } = parsed
    const slug = file.replace(/\.md$/, '')

    const existing = db.prepare('SELECT id FROM articles WHERE slug = ?').get(slug)
    if (existing) continue

    db.prepare(`
      INSERT INTO articles (slug, title, excerpt, content, tags, cover_image, published, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(
      slug,
      frontmatter.title || slug,
      frontmatter.excerpt || '',
      body,
      JSON.stringify(frontmatter.tags || []),
      frontmatter.image || null,
      frontmatter.date || new Date().toISOString(),
      frontmatter.date || new Date().toISOString(),
    )
    console.log(`  ✅ Article: ${frontmatter.title || slug}`)
    count++
  }
  console.log(`  Imported ${count} articles`)
}

function seedProjects() {
  const db = getDb()
  const dir = join(CONTENT_DIR, 'projects')
  let files
  try { files = readdirSync(dir) } catch {
    console.log('  No projects directory found, skipping.')
    return
  }

  let count = 0
  for (const file of files) {
    if (!file.endsWith('.md')) continue
    const raw = readFileSync(join(dir, file), 'utf-8')
    const parsed = parseFrontmatter(raw)
    if (!parsed) continue

    const { frontmatter, body } = parsed

    const existing = db.prepare('SELECT id FROM projects WHERE title = ?').get(frontmatter.title)
    if (existing) continue

    db.prepare(`
      INSERT INTO projects (title, excerpt, content, tags, cover_image, url, published, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(
      frontmatter.title,
      frontmatter.excerpt || '',
      body || '',
      JSON.stringify(frontmatter.tags || []),
      frontmatter.image || null,
      frontmatter.url || null,
      frontmatter.date || new Date().toISOString(),
      frontmatter.date || new Date().toISOString(),
    )
    console.log(`  ✅ Project: ${frontmatter.title}`)
    count++
  }
  console.log(`  Imported ${count} projects`)
}

console.log('Seeding articles...')
seedArticles()
console.log('Seeding projects...')
seedProjects()
console.log('Done!')
