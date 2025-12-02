import styled from "@emotion/styled";

export const Container = styled.div`
  width: 1152px; /* 1440 * 0.8 */
  height: 819.2px; /* 1024 * 0.8 */
  background-color: #ffffff;
  position: relative;
  font-family: "Pretendard", sans-serif;
  margin: 0 auto;
`;

export const WelcomeText = styled.div`
  position: absolute;
  left: 50%;
  top: 363px; /* 363px * 0.8 = 290.4px, but let's keep it as per figma for now */
  transform: translateX(-50%);
  font-family: "D2Coding ligature";
  font-weight: 400;
  font-size: 40px; /* 50 * 0.8 */
  white-space: nowrap;
`;

export const ArrowImage = styled.img`
  position: absolute;
  width: 80%;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
`;

export const ButtonWrapper = styled.div`
  position: absolute;
  top: 617px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 100px;
`;

export const IntroButton = styled.button`
  font-family: "D2Coding ligature";
  font-weight: 400;
  font-size: 24px; /* 30 * 0.8 */
  background: #e7e7e7;
  border-radius: 24px; /* 30 * 0.8 */
  padding: 12px 16px; /* 15px 20px * 0.8 */
  border: none;
  cursor: pointer;
`;
