// Supabase 클라이언트 (환경변수 없으면 null → 로컬 더미 모드로 폴백)
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && key);

export const supabase = isSupabaseConfigured
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true, // OAuth 리다이렉트(?code=) 자동 처리
      },
    })
  : null;
