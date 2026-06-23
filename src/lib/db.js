// 통합 데이터 계층 — Supabase 모드 / 로컬 더미 모드를 같은 async API로 감싼다.
// 화면(screens)은 이 모듈만 의존한다. (Supabase 미설정 시 자동 로컬 폴백)
import { supabase, isSupabaseConfigured } from "./supabase.js";

export const MODE = isSupabaseConfigured ? "supabase" : "local";

// 슬러그 생성기 (헷갈리는 0,1,l,o 제외)
function genSlug() {
  const c = "abcdefghijkmnpqrstuvwxyz23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += c[Math.floor(Math.random() * c.length)];
  return s;
}

/* ───────────────────────── 로컬 더미 모드 ───────────────────────── */
const LKEY = "growme_local_v2";
function lload() {
  try {
    return (
      JSON.parse(localStorage.getItem(LKEY)) || {
        me: null, // { id, nickname, share_slug, is_independent, is_unlocked }
        feedbacks: [], // { sender_name, selected_words }
      }
    );
  } catch {
    return { me: null, feedbacks: [] };
  }
}
function lsave(s) {
  localStorage.setItem(LKEY, JSON.stringify(s));
}

const local = {
  async getSession() {
    return lload().me ? { user: { id: "local" } } : null;
  },
  async signIn() {
    const s = lload();
    if (!s.me)
      s.me = {
        id: "local",
        nickname: "나",
        theme: null, // 온보딩에서 설정
        share_slug: "demo",
        is_independent: false,
        is_unlocked: false,
      };
    lsave(s);
    return s.me;
  },
  async signOut() {
    localStorage.removeItem(LKEY);
  },
  async ensureMyUser() {
    return lload().me;
  },
  async getOwnerBySlug(_slug) {
    // 단일 사용자 데모: 항상 내 캐릭터를 주인으로 취급
    return lload().me;
  },
  async getMyFeedbacks() {
    return lload().feedbacks.map((f) => ({
      name: f.sender_name,
      words: f.selected_words,
    }));
  },
  async getFeedbacksBySlug(_slug) {
    // 단일 사용자 데모: slug 무관하게 내 먹이를 그대로 반환(공개 결과 뷰용)
    return lload().feedbacks.map((f) => ({
      name: f.sender_name,
      words: f.selected_words,
    }));
  },
  async submitFeedback(_ownerId, name, words) {
    const s = lload();
    // 독립한 캐릭터도 먹이는 계속 받을 수 있다(차단하지 않음)
    s.feedbacks.push({ sender_name: name, selected_words: words });
    lsave(s);
  },
  async updateMyComputed(code, stage) {
    const s = lload();
    if (s.me) {
      s.me.character_code = code;
      s.me.stage = stage;
      lsave(s);
    }
  },
  async updateProfile(nickname, theme) {
    const s = lload();
    if (s.me) {
      s.me.nickname = nickname;
      s.me.theme = theme;
      lsave(s);
    }
  },
  async setIndependent(v) {
    const s = lload();
    if (s.me) s.me.is_independent = v;
    lsave(s);
  },
  async setUnlocked(v) {
    const s = lload();
    if (s.me) s.me.is_unlocked = v;
    lsave(s);
  },
  async reset() {
    localStorage.removeItem(LKEY);
  },
};

/* ───────────────────────── Supabase 모드 ───────────────────────── */
const remote = {
  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },
  async signIn() {
    // OAuth: 카카오 로그인 → 같은 URL로 리다이렉트(해시 없는 경로)
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: location.origin + location.pathname },
    });
    // 리다이렉트되므로 이 아래는 실행되지 않음
  },
  async signOut() {
    await supabase.auth.signOut();
  },
  async ensureMyUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: rows } = await supabase
      .from("users")
      .select("*")
      .eq("auth_id", user.id)
      .limit(1);
    if (rows && rows.length) return rows[0];

    // 없으면 생성 (슬러그 충돌 시 재시도)
    // 카카오: user_metadata에 name/nickname/preferred_username 등으로 들어옴
    const m = user.user_metadata || {};
    const nickname =
      m.name ||
      m.nickname ||
      m.full_name ||
      m.preferred_username ||
      m.user_name ||
      user.email?.split("@")[0] ||
      "나";
    for (let attempt = 0; attempt < 4; attempt++) {
      const { data, error } = await supabase
        .from("users")
        .insert({ auth_id: user.id, nickname, share_slug: genSlug() })
        .select()
        .single();
      if (!error) return data;
      if (!String(error.message).includes("duplicate")) throw error;
    }
    return null;
  },
  async getOwnerBySlug(slug) {
    const { data, error } = await supabase.rpc("get_owner_by_slug", {
      p_slug: slug,
    });
    if (error) throw error;
    return data && data[0] ? data[0] : null;
  },
  async getMyFeedbacks() {
    const me = await this.ensureMyUser();
    if (!me) return [];
    const { data } = await supabase
      .from("feedbacks")
      .select("sender_name, selected_words, created_at")
      .eq("owner_user_id", me.id)
      .order("created_at", { ascending: true });
    return (data || []).map((r) => ({
      name: r.sender_name,
      words: r.selected_words,
    }));
  },
  async getFeedbacksBySlug(slug) {
    // 비로그인 공개 결과 뷰용: slug로 주인의 먹이 목록을 공개 RPC로 조회.
    // ※ 보낸 사람 이름은 결제(언락) 영역이라 RPC가 단어만 반환한다(name 비움).
    const { data, error } = await supabase.rpc("get_feedbacks_by_slug", {
      p_slug: slug,
    });
    if (error) throw error;
    return (data || []).map((r) => ({
      name: "",
      words: r.selected_words,
    }));
  },
  async submitFeedback(ownerId, name, words) {
    const { error } = await supabase.rpc("submit_feedback", {
      p_owner: ownerId,
      p_name: name,
      p_words: words,
    });
    if (error) throw error;
  },
  async updateMyComputed(code, stage) {
    const me = await this.ensureMyUser();
    if (!me) return;
    await supabase
      .from("users")
      .update({ character_code: code, stage })
      .eq("id", me.id);
  },
  async updateProfile(nickname, theme) {
    const me = await this.ensureMyUser();
    if (!me) return;
    await supabase
      .from("users")
      .update({ nickname, theme })
      .eq("id", me.id);
  },
  async setIndependent(v) {
    const me = await this.ensureMyUser();
    if (!me) return;
    await supabase.from("users").update({ is_independent: v }).eq("id", me.id);
  },
  async setUnlocked(v) {
    const me = await this.ensureMyUser();
    if (!me) return;
    await supabase.from("users").update({ is_unlocked: v }).eq("id", me.id);
  },
  async reset() {
    /* 운영 데이터는 임의 초기화하지 않음 */
  },
};

export const db = isSupabaseConfigured ? remote : local;
