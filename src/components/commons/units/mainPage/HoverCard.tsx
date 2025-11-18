import React from "react";
import {
  HoverCardContainer,
  VerticalLine,
  CardFrame,
  CloseIcon,
  TitleWrapper,
  CardTitle,
  CardTagFrame,
  CardTagText,
  CardDescription,
  CardImagePlaceholder,
} from "./HoverCard.style";

interface Post {
  title: string;
  description: string;
  tag: string;
  tagColor: string;
}

interface HoverCardProps {
  position: {
    left: string;
  };
  post: Post;
  onClose: () => void;
}

const HoverCard: React.FC<HoverCardProps> = ({ position, post, onClose }) => {
  return (
    <HoverCardContainer left={position.left}>
      <VerticalLine />
      <CardFrame>
        <CloseIcon src="/icons/main/close.svg" alt="close" onClick={onClose} />
        <TitleWrapper>
          <CardTitle>{post.title}</CardTitle>
          <CardTagFrame style={{ backgroundColor: post.tagColor }}>
            <CardTagText>{post.tag}</CardTagText>
          </CardTagFrame>
        </TitleWrapper>
        <CardDescription>{post.description}</CardDescription>
        <CardImagePlaceholder />
      </CardFrame>
    </HoverCardContainer>
  );
};

export default HoverCard;
