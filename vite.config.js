import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { streamClaude, readJsonBody } from './server/claudeProxy.js'
import { buildRequest } from './shared/buildPrompt.js'

function json(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

function claudeApiPlugin({ apiKey }) {
  return {
    name: 'claude-api-proxy',
    configureServer(server) {
      // 로컬에서도 마스터 패널을 확인할 수 있게 최소 구현을 둡니다.
      server.middlewares.use('/api/admin', async (req, res, next) => {
        if (req.method !== 'POST') {
          next()
          return
        }

        const url = (
          process.env.SUPABASE_URL ||
          process.env.VITE_SUPABASE_URL ||
          ''
        ).replace(/\/$/, '')
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!url || !key) {
          json(res, 500, { error: 'SUPABASE_SERVICE_ROLE_KEY가 없습니다.' })
          return
        }

        try {
          const payload = await readJsonBody(req)
          const who = await fetch(`${url}/auth/v1/user`, {
            headers: {
              apikey: key,
              Authorization: `Bearer ${String(payload?.token || '')}`,
            },
          })
          if (!who.ok) {
            json(res, 401, { error: '로그인이 필요합니다.' })
            return
          }

          const user = await who.json()
          const masters = (
            process.env.MASTER_EMAILS ||
            'jhsimon7@dgu.ac.kr,archplot100@gmail.com'
          )
            .split(',')
            .map((s) => s.trim().toLowerCase())
          if (!masters.includes(String(user?.email || '').toLowerCase())) {
            json(res, 403, { error: '권한이 없습니다.' })
            return
          }

          const rows = await fetch(
            `${url}/rest/v1/tarot_readings?select=id,created_at,name,concern,cards,result&order=created_at.desc&limit=300`,
            { headers: { apikey: key, Authorization: `Bearer ${key}` } },
          )
          json(res, 200, { records: rows.ok ? await rows.json() : [] })
        } catch (err) {
          json(res, 500, { error: err?.message || '기록 조회에 실패했습니다.' })
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

          const kind = payload?.kind === 'tarot' ? 'tarot' : 'saju'
          let prompt
          try {
            prompt = buildRequest(kind, payload)
          } catch (err) {
            json(res, 400, { error: err?.message || '요청 본문이 올바르지 않습니다.' })
            return
          }

          const result = await streamClaude({
            system: prompt.system,
            user: prompt.user,
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

  return {
    plugins: [react(), claudeApiPlugin({ apiKey })],
  }
})
