import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  ModalOverlay,
  ModalContainer,
  CloseButton,
  TitleInput,
  DatePickerWrapper,
  ContentContainer,
  ImageUploadContainer,
  ImagePlaceholder,
  AddIcon,
  ImageUploadText,
  DescriptionTextarea,
  ButtonContainer,
  Button,
} from "./createModal.style";

interface CreateModalProps {
  onClose: () => void;
}

const CreateModal: React.FC<CreateModalProps> = ({ onClose }) => {
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <CloseButton
          src="/icons/modal/close-icon.svg"
          alt="close"
          onClick={onClose}
        />
        <TitleInput placeholder="제목 입력창" />
        <ContentContainer>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <DatePickerWrapper>
              <DatePicker
                selected={startDate}
                onChange={(date: Date | null) => setStartDate(date)}
                inline
              />
            </DatePickerWrapper>
            <ImageUploadContainer>
              <ImagePlaceholder src="/icons/modal/image-placeholder.svg" />
              <AddIcon src="/icons/modal/add-icon.svg" />
              <ImageUploadText>이미지 추가하기</ImageUploadText>
            </ImageUploadContainer>
          </div>
          <DescriptionTextarea placeholder="desc desc desc descdesc descdesc descdesc desc..." />
        </ContentContainer>

        <ButtonContainer>
          <Button>취소</Button>
          <Button>저장</Button>
        </ButtonContainer>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default CreateModal;
