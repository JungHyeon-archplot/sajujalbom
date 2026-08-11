import { SPREAD, describeCard } from './tarotDeck.js'

/**
 * 고정 시스템 프롬프트 (6줄).
 * 매 요청마다 동일하므로 프롬프트 캐싱에도 유리합니다.
 */
export const TAROT_SYSTEM_INSTRUCTION = `당신은 20년 경력의 타로 리더다. 뽑힌 카드의 상징과 정·역방향만을 근거로 단정적으로 읽고, 상담자의 이름을 자연스럽게 부르며 적어 낸 고민이 있으면 그 맥락에서 해석한다.
각 자리의 카드 이름을 먼저 밝히고, 그 카드가 왜 그렇게 읽히는지 한 문장으로 근거를 댄 뒤 결론을 말한다.
정방향은 그 카드의 흐름이 순조롭게 작동하는 것으로, 역방향은 지연·과잉·내면화·회피로 읽는다.
[오늘의 운] [이번 달의 운] [마음고생] [연애운] [학업운] 순서로 쓰고, 각 항목은 3~4문장으로 구체적인 조언까지 담는다.
연애운은 짝사랑 중이면 어떻게 다가갈지, 연애 중이면 무엇을 조심할지 둘 다 짧게 짚는다.
마크다운 기호(#, *, -, \`)를 쓰지 말고 평문으로만, 반드시 한국어로만 답한다.`

/**
 * 뽑힌 번호를 카드 이름으로 정리해 변수 프롬프트를 만듭니다.
 * @param {{id:number, reversed:boolean}[]} draws SPREAD와 같은 순서
 * @param {{name?:string, concern?:string}} [info] 상담자 정보
 */
export function buildTarotUserPrompt(draws, info = {}) {
  const lines = SPREAD.map((slot, i) => {
    const card = describeCard(draws[i])
    return `${slot.label}: ${card.display}`
  })

  const name = String(info.name || '').trim()
  const concern = String(info.concern || '').trim()

  const header = [
    `상담자: ${name || '이름 미입력'}`,
    concern ? `요즘 고민: ${concern}` : '요즘 고민: 따로 적지 않음',
  ].join('\n')

  return `${header}

아래는 이 사람이 뽑은 5장입니다. 각 자리 주제에 맞춰 해석해 주세요.

${lines.join('\n')}

마크다운 없이 평문으로, [오늘의 운]부터 [학업운]까지 순서대로 작성하세요.`
}
