import { useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useSetRecoilState } from "recoil";
import { accessTokenState, authCheckedState } from "../stores";
import {
  registerAccessTokenSetter,
  setAccessToken,
  clearAccessToken,
} from "../libraries/token";
import { supabase } from "../libs/supabase/client";

// 인증이 필요하지 않은 경로 (컴포넌트 외부로 이동)
const AUTH_NOT_REQUIRED_PATHS = [
  "/login",
  "/signUp",
  "/login/findPassword/resetPassword",
];

export default function TokenInitializer() {
  const setToken = useSetRecoilState(accessTokenState);
  const setChecked = useSetRecoilState(authCheckedState);
  const router = useRouter();

  // ① RecoilRoot 안에서만 registerAccessTokenSetter를 호출
  useEffect(() => {
    registerAccessTokenSetter(setToken);
    return () => {
      // clearAccessToken은 async이지만 cleanup에서는 await 불필요
      // (컴포넌트 언마운트 시 비동기 작업 완료를 기다릴 필요 없음)
      clearAccessToken();
    };
  }, [setToken]);

  // ② Supabase 세션 체크 및 인증 상태 리스너
  useEffect(() => {
    if (typeof window === "undefined") return;

    const currentPath = router.pathname;

    // 인증이 필요하지 않은 페이지에서는 체크 스킵
    if (AUTH_NOT_REQUIRED_PATHS.some((path) => currentPath.startsWith(path))) {
      setChecked(true);
      return;
    }

    // 초기 세션 체크
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("세션 체크 실패:", error);
          setChecked(true);
          return;
        }

        if (session?.access_token) {
          setAccessToken(session.access_token);
          console.log("세션 복원 성공");
        } else {
          console.log("세션 없음");
        }
      } catch (err) {
        console.error("세션 체크 중 오류:", err);
      } finally {
        setChecked(true);
      }
    };

    checkSession();

    // Supabase 인증 상태 변경 리스너
    // 자동 토큰 갱신도 여기서 처리됨
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("인증 상태 변경:", event, session);

      if (session?.access_token) {
        setAccessToken(session.access_token);
      } else {
        await clearAccessToken();

        // 로그아웃된 경우 로그인 페이지로 이동 (선택사항)
        if (
          event === "SIGNED_OUT" &&
          !AUTH_NOT_REQUIRED_PATHS.some((path) =>
            router.pathname.startsWith(path)
          )
        ) {
          router.push("/login");
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setChecked, router.pathname]);

  return null;
}
