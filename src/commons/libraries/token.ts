// libs/token.ts
import type { SetterOrUpdater } from "recoil";
import { supabase } from "../libs/supabase/client"; // ← 정적 import

let inMemoryAccessToken: string | null = null;
let recoilSetter: SetterOrUpdater<string | null> | null = null;

/** _app.tsx에서 useSetRecoilState를 한 번만 전달하세요 */
export function registerAccessTokenSetter(
  setter: SetterOrUpdater<string | null>
) {
  recoilSetter = setter;
}

/** 메모리상의 토큰 반환 (Supabase 세션 우선) */
export async function getAccessToken(): Promise<string | null> {
  // Supabase 세션에서 토큰 가져오기
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      return session.access_token;
    }
  } catch (error) {
    console.error("Failed to get Supabase session:", error);
  }

  // 폴백: in-memory 토큰
  return inMemoryAccessToken;
}

/** 메모리·Recoil 동기화 (Supabase 세션도 함께 저장) */
export function setAccessToken(token: string) {
  inMemoryAccessToken = token;
  recoilSetter?.(token);
}

/** 메모리·Recoil 초기화 (Supabase 세션도 함께 제거) */
export async function clearAccessToken() {
  inMemoryAccessToken = null;
  recoilSetter?.(null);

  // // Supabase 세션도 로그아웃
  // try {
  //   await supabase.auth.signOut();
  // } catch (error) {
  //   console.error("Failed to sign out from Supabase:", error);
  // }
}
