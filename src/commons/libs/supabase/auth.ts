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
        display_name: displayName, // user_metadata에 저장
      },
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
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
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
  const user = await getUser();
  return (user.user_metadata?.display_name as string) || null;
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
