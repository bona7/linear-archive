/**
 * 공용으로 사용하는 타입 정의
 */

/**
 * 게시물(Board)의 상세 정보를 담는 Post 타입
 * - mainPage.index.tsx
 * - modals/fetchModal.tsx
 */
export interface Post {
  board_id: string;
  title: string;
  description: string;
  tag: string;
  tagColor: string;
}

/**
 * FetchModal 컴포넌트의 props 타입
 * - modals/fetchModal.tsx
 */
export interface FetchModalProps {
  onClose: () => void;
  post: Post;
}

export interface NodeTag {
  name: string;
  color: string;
}

export interface NodeData {
  id: string;
  tag?: NodeTag;
  title?: string;
  description?: string;
  date?: Date;
}
