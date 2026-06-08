import jwt from 'jsonwebtoken'

const { JWT_SECRET = 'dev-secret', APP_ENV = 'development' } = process.env
const isDev = APP_ENV !== 'production'

export function requireAuth(req, res, next) {
  // 非 production 环境跳过认证
  if (isDev) {
    req.user = { id: 0, github_id: 0, github_login: 'dev-user', avatar_url: '' }
    return next()
  }

  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' } })
  }

  try {
    const token = header.split(' ')[1]
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Token expired or invalid' } })
  }
}
