# 사주잘봄

생년월일로 풀어보는 사주팔자 · 오행 운세, 그리고 타로 해석 서비스입니다.

👉 **서비스:** [https://sajujalbom.netlify.app](https://sajujalbom.netlify.app)

비로그인도 해석을 시작할 수 있고, Google 로그인 후 전체 결과 열람·저장·공유가 열립니다.

## 프로젝트와 구현 경험

장정현의 개인 웹 서비스 프로젝트입니다. React 화면부터 인증·기록 저장·AI API 연결·배포까지 구현했습니다.

- 입력 폼 → AI 해석 → 결과 화면 → 저장·공유로 이어지는 사용자 흐름
- Supabase Google OAuth, 프로필·해석 기록 데이터, 사용자별 RLS 정책
- 서버 함수에서 Claude API 호출을 중계하는 구조
- 페이지·공통 UI·기능별 모듈 분리와 전환 이벤트 분석

[개발자 프로필](https://github.com/JungHyeon-archplot)

## 기능

- **사주** — 이름·생년월일·시간·성별·양력/음력을 바탕으로 AI 해석
- **타로** — 카드 뽑기와 현재 고민에 대한 해석
- **게스트 체험** — 로그인 없이 미리보기, 전체 결과는 로그인 후 확인
- **Google 로그인** — Supabase Auth
- **결과 저장·공유** — 사주 기록 보관, 링크로 친구에게 공유
- **프로필** — 한 번 입력하면 사주·타로에 자동 반영
- **GA4** — 주요 전환(선택·해석·로그인·공유 등) 이벤트 추적

## 기술 스택

| 구분 | 사용 |
| --- | --- |
| Frontend | React 19, Vite |
| Auth / DB | Supabase (Google OAuth, Postgres, RLS) |
| AI | Claude (Anthropic) |
| Hosting | Netlify |
| Analytics | Google Analytics 4 |

## 로컬 실행

```bash
npm install
cp .env.example .env
npm run dev
```

브라우저에서 `http://localhost:5173` 을 엽니다.

### 환경 변수

`.env`에 아래 값을 채웁니다. (자세한 키 이름은 `.env.example` 참고)

| 변수 | 용도 |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL |
| `VITE_SUPABASE_ANON_KEY` 또는 `VITE_SUPABASE_PUBLISHABLE_KEY` | 클라이언트용 Supabase 키 |
| `ANTHROPIC_API_KEY` | Claude API 키 (서버/함수 쪽) |

배포 환경(Netlify 등)에도 동일한 서버 키를 설정해야 해석 API가 동작합니다.

`ANTHROPIC_API_KEY`는 서버 환경에만 넣고 `VITE_` 변수나 브라우저 코드로 전달하지 않습니다. 클라이언트용 Supabase 키와 서버 관리자 키는 구분해야 합니다. 실제 환경 파일은 `.gitignore`로 제외하며, 커밋·PR에는 비밀값 검사를 적용합니다.

### DB 스키마

`supabase/schema.sql`을 Supabase SQL Editor에 실행하면 사용자 프로필·사주/타로 기록·RLS 정책이 준비됩니다.

## 스크립트

```bash
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
npm run lint     # oxlint
```

## 프로젝트 구조

```
src/
  app/           # 라우팅·앱 상태
  features/      # home, saju, tarot, profile, shared-result
  components/    # 마스코트, 토스트, 로그인 게이트 등 공통 UI
  lib/           # Supabase, Claude 클라이언트, analytics
  styles/        # 공통 스타일
netlify/         # Netlify Functions
supabase/        # DB 스키마
```

## 프로젝트 정보

개인 프로젝트의 공개 소스 저장소입니다. 별도의 `LICENSE` 파일은 아직 없습니다.
