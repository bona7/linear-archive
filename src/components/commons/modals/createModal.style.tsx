import styled from "@emotion/styled";

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

export const ModalContainer = styled.div`
  width: 840px; /* 1050 * 0.8 */
  height: 480px; /* 600 * 0.8 */
  background: #ffffff;
  border: 1px solid #000000;
  border-radius: 24px; /* 30 * 0.8 */
  position: relative;
  padding: 27.2px 50.4px; /* 34px 63px * 0.8 */
`;

export const CloseButton = styled.img`
  position: absolute;
  top: 27.2px; /* 34 * 0.8 */
  right: 32px; /* 40 * 0.8 */
  width: 32px; /* 40 * 0.8 */
  height: 32px; /* 40 * 0.8 */
  cursor: pointer;
`;

export const TitleInput = styled.input`
  font-family: "D2Coding ligature";
  font-style: normal;
  font-weight: 400;
  font-size: 32px; /* 40 * 0.8 */
  line-height: 1.16;
  color: #000000;
  border: none;
  outline: none;
  width: 100%;
  &::placeholder {
    color: #bdbdbd;
  }
`;

export const DatePickerWrapper = styled.div`
  .react-datepicker-wrapper {
    width: 100%;
  }
  .react-datepicker__input-container {
    display: none; /* Hide the input field */
  }
  .react-datepicker {
    border: none;
    height: 170px; /* Adjusted height to fit */
    overflow-y: auto; /* Make it scrollable if content overflows */
    font-size: 0.8em; /* Optionally reduce font size for compactness */
  }
  .react-datepicker__header {
    padding-top: 0.4em;
  }
  .react-datepicker__month {
    margin: 0.4em 0.8em;
  }
  .react-datepicker__day-name,
  .react-datepicker__day {
    width: 1.7em;
    line-height: 1.7em;
  }
`;

export const ContentContainer = styled.div`
  display: flex;
  gap: 48px; /* 60 * 0.8 */
  margin-top: 32px; /* 40 * 0.8 */
`;

export const ImageUploadContainer = styled.div`
  position: relative;
  width: 215.2px; /* 269 * 0.8 */
  height: 155.2px; /* 194 * 0.8 */
`;

export const ImagePlaceholder = styled.img`
  width: 100%;
  height: 100%;
`;

export const AddIcon = styled.img`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 68px; /* 85 * 0.8 */
  height: 68px; /* 85 * 0.8 */
`;

export const ImageUploadText = styled.div`
  position: absolute;
  bottom: -28px; /* -35 * 0.8 */
  left: 50%;
  transform: translateX(-50%);
  font-family: "Inter";
  font-weight: 400;
  font-size: 17.92px; /* 22.4 * 0.8 */
  color: #000000;
  white-space: nowrap;
`;

export const DescriptionTextarea = styled.textarea`
  width: 396.8px; /* 496 * 0.8 */
  height: 266.4px; /* 333 * 0.8 */
  font-family: "Inter";
  font-weight: 400;
  font-size: 16px; /* 20 * 0.8 */
  line-height: 1.21;
  color: #000000;
  border: none;
  outline: none;
  resize: none;
  &::placeholder {
    color: #bdbdbd;
  }
`;

export const ButtonContainer = styled.div`
  position: absolute;
  bottom: 32px; /* 40 * 0.8 */
  right: 32px; /* 40 * 0.8 */
  display: flex;
  gap: 16px; /* 20 * 0.8 */
`;

export const Button = styled.button`
  font-family: "D2Coding ligature";
  font-weight: 400;
  font-size: 16px; /* 20 * 0.8 */
  background: #e7e7e7;
  border-radius: 16px; /* 20 * 0.8 */
  padding: 12px 16px; /* 15px 20px * 0.8 */
  border: none;
  cursor: pointer;
`;

export const TagFrame = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 2.4px 8px; /* 3px 10px * 0.8 */
  gap: 8px; /* 10 * 0.8 */
  background: #9e0606; /* Default color, will be overridden by prop */
  border-radius: 8.8px; /* 11 * 0.8 */
`;

export const TagText = styled.div`
  font-family: "Inter";
  font-style: normal;
  font-weight: 400;
  font-size: 9.6px; /* 12 * 0.8 */
  line-height: 1.21;
  color: #ffffff;
`;

