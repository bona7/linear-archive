import { supabase } from "./client";
import { setAccessToken, clearAccessToken } from "../../libraries/token";

export interface SignUpParams {
  email: string;
  password: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

/**
 * 회원가입
 */
export async function signUp({ email, password }: SignUpParams) {
  const { data, error } = await supabase.auth.signUp({
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
