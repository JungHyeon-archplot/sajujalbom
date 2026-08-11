import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { callClaude, readJsonBody } from './server/claudeProxy.js'

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
          const result = await callClaude({
            system: payload.system,
            user: payload.user,
            apiKey,
          })

          res.statusCode = result.status
          res.setHeader('Content-Type', 'application/json')
          if (result.ok) {
            res.end(JSON.stringify({ text: result.text }))
          } else {
            res.end(JSON.stringify({ error: result.error }))
          }
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

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.ANTHROPIC_API_KEY?.trim()

  return {
    plugins: [react(), claudeApiPlugin(apiKey)],
  }
})
