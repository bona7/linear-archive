import React from "react";
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

interface Post {
  title: string;
  description: string;
  tag: string;
  tagColor: string;
}

interface FetchModalProps {
  onClose: () => void;
  post: Post;
}

const FetchModal: React.FC<FetchModalProps> = ({ onClose, post }) => {
  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <CloseButton
          src="/icons/modal/close-icon.svg"
          alt="close"
          onClick={onClose}
        />
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <TitleInput as="p">{post.title}</TitleInput>
          <TagFrame style={{ backgroundColor: post.tagColor }}>
            <TagText>{post.tag}</TagText>
          </TagFrame>
        </div>
        <ContentContainer>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <ImageUploadContainer>
              <ImagePlaceholder src="/icons/modal/image-placeholder.svg" />
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
