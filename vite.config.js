import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { isValidAccessPassword } from './server/access.js'
import { streamClaude, readJsonBody } from './server/claudeProxy.js'

function json(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

function claudeApiPlugin({ apiKey, accessPassword }) {
  return {
    name: 'claude-api-proxy',
    configureServer(server) {
      server.middlewares.use('/api/unlock', async (req, res, next) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }
        if (req.method !== 'POST') {
          next()
          return
        }

        try {
          const payload = await readJsonBody(req)
          if (!isValidAccessPassword(payload?.password, accessPassword)) {
            json(res, 401, { error: '비밀번호가 올바르지 않습니다.' })
            return
          }
          json(res, 200, { ok: true })
        } catch (err) {
          json(res, 500, {
            error: err?.message || '잠금 해제 중 오류가 발생했습니다.',
          })
        }
      })

      server.middlewares.use('/api/analyze-saju', async (req, res, next) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method !== 'POST') {
          next()
          return
        }

        try {
          const payload = await readJsonBody(req)

          if (!isValidAccessPassword(payload?.password, accessPassword)) {
            json(res, 401, {
              error: '비밀번호 인증이 필요합니다. 먼저 잠금을 해제해 주세요.',
            })
            return
          }

          const result = await streamClaude({
            system: payload.system,
            user: payload.user,
            apiKey,
          })

          if (!result.ok) {
            json(res, result.status, { error: result.error })
            return
          }

          res.statusCode = 200
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.setHeader('Cache-Control', 'no-cache')
          res.setHeader('X-Accel-Buffering', 'no')
          if (typeof res.flushHeaders === 'function') res.flushHeaders()

          const reader = result.stream.getReader()
          for (;;) {
            const { done, value } = await reader.read()
            if (done) break
            if (!res.write(Buffer.from(value)) && !res.writableEnded) {
              await new Promise((resolve) => res.once('drain', resolve))
            }
          }
          res.end()
        } catch (err) {
          json(res, 500, {
            error: err?.message || '사주 해석 중 오류가 발생했습니다.',
          })
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.ANTHROPIC_API_KEY?.trim()
  const accessPassword = env.SAJU_ACCESS_PASSWORD?.trim()

  return {
    plugins: [react(), claudeApiPlugin({ apiKey, accessPassword })],
  }
})
