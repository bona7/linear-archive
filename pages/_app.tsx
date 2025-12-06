// pages/_app.tsx
import { Global, css } from "@emotion/react";
import { RecoilRoot } from "recoil";
import Layout from "../src/components/commons/layout";
import "../styles/globals.css";
import Head from "next/head";
import { Router, useRouter } from "next/router";
import { useEffect, useState } from "react";
// import Script from "next/script"; // ✅ 추가
import "@blocknote/react/style.css";

import TokenInitializer from "../src/commons/libraries/TokenInitializer";
import {
  LoadingIcon,
  LoadingOverlay,
} from "../src/commons/libraries/loadingOverlay";

import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  /* --------- Service Worker 등록 --------- */
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const onLoad = () =>
        navigator.serviceWorker.register("/sw.js").catch(console.error);
      window.addEventListener("load", onLoad);
      return () => window.removeEventListener("load", onLoad);
    }
  }, []);
  /* ---------------------------------------- */

  // viewport height CSS 변수 세팅
  useEffect(() => {
    function setRealVh() {
      const h = window.visualViewport
        ? window.visualViewport.height
        : window.innerHeight;
      document.documentElement.style.setProperty("--vh", `${h * 0.01}px`);
    }
    setRealVh();
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", setRealVh);
      vv.addEventListener("scroll", setRealVh);
      return () => {
        vv.removeEventListener("resize", setRealVh);
        vv.removeEventListener("scroll", setRealVh);
      };
    } else {
      window.addEventListener("resize", setRealVh);
      return () => window.removeEventListener("resize", setRealVh);
    }
  }, []);

  const pretendardStyles = css`
    /* 폰트 선언들 생략 없이 그대로 유지 */
    @font-face {
      font-family: "Pretendard";
      src: url("/fonts/Pretendard-Thin.otf") format("opentype");
      font-weight: 100;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: "Pretendard";
      src: url("/fonts/Pretendard-ExtraLight.otf") format("opentype");
      font-weight: 200;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: "Pretendard";
      src: url("/fonts/Pretendard-Light.otf") format("opentype");
      font-weight: 300;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: "Pretendard";
      src: url("/fonts/Pretendard-Regular.otf") format("opentype");
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: "Pretendard";
      src: url("/fonts/Pretendard-Medium.otf") format("opentype");
      font-weight: 500;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: "Pretendard";
      src: url("/fonts/Pretendard-SemiBold.otf") format("opentype");
      font-weight: 600;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: "Pretendard";
      src: url("/fonts/Pretendard-Bold.otf") format("opentype");
      font-weight: 700;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: "Pretendard";
      src: url("/fonts/Pretendard-ExtraBold.otf") format("opentype");
      font-weight: 800;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: "Pretendard";
      src: url("/fonts/Pretendard-Black.otf") format("opentype");
      font-weight: 900;
      font-style: normal;
      font-display: swap;
    }
    html,
    body,
    #__next {
      font-family: "Pretendard", sans-serif;
    }
  `;

  // 라우팅 로딩 오버레이
  const [loadingRoute, setLoadingRoute] = useState(false);
  useEffect(() => {
    const handleStart = () => setLoadingRoute(true);
    const handleComplete = () => setLoadingRoute(false);
    Router.events.on("routeChangeStart", handleStart);
    Router.events.on("routeChangeComplete", handleComplete);
    Router.events.on("routeChangeError", handleComplete);
    return () => {
      Router.events.off("routeChangeStart", handleStart);
      Router.events.off("routeChangeComplete", handleComplete);
      Router.events.off("routeChangeError", handleComplete);
    };
  }, []);

  // ✅ GA4: page_path(실제 URL) + screen_name(그룹 차원) 동시 전송
  useEffect(() => {
    const trackPageView = () => {
      const pagePath = router.asPath; // 예: /games/123?tab=box
      const routePattern = router.pathname; // 예: /games/[id]  ← 그룹 차원

      // @ts-ignore
      window.gtag?.("event", "page_view", {
        page_path: pagePath,
        page_title: document.title,
        page_location: window.location.href,
        screen_name: routePattern, // ← GA4 맞춤 차원으로 등록해서 사용
      });
    };

    // 최초 1회
    trackPageView();
    // 라우트 변경마다
    router.events.on("routeChangeComplete", trackPageView);
    return () => router.events.off("routeChangeComplete", trackPageView);
  }, [router.events, router.asPath, router.pathname]);

  return (
    <>
      <Head>
        <title>연표아카이빙</title>
        <meta name="description" content="연표아카이빙" />
      </Head>

      <Global styles={pretendardStyles} />
      <RecoilRoot>
        <TokenInitializer />

        <LoadingOverlay visible={loadingRoute}>
          <LoadingIcon spin fontSize={48} />
        </LoadingOverlay>

        <Layout>
          <Component {...pageProps} />
        </Layout>
      </RecoilRoot>
    </>
  );
}

export default MyApp;
