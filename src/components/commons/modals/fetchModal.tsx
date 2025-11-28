import React, { useState, useEffect } from "react";
import {
  ModalOverlay,
  ModalContainer,
  CloseButton,
  TitleInput,
  ContentContainer,
  ImageUploadContainer,
  ImagePlaceholder,
  DescriptionTextarea,
  ButtonContainer,
  Button,
  TagFrame,
  TagText,
} from "./createModal.style";
import { readBoardById } from "@/commons/libs/supabase/db";
import type { Post, FetchModalProps } from "@/commons/types/types";

const FetchModal: React.FC<FetchModalProps> = ({ onClose, post }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBoardData = async () => {
      if (!post.board_id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // `readBoardById` - 이미지가 없는 경우에도 에러 없이 image_url 필드를 null로 반환
        const boardData = await readBoardById(post.board_id, true);

        console.log("[DEBUG] Fetched board data:", boardData);

        if (boardData && boardData.image_url) {
          console.log("[DEBUG] Image URL found:", boardData.image_url);
          setImageUrl(boardData.image_url);
        } else {
          console.log("[DEBUG] No image URL found for this board.");
        }
      } catch (error) {
        console.error("Failed to fetch board image:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoardData();
  }, [post.board_id]);

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <CloseButton
          src="/icons/modal/close-icon.svg"
          alt="close"
          onClick={onClose}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "20px",
          }}
        >
          <TitleInput as="p">{post.title}</TitleInput>
          <TagFrame style={{ backgroundColor: post.tagColor }}>
            <TagText>{post.tag}</TagText>
          </TagFrame>
        </div>
        <ContentContainer>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <ImageUploadContainer>
              {isLoading ? (
                <p>이미지 로딩중...</p>
              ) : imageUrl ? (
                <ImagePlaceholder src={imageUrl} alt={post.title} />
              ) : (
                <ImagePlaceholder src="/icons/modal/image-placeholder.svg" />
              )}
            </ImageUploadContainer>
          </div>
          <DescriptionTextarea as="p">{post.description}</DescriptionTextarea>
        </ContentContainer>
        <ButtonContainer>
          <Button onClick={onClose}>닫기</Button>
        </ButtonContainer>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default FetchModal;
