import { supabase } from "./client";
import { setAccessToken, clearAccessToken } from "../../libraries/token";

export interface SignUpParams {
  email: string;
  password: string;
  displayName: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

/**
 * 회원가입
 * displayName은 user_metadata에 저장됨
 */
export async function signUp({ email, password, displayName }: SignUpParams) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
      emailRedirectTo: `${
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      }`, // 이메일 인증 후 리다이렉트할 URL
    },
  });

  if (error) throw error;

  if (data.session?.access_token) {
    setAccessToken(data.session.access_token);
  }

  return data;
}

/**
 * 로그인
 */
export async function signIn({ email, password }: SignInParams) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  if (data.session?.access_token) {
    setAccessToken(data.session.access_token);
  }

  return data;
}

/**
 * 로그아웃
 */
export async function signOut() {
  // 3. 마지막으로 localStorage 완전히 비우기 (선택사항)
  if (typeof window !== "undefined") {
    localStorage.clear();
  }
  // 1. 먼저 Supabase 세션 정리 (이것이 localStorage의 Supabase 관련 항목도 정리함)
  const { error } = await supabase.auth.signOut();
  if (error) throw error;

  // 2. 메모리와 Recoil 상태 정리 (내부의 signOut 호출은 중복이므로 제거 필요)
  await clearAccessToken();
}

/**
 * 현재 세션 가져오기
 */
export async function getSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
}

/**
 * 현재 사용자 가져오기
 */
export async function getUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

/**
 * 현재 사용자의 displayName 가져오기
 */
export async function getDisplayName(): Promise<string | null> {
  const session = await getSession();
  if (!session?.user) {
    return null;
  }
  return (session.user.user_metadata?.display_name as string) || null;
}

/**
 * displayName 업데이트
 */
export async function updateDisplayName(displayName: string) {
  const { data, error } = await supabase.auth.updateUser({
    data: {
      display_name: displayName,
    },
  });

  if (error) {
    throw new Error(`Failed to update display name: ${error.message}`);
  }

  return data;
}
