// 서버(Cloudflare Pages Functions / Vercel Edge)에서 프롬프트를 만드는 곳.
//
// 클라이언트는 입력값만 보내고, 문장은 여기서 조립합니다.
// 예전처럼 클라이언트가 system/user 문장을 그대로 보내면 이 엔드포인트가
// 아무 프롬프트나 실행해 주는 무료 LLM 창구가 되기 때문입니다.
//
// 화면과 같은 모듈을 그대로 가져다 쓰므로 문구가 갈라질 일이 없습니다.
import {
  SAJU_SYSTEM_INSTRUCTION,
  buildSajuUserPrompt,
} from '../src/features/saju/lib/sajuPrompt.js'
import {
  TAROT_SYSTEM_INSTRUCTION,
  buildTarotUserPrompt,
} from '../src/features/tarot/lib/tarotPrompt.js'
import { DECK, SPREAD } from '../src/features/tarot/lib/tarotDeck.js'

export const MAX_NAME = 40
export const MAX_CONCERN = 120

const GENDERS = new Set(['male', 'female', ''])
const CALENDARS = new Set(['solar', 'lunar'])

function clean(value, max) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ') // 제어문자 제거
    .trim()
    .slice(0, max)
}

/** 'YYYY-MM-DD' 형식만 허용 */
function cleanDate(value) {
  const text = clean(value, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : ''
}

/** 'HH:MM' 형식만 허용 */
function cleanTime(value) {
  const text = clean(value, 8).slice(0, 5)
  return /^\d{2}:\d{2}$/.test(text) ? text : ''
}

function buildSaju(payload) {
  const p = payload?.profile ?? {}

  const profile = {
    name: clean(p.name, MAX_NAME),
    birthDate: cleanDate(p.birthDate),
    birthTime: cleanTime(p.birthTime),
    gender: GENDERS.has(p.gender) ? p.gender : '',
    calendarType: CALENDARS.has(p.calendarType) ? p.calendarType : 'solar',
  }

  if (!profile.name || !profile.birthDate) {
    throw new Error('이름과 생년월일이 필요합니다.')
  }

  return {
    system: SAJU_SYSTEM_INSTRUCTION,
    user: buildSajuUserPrompt(profile),
  }
}

function buildTarot(payload) {
  const raw = Array.isArray(payload?.draws) ? payload.draws : []

  if (raw.length !== SPREAD.length) {
    throw new Error('카드 정보가 올바르지 않습니다.')
  }

  const seen = new Set()
  const draws = raw.map((d) => {
    const id = Number(d?.id)
    if (!Number.isInteger(id) || id < 0 || id >= DECK.length || seen.has(id)) {
      throw new Error('카드 정보가 올바르지 않습니다.')
    }
    seen.add(id)
    return { id, reversed: Boolean(d?.reversed) }
  })

  return {
    system: TAROT_SYSTEM_INSTRUCTION,
    user: buildTarotUserPrompt(draws, {
      name: clean(payload?.name, MAX_NAME),
      concern: clean(payload?.concern, MAX_CONCERN),
    }),
  }
}

/**
 * 요청 본문에서 프롬프트를 만듭니다.
 * @returns {{system: string, user: string}}
 * @throws 입력이 올바르지 않으면 사용자에게 보여 줄 메시지와 함께 던집니다.
 */
export function buildRequest(kind, payload) {
  return kind === 'tarot' ? buildTarot(payload) : buildSaju(payload)
}
