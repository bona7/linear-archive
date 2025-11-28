import React, { useState, useRef } from "react";
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
import {
  createBoard,
  type CreateBoardParams,
} from "@/commons/libs/supabase/db";

interface CreateModalProps {
  onClose: () => void;
}

const CreateModal: React.FC<CreateModalProps> = ({ onClose }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleSave = async () => {
    // 현재 Board 에 title 없음
    const dateString = startDate
      ? startDate.toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    const params: CreateBoardParams = {
      description,
      date: dateString,
      tags: [], // 태그 입력 UI가 없으므로 빈 배열을 전달합니다.
      image: imageFile ?? undefined,
    };

    try {
      await createBoard(params);
      alert("게시물이 저장되었습니다.");
      onClose();
    } catch (error) {
      console.error("Failed to create board:", error);
      alert("게시물 저장에 실패했습니다.");
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          style={{ display: "none" }}
        />
        <CloseButton
          src="/icons/modal/close-icon.svg"
          alt="close"
          onClick={onClose}
        />
        <TitleInput
          placeholder="제목 입력창"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
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
            <ImageUploadContainer onClick={() => fileInputRef.current?.click()}>
              <ImagePlaceholder
                src={imagePreview || "/icons/modal/image-placeholder.svg"}
              />
              {!imagePreview && (
                <>
                  <AddIcon src="/icons/modal/add-icon.svg" />
                  <ImageUploadText>이미지 추가하기</ImageUploadText>
                </>
              )}
            </ImageUploadContainer>
          </div>
          <DescriptionTextarea
            placeholder="여기에 일기를 작성하세요..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </ContentContainer>

        <ButtonContainer>
          <Button onClick={onClose}>취소</Button>
          <Button onClick={handleSave}>저장</Button>
        </ButtonContainer>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default CreateModal;
