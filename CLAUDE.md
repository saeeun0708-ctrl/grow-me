# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

**나를 키워줘** — 지인이 골라준 단어로 캐릭터를 키우고 "남이 보는 나"를 확인·자랑하는 바이럴 모바일 웹.
지인이 공유 링크로 들어와 이름 + 제시어 7개를 고르면("먹이주기"), 가장 많이 받은 제시어 카테고리의 캐릭터로 성장(3단계)한다. 결과는 인스타 공유용 이미지로 저장하고, "누가 무슨 단어를 골랐는지"는 700원 결제로 언락한다.

상세 기획은 `docs/PRD.md`(전문) / `docs/PRD.html`(스타일 버전)에 있고, **개발은 `docs/BUILD_PROMPTS.md`의 7단계 프롬프트를 순서대로 진행**한다. 현재 1단계(프로토타입)까지 완료.

## 명령어

```bash
npm install      # 의존성 설치 (vite만 사용)
npm run dev      # 개발 서버 (http://localhost:5173)
npm run build    # 프로덕션 빌드 → dist/
npm run preview  # 빌드 결과 미리보기
```

테스트·린트 도구는 아직 없음. 동작 검증은 dev 서버를 띄우고 `.claude/launch.json`의 `grow-me` 설정으로 Preview MCP(스크린샷·console·eval)를 사용한다.

## 아키텍처

순수 Vanilla JS + Vite. 프레임워크·번들 라이브러리 없음. 모바일 우선(`#app`을 max-width 430px 프레임으로 중앙 배치).

### 화면 렌더링 모델
- **`src/main.js`** = 해시 라우터 + 엔트리. `#app`의 `innerHTML`을 통째로 교체하는 방식. `navigate(path)`를 export하며, 각 화면은 이 함수를 import해 이동한다(main ↔ screens 순환 import이지만 런타임 호출이라 문제없음).
- 라우트: `''`→landing, `owner`→내 캐릭터, `feed/:slug`→먹이주기(지인), `result`→결과.
- 각 화면 모듈은 `render<Name>(app[, param])`을 export하고, DOM 이벤트 핸들러를 직접 바인딩한다. 재렌더는 보통 같은 `render*`를 다시 호출. `navigate()`는 **목표 해시가 현재와 같으면 `router()`를 직접 재실행**해서 같은-해시 이동도 재렌더되게 한다(온보딩이 `#/owner`에서 렌더되는 경우 등 대비).
- **테마**: 3종(딸기우유/블루베리/복숭아). `main.js`의 `applyTheme(name)`이 `#app`에 `theme-*` 클래스를 붙이고, `style.css`의 클래스별 CSS 변수(`--primary` 등)로 색이 바뀐다. 라우터가 로그인 사용자의 `me.theme`을, 친구 화면(feed)은 주인의 테마를 적용한다.
- **온보딩**: 최초 로그인 시 `users.theme`이 비어 있으면(`!me.theme`) 라우터 가드가 `renderOnboarding`으로 보낸다(닉네임+테마 선택 → `db.updateProfile` → `/owner`). 테마가 채워지면 이후 건너뛴다.

### 데이터 단일 출처 — `src/data/words.js`
캐릭터·제시어·성장 로직의 **유일한 진실 공급원**. 여기만 바꾸면 전 화면에 반영된다.
- `CHARACTERS`: 8종 캐릭터의 `{ name(표시명), concept, tagline, color }`. **키(`brain`,`charm`,`passion`,`cute`,`fun`,`warm`,`talent`,`mystery`)는 내부 코드이고, 화면엔 `name`을 노출**한다.
- `WORDS_BY_CATEGORY`: 카테고리 → 제시어 배열. **각 제시어는 정확히 한 카테고리에만 속해야 한다**(역매핑이 깨짐). 카테고리별 개수는 균등할 필요 없음(집계는 합계 비교).
- `WORD_TO_CATEGORY`(역매핑), `ALL_WORDS`(칩용 평면 리스트), `PICK_COUNT`(=7) 는 위에서 파생.
- `decideCharacter(feedbacks)`: **먹이 목록 `[{name, words}]`(시간 오름차순)** 을 받아 카테고리별로 합산 → 최다 카테고리 코드 반환(없으면 null). 평면 `string[]`도 호환. **합계 동점이면 단계적 타이브레이커**로 해소: ① 먼저 1위 점수에 도달한 카테고리(시간순) → ② 더 많은 서로 다른 사람이 고른 카테고리(고유 인원수) → ③ 고정 우선순위(`CHARACTER_PRIORITY`). 그래서 호출부는 **flatMap 하지 말고 `feedbacks`를 그대로 넘긴다**(순서·발신자 정보가 타이브레이커에 필요).
- `decideStage(count)`: 먹이 0→1단계, 1~2→2단계, 3+→3단계.

