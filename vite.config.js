import { defineConfig } from "vite";

export default defineConfig({
  // GitHub Pages 하위 경로(/grow-me/)·커스텀 도메인 모두에서 동작하도록 상대경로 빌드
  base: "./",
  // PORT 환경변수가 있으면 그 포트로 바인딩(프리뷰 하니스가 할당한 포트를 따르도록).
  // 없으면 기존처럼 5173 기본값을 쓴다.
  server: process.env.PORT ? { port: Number(process.env.PORT), strictPort: false } : undefined,
});
