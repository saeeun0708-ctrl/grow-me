# Supabase 설정 가이드 (2단계)

> 이 문서는 **회원님이 Supabase 콘솔에서 직접** 해야 하는 부분이에요.
> 코드는 이미 다 작성돼 있고, 아래만 마치면 실제 로그인/DB가 켜집니다.
> (설정 전에는 자동으로 "로컬 더미 모드"로 작동하니 앱은 계속 실행돼요.)

소요 시간: 약 10~15분.

---

## 1. Supabase 프로젝트 만들기

1. https://supabase.com 접속 → **Start your project** → 깃허브/이메일로 가입
2. **New project** 클릭
   - Name: `grow-me` (아무거나)
   - Database Password: 안전하게 저장 (안 써도 됨)
   - Region: `Northeast Asia (Seoul)` 추천
3. 생성까지 1~2분 대기

---

## 2. API 키 복사 → `.env.local` 만들기

1. 좌측 메뉴 → **Project Settings**(톱니) → **API**
2. 두 값을 복사:
   - **Project URL** (`https://xxxx.supabase.co`)
   - **anon public** 키 (`eyJhb...` 로 시작하는 긴 문자열)
3. 프로젝트 폴더에서 `.env.example`을 복사해 **`.env.local`** 파일을 만들고 값을 채워요:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhb...복사한_키
```

> ⚠️ `.env.local`은 `.gitignore`에 들어가 있어 깃에 올라가지 않아요. (anon 키는 공개돼도 되는 키지만 습관상 분리)

---

## 3. 테이블/정책 만들기 (SQL 실행)

1. 좌측 메뉴 → **SQL Editor** → **New query**
2. 프로젝트의 **`docs/schema.sql`** 내용을 전부 복사해 붙여넣기
3. **Run** 클릭 → "Success" 확인
4. 좌측 **Table Editor**에서 `users`, `feedbacks` 테이블이 생겼는지 확인

---

## 4. 카카오 로그인 켜기

카카오 로그인은 카카오 디벨로퍼스에서 키를 발급받아 Supabase에 넣어야 해요.

### 4-1. 카카오 앱 만들기
1. https://developers.kakao.com → 로그인 → **내 애플리케이션 → 애플리케이션 추가하기**
   - 앱 이름: `나를 키워줘`, 사업자명: 본인/아무거나 → 저장
2. 만든 앱 클릭 → **앱 설정 → 앱 키** 에서 **REST API 키** 복사 (이게 Client ID)

### 4-2. 카카오 로그인 활성화 + Redirect URI
1. 좌측 **카카오 로그인** → **활성화 설정** ON
2. 같은 화면 **Redirect URI 등록**에 아래 추가 (Supabase가 알려주는 콜백 주소):
   ```
   https://xxxx.supabase.co/auth/v1/callback
   ```
   (`xxxx`는 본인 프로젝트 URL. Supabase의 Kakao provider 화면에도 똑같이 안내돼 있어요)

### 4-3. Client Secret 발급
1. 좌측 **카카오 로그인 → 보안** → **Client Secret** **코드 생성** → **활성화 상태: 사용함**
2. 생성된 **Client Secret** 코드 복사

### 4-4. 동의 항목 설정 (닉네임 받기)
1. 좌측 **카카오 로그인 → 동의항목**
2. **닉네임(profile_nickname)** → 설정 → **선택 동의** 또는 필수 동의로 ON
   (닉네임이 캐릭터 표시 이름으로 쓰여요. 안 받으면 "나"로 표시됩니다)

### 4-5. Supabase에 넣기
1. Supabase 좌측 → **Authentication → Sign In / Providers → Kakao**
2. **Enable** 켜고:
   - **Kakao Client ID** ← 4-1의 **REST API 키**
   - **Kakao Client Secret** ← 4-3의 **Client Secret 코드**
3. **Save**

### 4-6. 리다이렉트 URL 허용 (로컬 개발용)
1. Supabase → **Authentication → URL Configuration**
2. **Site URL**: `http://localhost:5173`
3. **Redirect URLs**에 추가: `http://localhost:5173` (배포 후엔 실제 도메인도 추가)

---

## 5. 구글 로그인 (나중에 추가하려면)

구글도 같은 방식이에요: 구글 클라우드 콘솔에서 OAuth 클라이언트 ID/시크릿 발급 →
Supabase의 **Google** provider에 입력 → 코드의 `signIn()` provider를 `"kakao"`→`"google"`로
바꾸거나 로그인 버튼을 두 개로 나누면 됩니다. (현재는 카카오만)

---

## 6. 동작 확인

1. 개발 서버 재시작: `npm run dev` (`.env.local`은 재시작해야 반영돼요)
2. 랜딩 화면 안내가 **"🔌 Supabase 모드"** 로 바뀌면 연결 성공
3. **시작하기(카카오로 로그인)** → 카카오 로그인 → 내 캐릭터 화면 진입
4. Supabase **Table Editor → users** 에 내 row가 생겼는지 확인
5. **내 공유 링크 복사** → 시크릿창에서 열어 먹이주기 → **feedbacks** 에 row 적재 확인

여기까지 되면 2단계 완료예요! 🎉
막히는 부분 있으면 어디서 멈췄는지 알려주세요. 같이 풀어요.