`docs/PRD.md` 부록 A의 JSON, `PRD.html`의 제시어 리스트가 `words.js`와 **항상 일치**해야 한다. 제시어/캐릭터를 수정할 때는 세 곳(words.js, PRD.md, PRD.html)을 함께 갱신한다.

### 데이터 계층 — `src/lib/db.js` + `src/lib/supabase.js`
화면은 **`db`(async API)에만 의존**한다. `db`는 두 백엔드를 같은 인터페이스로 감싼다:
- **Supabase 모드**: `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` 환경변수가 있으면 활성(`MODE === 'supabase'`). 카카오 OAuth, `users`/`feedbacks` 테이블, 공개 RPC(`get_owner_by_slug`, `submit_feedback`) 사용.
- **로컬 폴백 모드**: 키가 없으면 자동으로 localStorage(`growme_local_v2`) 더미. `npm run dev`가 설정 없이도 깨지지 않게 함.
- `db` API: `getSession / signIn / signOut / ensureMyUser / getOwnerBySlug / getMyFeedbacks / submitFeedback / updateMyComputed / setIndependent / setUnlocked`. **새 데이터 접근은 반드시 이 API에 양쪽 모드를 모두 구현**한다(한쪽만 추가하면 폴백이 깨짐).

**중요한 책임 분담**: 캐릭터/단계의 "진실"은 클라이언트가 피드백에서 `decideCharacter`/`decideStage`로 계산한다. `users.character_code`/`stage`는 주인이 자기 화면을 열 때 `updateMyComputed`로 갱신하는 **캐시**일 뿐(먹이주기 RPC는 단계를 SQL에서 재계산하지 않음 — 매핑을 SQL에 중복시키지 않으려는 의도). 지인 먹이주기는 RPC를 통해서만 `feedbacks`에 insert된다(RLS로 직접 insert 차단). 중복 먹이주기 방지는 클라이언트 localStorage(`growme_fed`)로 처리.

DB 스키마/정책은 `docs/schema.sql`(Supabase SQL Editor에 붙여 실행), 콘솔 설정 절차는 `docs/SETUP_SUPABASE.md` 참고. 인증·라우팅 부팅은 `main.js`의 `boot()`가 처리(OAuth `?code=` 교환 후 `/owner`로 이동, `owner`/`result`는 비로그인 시 랜딩으로 가드).

### 캐릭터 비주얼 — `src/components/character.js`
클로드 디자인(Claude Design) 핸드오프 번들의 `Character.jsx`(React/CSS)를 **Vanilla JS로 포팅**한 것. `renderCharacter(code, stage, size, bob)` 가 순수 CSS 도형(통통한 몸·반짝 눈·볼터치·발/손) + 캐릭터별 시그니처 장식(`feature`)을 조합해 **HTML 문자열**을 반환한다. 이모지가 아니라 실제 그림. 단계 매핑(=`decideStage(먹이수)`=`min(먹이수,3)`): `Lv.0`=눈 감은 알(0회), `Lv.1`=공통 새싹 아기(1회), `Lv.2`=어린이(특징 절반, featOp 0.6, 2회), `Lv.3`=완성형(3회+).
- 각 캐릭터의 `feature`(glasses/cool/flame/heart/laugh/warm/wand/mystic)와 `color`/`color2`는 `words.js`의 `CHARACTERS`에 정의. 캐릭터를 추가/수정하면 여기 색·feature도 채워야 렌더된다.
- 디자인 비주얼 아이덴티티: **딸기우유 팔레트**(primary `#FF7FA3`), 제목은 **Jua** 폰트(`.jua` 클래스 / `font-family:'Jua'`), 본문은 Pretendard. 배경은 핑크+블루 radial 그라데이션. 모두 `style.css` + `index.html`(폰트 CDN)에 정의. 애니메이션 클래스(`char-bob`,`flame-flick`,`sparkle-tw`,`grow-in`,`pop-in`,`confetti`)도 `style.css`에 있다.
- 원본 디자인 번들에는 8종×3단계 PNG 아트 의뢰서(`캐릭터 설명.md`)가 있으니, 실제 아트가 나오면 `renderCharacter`를 이미지 렌더로 교체할 수 있다.

## 컨벤션
- UI 텍스트·코드 주석·신규 마크다운은 **한국어**. 식별자/캐릭터 코드는 영어 유지.
- 화면 간 이동은 항상 `navigate()` 사용(직접 `location.hash` 조작 지양).
- 새 화면 추가 시: `src/screens/`에 `render*` export → `main.js` 라우터 `switch`에 케이스 추가.
- 결제/로그인/이미지 저장 등은 현재 더미 또는 alert. 각 화면의 `.dev-hint` 주석이 "어느 단계에서 실제 구현되는지"를 표시한다.
