import { useEffect, useRef } from "react";

interface UseModalPreventCloseOptions {
  isOpen: boolean;
  preventBackdropClick?: boolean; // 바깥 영역 클릭 방지 (기본값: true)
  preventBrowserBack?: boolean; // 브라우저 뒤로가기 방지 (기본값: true)
}

/**
 * 모달이 닫히는 것을 방지하는 커스텀 훅
 * - 모달 바깥 영역 클릭 시 닫히는 것을 방지
 * - 브라우저 뒤로가기 시 닫히는 것을 방지
 */
export function useModalPreventClose({
  isOpen,
  preventBackdropClick = true,
  preventBrowserBack = true,
}: UseModalPreventCloseOptions) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const historyStateRef = useRef<string | null>(null);

  // 브라우저 뒤로가기 방지
  useEffect(() => {
    if (!isOpen || !preventBrowserBack) return;

    // 모달이 열릴 때 현재 상태를 히스토리에 추가
    historyStateRef.current = `modal-${Date.now()}`;
    window.history.pushState(
      { modal: historyStateRef.current },
      "",
      window.location.href
    );

    // popstate 이벤트 핸들러 (뒤로가기 감지)
    const handlePopState = (event: PopStateEvent) => {
      // 모달이 열려있는 동안 뒤로가기를 막기 위해 다시 pushState
      if (isOpen) {
        window.history.pushState(
          { modal: historyStateRef.current },
          "",
          window.location.href
        );
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isOpen, preventBrowserBack]);

  // 바깥 영역 클릭 방지
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!preventBackdropClick) return;

    // backdrop 자체를 클릭한 경우에만 방지
    if (e.target === e.currentTarget) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  return {
    backdropRef,
    handleBackdropClick,
  };
}
