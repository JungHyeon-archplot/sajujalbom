/**
 * 타로 덱 (라이더-웨이트 78장).
 * 사용자 눈에는 "카드를 뽑는" 것으로 보이지만, 실제로는 0~77 번호를 랜덤으로 뽑고
 * LLM에 보내기 전 중간 단계에서 번호를 카드 이름으로 정리해 전달합니다.
 */

const MAJORS = [
  '바보', '마법사', '여사제', '여황제', '황제', '교황', '연인', '전차',
  '힘', '은둔자', '운명의 수레바퀴', '정의', '매달린 사람', '죽음',
  '절제', '악마', '탑', '별', '달', '태양', '심판', '세계',
]

const SUITS = [
  { key: 'wands', label: '완드' },
  { key: 'cups', label: '컵' },
  { key: 'swords', label: '소드' },
  { key: 'pentacles', label: '펜타클' },
]

const RANKS = [
  '에이스', '2', '3', '4', '5', '6', '7', '8', '9', '10',
  '페이지', '나이트', '퀸', '킹',
]

const ROMAN = [
  '0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI',
]

/** 슈트별 상징 기호 (카드 앞면 장식용) */
const SUIT_GLYPH = {
  wands: '⚚',
  cups: '🜄',
  swords: '⚔',
  pentacles: '⬟',
}

/** 0~77 번호 → 카드 정보 */
export const DECK = (() => {
  const cards = MAJORS.map((name, i) => ({
    id: i,
    name,
    arcana: 'major',
    numeral: ROMAN[i],
    glyph: '✦',
    label: `${name}(메이저 ${i})`,
  }))

  let id = MAJORS.length
  for (const suit of SUITS) {
    RANKS.forEach((rank, r) => {
      cards.push({
        id,
        name: `${suit.label} ${rank}`,
        arcana: 'minor',
        suit: suit.key,
        numeral: r < 10 ? String(r + 1) : rank,
        glyph: SUIT_GLYPH[suit.key],
        label: `${suit.label} ${rank}`,
      })
      id += 1
    })
  }
  return cards
})()

/** 결과 화면에서 쓰는 자리(포지션) 정의 */
export const SPREAD = [
  { key: 'today', label: '오늘의 운' },
  { key: 'month', label: '이번 달의 운' },
  { key: 'mind', label: '마음고생' },
  { key: 'love', label: '연애운' },
  { key: 'study', label: '학업운' },
]

/** 화면에 깔아 둘 뒷면 카드 장수 */
export const FAN_SIZE = 12

/**
 * 서로 다른 번호 count개를 뽑고 정/역방향을 정합니다.
 * @returns {{id:number, reversed:boolean}[]}
 */
export function drawCardIds(count) {
  const pool = new Set()
  while (pool.size < count) {
    pool.add(Math.floor(Math.random() * DECK.length))
  }
  return [...pool].map((id) => ({ id, reversed: Math.random() < 0.4 }))
}

/** 뽑은 번호를 카드 이름 + 방향으로 정리합니다. */
export function describeCard(draw) {
  const card = DECK[draw.id]
  return {
    ...draw,
    name: card.name,
    label: card.label,
    numeral: card.numeral,
    glyph: card.glyph,
    arcana: card.arcana,
    image: `/tarot/${draw.id}.jpg`,
    orientation: draw.reversed ? '역방향' : '정방향',
    display: `${card.name} (${draw.reversed ? '역방향' : '정방향'})`,
  }
}
