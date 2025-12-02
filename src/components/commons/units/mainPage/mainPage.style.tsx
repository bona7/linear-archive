import styled from "@emotion/styled";

// ─── 전체 컨테이너 ─────────────────────────────
export const Container = styled.div`
  width: 1152px;
  height: 819.2px;
  background-color: #ffffff;
  position: relative;
  font-family: "Pretendard", sans-serif;
  margin: 0 auto;
`;

// ─── 텍스트 스타일 ─────────────────────────────
export const MainText = styled.div`
  position: absolute;
  width: 240px;
  height: 46.4px;
  left: 440px;
  top: 113.6px;
  font-family: "D2Coding ligature";
  font-style: normal;
  font-weight: 400;
  font-size: 40px;
  line-height: 1.16;
  color: #000000;
`;

export const DateText = styled.div<{ left: string; top: string }>`
  position: absolute;
  width: 72px; /* 90 * 0.8 */
  height: 20.8px; /* 26 * 0.8 */
  left: ${(props) => props.left};
  top: ${(props) => props.top};
  font-family: "D2Coding ligature";
  font-style: normal;
  font-weight: 400;
  font-size: 17.93px; /* 22.4167 * 0.8 */
  line-height: 1.16;
  color: #000000;
`;

// ─── 데코레이션 ─────────────────────────────
export const ArrowImage = styled.img`
  position: absolute;
  width: 80%;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
`;

export const Ellipse = styled.div<{
  left: string;
  backgroundColor: string;
}>`
  position: absolute;
  width: 18px;
  height: 18px;
  left: ${(props) => props.left};
  top: calc(50% - 9px);
  background-color: ${(props) => props.backgroundColor};
  border-radius: 50%;
  cursor: pointer;
`;

export const Frame174 = styled.img`
  position: absolute;
  left: 460px; /* 575 * 0.8 */
  top: 192px; /* 240 * 0.8 */
  width: 199.2px; /* 249 * 0.8 */
  height: 48px; /* 60 * 0.8 */
`;
