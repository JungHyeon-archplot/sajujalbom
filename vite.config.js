import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { streamClaude, readJsonBody } from './server/claudeProxy.js'

function claudeApiPlugin(apiKey) {
  return {
    name: 'claude-api-proxy',
    configureServer(server) {
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
          const result = await streamClaude({
            system: payload.system,
            user: payload.user,
            apiKey,
          })

          if (!result.ok) {
            res.statusCode = result.status
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: result.error }))
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
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              error: err?.message || '사주 해석 중 오류가 발생했습니다.',
            }),
          )
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.ANTHROPIC_API_KEY?.trim()

  return {
    plugins: [react(), claudeApiPlugin(apiKey)],
  }
})
