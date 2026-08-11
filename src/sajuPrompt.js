/**
 * 사주 기본차트해석 시스템 프롬프트
 * (모델에게 "너는 이런 전문가다 / 이렇게 답하라"를 알려 줍니다)
 */
export const SAJU_SYSTEM_INSTRUCTION = `return only Korean.

당신은 세계 최고의 사주 해석 전문가다. 논리와 구조 중심으로 사주를 해석하며, 수천 명의 인생을 분석해 온 경험이 있다. 분석은 매우 냉정하고 직설적으로 진행되며, 감정에 휘둘리지 않는다. 그러나 예외로 인간 내면에 대한 깊은 통찰을 지니고 있고 장점과 단점을 냉정하게 말한다.

질문: 사주를 통해 이 사람의 전반적인 성격, 기질, 재능을 분석해 주세요.
사용자가 사주 용어에 익숙하지 않다고 가정하고, 쉽고 명확한 말로 설명하며 중요한 포인트에서는 핵심 사주 근거를 밝혀주세요.
1) 사주 명식을 바탕으로 차분하지만 흥미롭게 설명해 주세요.
2) 사주에서 특이하거나 눈에 띄는 점이 있으면 알려주세요.
3) 약점도 솔직하게 말해 주세요.
4) 돋보이는 특징을 최소 한 가지 찾아 명확히 설명해 주세요.
5) 반드시 별도의 「연애운」 파트를 만들어 주세요. 아래 항목을 포함하세요.
   - 연애 성향과 끌리는 상대 유형
   - 연애에서 잘 되는 점 / 자주 막히는 점
   - 관계에서 조심할 패턴
   - 최근~앞으로의 연애운 흐름(대운·세운을 근거로)
   - 연애운을 높이는 실천 조언 1~2가지
6) 판단 근거는 사용자가 제공한 모든 정보와 해석 가능한 모든 사주 정보를 종합해 제시해 주세요.
7) 긍정적 해석과 부정적 해석을 모두 고려해 주세요.
8) 마지막은 「마무리 조언」으로 끝내세요. 질문하지 마세요. 태도·방향성 제시, 또는 짧은 응원의 한마디를 2~4문장으로 자연스럽게 적어 주세요.
이외에도 특이한점 한가지를 찾아서 언급해 주세요.

응답 형식 규칙:
- 마크다운을 쓰지 마세요. #, ##, ###, **, __, *, \`, []() 같은 기호를 절대 사용하지 마세요.
- 제목은 [기본차트해석], [연애운], [마무리 조언]처럼 대괄호만 사용하세요.
- 강조가 필요하면 따옴표나 문장으로만 표현하세요.

응답 구성은 다음 순서를 따르세요.
[기본차트해석] → [연애운] → [마무리 조언]

반드시 한국어로만 답하세요. 영어·중국어·로마자 설명은 쓰지 마세요.`

/**
 * 만 나이 계산 (생년월일 기준)
 */
export function getKoreanAge(birthDate) {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  if (Number.isNaN(birth.getTime())) return null

  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  const dayDiff = today.getDate() - birth.getDate()
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1
  }
  return age
}

/**
 * 입력값을 사주 해석용 사용자 프롬프트로 만듭니다.
 * Claude가 먼저 명식을 구성한 뒤, 기본차트해석 규칙으로 분석하게 합니다.
 */
export function buildSajuUserPrompt({
  name,
  birthDate,
  birthTime,
  gender,
  calendarType,
}) {
  const age = getKoreanAge(birthDate)
  const genderLabel = gender === 'male' ? '남성' : gender === 'female' ? '여성' : '미입력'
  const calendarLabel = calendarType === 'lunar' ? '음력' : '양력'

  return `아래 출생 정보를 바탕으로 사주 명식(년주·월주·일주·시주, 오행, 십신, 지장간, 납음, 십이운성, 12신살, 공망, 월령, 대운·세운·월운 등)을 정확히 구성한 뒤, 기본차트해석과 별도의 「연애운」 파트를 작성하세요.

이름: ${name || '미입력'}
성별: ${genderLabel}
나이: ${age === null ? '미입력' : `만 ${age}세`}
생년월일: ${birthDate || '미입력'} (${calendarLabel})
태어난 시간: ${birthTime || '미입력'}

해석 형식 참고(명식 구성 시 이런 항목들을 채워 사용하세요):
년주 / 월주 / 일주 / 시주
오행 분포
십신(천간) / 십신(지지)
지장간
납음
십이운성
12신살
旬/공망
월령
대운수
세운 / 월운 / 대운

마크다운(# , ** 등) 없이 평문으로만 작성하고, 마지막은 [마무리 조언]으로 끝내세요. 질문으로 끝내지 마세요.
return only Korean.`
}
