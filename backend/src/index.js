import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import authRoutes from './routes/auth.js'
import articleRoutes from './routes/articles.js'
import projectRoutes from './routes/projects.js'
import uploadRoutes from './routes/upload.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001

// 中间件
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }))
app.use(express.json())

// 静态文件（上传的图片）
app.use('/uploads', express.static(join(__dirname, '..', 'uploads')))

// 路由
app.use('/api/auth', authRoutes)
app.use('/api/articles', articleRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/upload', uploadRoutes)

// 健康检查
app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

// 全局错误处理
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Internal server error' } })
})

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`)
})
