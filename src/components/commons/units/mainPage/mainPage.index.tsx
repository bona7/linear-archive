import { useState } from "react";
import {
  Container,
  MainText,
  DateText,
  ArrowImage,
  Ellipse,
  Frame174,
} from "./mainPage.style";
import HoverCard from "./HoverCard";
import CreateModal from "../../modals/createModal";
import FetchModal from "../../modals/fetchModal";

interface EllipseData {
  left: string;
  postIndex: number;
}

const ellipses: EllipseData[] = [
  { left: "146.4px", postIndex: 0 },
  { left: "180px", postIndex: 1 },
  { left: "1000px", postIndex: 2 },
  { left: "470.4px", postIndex: 3 },
  { left: "256.8px", postIndex: 4 },
];

interface Post {
  title: string;
  description: string;
  tag: string;
  tagColor: string;
}

const dummyPosts: Post[] = [
  {
    title: "첫 번째 게시물",
    description: "이것은 첫 번째 더미 게시물의 설명입니다.",
    tag: "React",
    tagColor: "#61DAFB",
  },
  {
    title: "두 번째 게시물",
    description: "두 번째 게시물은 흥미로운 내용을 담고 있습니다.",
    tag: "TypeScript",
    tagColor: "#3178C6",
  },
  {
    title: "세 번째 게시물",
    description: "세 번째 게시물은 짧고 간결합니다.",
    tag: "UI/UX",
    tagColor: "#FD9C00",
  },
  {
    title: "네 번째 게시물",
    description:
      "네 번째 게시물은 긴 설명이 특징입니다. 이 설명은 충분히 길어서 여러 줄에 걸쳐 표시될 수 있습니다. 사용자가 내용을 충분히 이해할 수 있도록 상세하게 작성되었습니다.",
    tag: "tag2",
    tagColor: "#9E0606",
  },
  {
    title: "다섯 번째 게시물",
    description: "마지막 게시물입니다. 모든 것이 잘 작동하기를 바랍니다.",
    tag: "UI/UX",
    tagColor: "#FD9C00",
  },
];

export default function MainPage() {
  const [hoveredEllipse, setHoveredEllipse] = useState<EllipseData | null>(
    null
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFetchModalOpen, setIsFetchModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const handleEllipseHover = (ellipse: EllipseData) => {
    setHoveredEllipse(ellipse);
  };

  const handleMouseLeave = () => {
    setHoveredEllipse(null);
  };

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const openFetchModal = (post: Post) => {
    setSelectedPost(post);
    setIsFetchModalOpen(true);
  };

  const closeFetchModal = () => {
    setIsFetchModalOpen(false);
    setSelectedPost(null);
  };

  return (
    <Container>
      <MainText>Minji’s Line</MainText>
      <DateText left="17.6px" top="419.2px">
        2022.10.
      </DateText>
      <DateText left="1062.4px" top="419.2px">
        2025.11
      </DateText>
      <ArrowImage src="/icons/main/arrow-1.svg" alt="arrow" />
      {ellipses.map((ellipse, index) => (
        <Ellipse
          key={index}
          left={ellipse.left}
          backgroundColor={dummyPosts[ellipse.postIndex].tagColor}
          onMouseEnter={() => handleEllipseHover(ellipse)}
          onClick={() => openFetchModal(dummyPosts[ellipse.postIndex])}
        />
      ))}
      <Frame174
        src="/icons/main/frame-174.svg"
        alt="frame-174"
        onClick={openCreateModal}
      />
      {hoveredEllipse && (
        <div onMouseLeave={handleMouseLeave}>
          <HoverCard
            position={{ left: hoveredEllipse.left }}
            post={dummyPosts[hoveredEllipse.postIndex]}
            onClose={handleMouseLeave}
          />
        </div>
      )}
      {isCreateModalOpen && <CreateModal onClose={closeCreateModal} />}
      {isFetchModalOpen && selectedPost && (
        <FetchModal post={selectedPost} onClose={closeFetchModal} />
      )}
    </Container>
  );
}
