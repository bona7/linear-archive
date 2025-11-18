import styled from "@emotion/styled";

export const HoverCardContainer = styled.div<{ left: string }>`
  position: absolute;
  left: calc(${(props) => props.left} - 1px);
  top: calc(50% - 10px);
`;

export const VerticalLine = styled.div`
  position: absolute;
  width: 1.03px;
  height: 173.6px; /* 217 * 0.8 */
  left: 9.6px; /* 12 * 0.8 */
  top: 20px; /* 25 * 0.8 */
  border: 1px solid #000000;
`;

export const CardFrame = styled.div`
  position: absolute;
  width: 325.6px; /* 407 * 0.8 */
  height: 175.2px; /* 219 * 0.8 */
  left: -152.8px; /* -191 * 0.8 */
  top: 193.6px; /* 242 * 0.8 */
  background: #ffffff;
  border: 1px solid #000000;
  border-radius: 24px; /* 30 * 0.8 */
`;

export const TitleWrapper = styled.div`
  position: absolute;
  left: 28px; /* 35 * 0.8 */
  top: 24px; /* 30 * 0.8 */
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const CardTitle = styled.div`
  font-family: "Inter";
  font-style: normal;
  font-weight: 400;
  font-size: 24px; /* 30 * 0.8 */
  line-height: 1.21;
  color: #000000;
`;

export const CardDescription = styled.div`
  position: absolute;
  width: 135.2px; /* 169 * 0.8 */
  height: 56px; /* 70 * 0.8 */
  left: 26.4px; /* 33 * 0.8 */
  top: 68px; /* 85 * 0.8 */
  font-family: "Inter";
  font-style: normal;
  font-weight: 400;
  font-size: 12px; /* 15 * 0.8 */
  line-height: 1.21;
  color: #000000;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
`;

export const CardTagFrame = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 2.4px 8px; /* 3px 10px * 0.8 */
  gap: 8px; /* 10 * 0.8 */
  background: #9e0606;
  border-radius: 8.8px; /* 11 * 0.8 */
`;

export const CardTagText = styled.div`
  font-family: "Inter";
  font-style: normal;
  font-weight: 400;
  font-size: 9.6px; /* 12 * 0.8 */
  line-height: 1.21;
  color: #ffffff;
`;

export const CardImagePlaceholder = styled.div`
  position: absolute;
  width: 117.6px; /* 147 * 0.8 */
  height: 87.2px; /* 109 * 0.8 */
  left: 192.8px; /* 241 * 0.8 */
  top: 68px; /* 85 * 0.8 */
  background: #d9d9d9;
`;

export const CloseIcon = styled.img`
  position: absolute;
  width: 19.2px; /* 24 * 0.8 */
  height: 19.2px; /* 24 * 0.8 */
  left: 291.2px; /* 364 * 0.8 */
  top: 8.8px; /* 11 * 0.8 */
`;
