import { useState, useEffect } from "react";
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
import {
  readBoardsWithTags,
  type BoardWithTags,
} from "@/commons/libs/supabase/db";
import type { Post } from "@/commons/types/types";

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

export default function MainPage() {
  const [boards, setBoards] = useState<BoardWithTags[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hoveredEllipse, setHoveredEllipse] = useState<EllipseData | null>(
    null
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFetchModalOpen, setIsFetchModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // boards 데이터를 Post 형태로 변환합니다.
  const posts: Post[] = boards.map((board) => ({
    board_id: board.board_id,
    title: board.date ? `기록 (${board.date})` : "제목 없음",
    description: board.description || "내용 없음",
    tag: board.tags[0]?.tag_name || "미분류",
    tagColor: board.tags[0]?.tag_color || "#cccccc",
  }));

  useEffect(() => {
    const loadBoards = async () => {
      try {
        const data = await readBoardsWithTags();
        setBoards(data);
      } catch (err: any) {
        setError(err.message || "게시글 로드 실패");
      }
    };
    loadBoards();
  }, []);

  console.log("boards:", boards);

  const handleEllipseHover = (ellipse: EllipseData) => {
    // 해당 인덱스의 게시물이 존재할 때만 상태 업데이트
    if (posts[ellipse.postIndex]) {
      setHoveredEllipse(ellipse);
    }
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
      {ellipses.map((ellipse) => {
        const post = posts[ellipse.postIndex];
        // 해당 인덱스에 게시물 데이터가 없으면 Ellipse를 렌더링하지 않음
        if (!post) return null;

        return (
          <Ellipse
            key={ellipse.postIndex}
            left={ellipse.left}
            backgroundColor={post.tagColor}
            onMouseEnter={() => handleEllipseHover(ellipse)}
            onClick={() => openFetchModal(post)}
          />
        );
      })}
      <Frame174
        src="/icons/main/frame-174.svg"
        alt="frame-174"
        onClick={openCreateModal}
      />
      {hoveredEllipse && posts[hoveredEllipse.postIndex] && (
        <div onMouseLeave={handleMouseLeave}>
          <HoverCard
            position={{ left: hoveredEllipse.left }}
            post={posts[hoveredEllipse.postIndex]}
            onClose={handleMouseLeave}
          />
        </div>
      )}
      {isCreateModalOpen && <CreateModal onClose={closeCreateModal} />}
      {isFetchModalOpen && selectedPost && (
        <FetchModal post={selectedPost} onClose={closeFetchModal} />
      )}
      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
    </Container>
  );
}
