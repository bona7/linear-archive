import styled from "@emotion/styled";

export const Container = styled.div`
  width: 1152px; /* 1440 * 0.8 */
  height: 819.2px; /* 1024 * 0.8 */
  background-color: #ffffff;
  position: relative;
  font-family: "Pretendard", sans-serif;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const WelcomeText = styled.div`
  margin-top: 142px;
  font-family: "D2Coding ligature";
  font-weight: 400;
  font-size: 40px; /* 50 * 0.8 */
  white-space: nowrap;
`;

export const LoginForm = styled.form`
  margin-top: 100px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

export const Input = styled.input`
  width: 582.4px; /* 728 * 0.8 */
  padding: 8px; /* 10 * 0.8 */
  font-family: "D2Coding ligature";
  font-size: 24px; /* 30 * 0.8 */
  border: 1px solid #6a6868;
  border-radius: 2px;
  &::placeholder {
    color: #6a6868;
  }
`;

export const LoginButton = styled.button`
  margin-top: 40px;
  font-family: "D2Coding ligature";
  font-weight: 400;
  font-size: 24px; /* 30 * 0.8 */
  background: #e7e7e7;
  border-radius: 24px; /* 30 * 0.8 */
  padding: 12px 16px; /* 15px 20px * 0.8 */
  border: none;
  cursor: pointer;
`;
