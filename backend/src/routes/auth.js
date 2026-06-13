import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { getDb } from '../db/index.js'

const router = Router()

const {
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  JWT_SECRET = 'dev-secret',
  FRONTEND_URL = 'http://localhost:5173',
  APP_ENV = 'development',
} = process.env
const isDev = APP_ENV !== 'production'

// 跳转 GitHub 授权
router.get('/github', (req, res) => {
  const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=read:user`
  res.redirect(url)
})

// OAuth 回调
router.get('/callback', async (req, res) => {
  const { code } = req.query
  if (!code) {
    return res.redirect(`${FRONTEND_URL}/admin/login?error=no_code`)
  }

  try {
    // 用 code 换 access_token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    })
    const { access_token } = await tokenRes.json()
    if (!access_token) {
      return res.redirect(`${FRONTEND_URL}/admin/login?error=token_failed`)
    }

    // 获取用户信息
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    const githubUser = await userRes.json()

    // 调试：打印 GitHub 返回的用户信息
    console.error('[OAuth Debug] githubUser:', JSON.stringify(githubUser, null, 2))

    // 检查白名单
    const db = getDb()
    const admin = db.prepare('SELECT * FROM admins WHERE github_id = ?').get(githubUser.id)
    if (!admin) {
      console.error(`[OAuth Debug] github_id ${githubUser.id} not found in admins table`)
      return res.redirect(`${FRONTEND_URL}/admin/login?error=not_authorized`)
    }

    // 签发 JWT
    const token = jwt.sign(
      {
        id: admin.id,
        github_id: githubUser.id,
        github_login: githubUser.login,
        avatar_url: githubUser.avatar_url,
      },
      JWT_SECRET,
      { expiresIn: '7d' },
    )

    res.redirect(`${FRONTEND_URL}/admin?token=${token}`)
  } catch (err) {
    console.error('OAuth error:', err)
    res.redirect(`${FRONTEND_URL}/admin/login?error=server_error`)
  }
})

// 获取当前用户
router.get('/me', (req, res) => {
  // 非 production 环境返回 mock 用户
  if (isDev) {
    return res.json({
      data: { id: 0, github_id: 0, github_login: 'dev-user', avatar_url: '' },
    })
  }

  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.json({ data: null })
  }
  try {
    const user = jwt.verify(header.split(' ')[1], JWT_SECRET)
    res.json({ data: user })
  } catch {
    res.json({ data: null })
  }
})

export default router
