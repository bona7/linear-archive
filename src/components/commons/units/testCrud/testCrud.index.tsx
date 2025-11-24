import { useState, useEffect } from "react";
import {
  createBoard,
  getCurrentUserBoards,
  updateBoard,
  deleteBoard,
  BoardWithTags,
} from "../../../../commons/libs/supabase/db";
import { getUser } from "../../../../commons/libs/supabase/auth";
import {
  Container,
  Form,
  Button,
  BoardList,
  BoardItem,
  Error,
} from "./testCrud.style";

export default function TestCrud() {
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [tagName, setTagName] = useState("");
  const [tagColor, setTagColor] = useState("#FF0000");
  const [tags, setTags] = useState<
    Array<{ tag_name: string; tag_color: string }>
  >([]);
  const [image, setImage] = useState<File | null>(null);
  const [boards, setBoards] = useState<BoardWithTags[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [editingBoard, setEditingBoard] = useState<BoardWithTags | null>(null);

  useEffect(() => {
    checkUser();
    loadBoards();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await getUser();
      setUser(currentUser);
    } catch (err) {
      setUser(null);
      alert("로그인이 필요합니다. /test-auth 페이지에서 로그인하세요.");
    }
  };

  const loadBoards = async () => {
    try {
      const data = await getCurrentUserBoards(true);
      setBoards(data);
    } catch (err: any) {
      setError(err.message || "게시글 로드 실패");
    }
  };

  const handleAddTag = () => {
    if (tagName.trim()) {
      setTags([...tags, { tag_name: tagName, tag_color: tagColor }]);
      setTagName("");
      setTagColor("#FF0000");
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (editingBoard) {
        // 수정
        await updateBoard(editingBoard.board_id, {
          description: description || undefined,
          date: date || undefined,
          tags: tags.length > 0 ? tags : undefined,
          image: image || undefined,
        });
        alert("수정 완료!");
      } else {
        // 생성
        await createBoard({
          description: description || undefined,
          date: date || undefined,
          tags: tags,
          image: image || undefined,
        });
        alert("생성 완료!");
      }

      setDescription("");
      setDate("");
      setTags([]);
      setImage(null);
      setEditingBoard(null);
      await loadBoards();
    } catch (err: any) {
      setError(err.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (board: BoardWithTags) => {
    setEditingBoard(board);
    setDescription(board.description || "");
    setDate(board.date || "");
    setTags(
      board.tags.map((tag) => ({
        tag_name: tag.tag_name,
        tag_color: tag.tag_color,
      }))
    );
    setImage(null);
  };

  const handleDelete = async (boardId: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    setLoading(true);
    setError(null);

    try {
      await deleteBoard(boardId);
      alert("삭제 완료!");
      await loadBoards();
    } catch (err: any) {
      setError(err.message || "삭제 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingBoard(null);
    setDescription("");
    setDate("");
    setTags([]);
    setImage(null);
  };

  if (!user) {
    return (
      <Container>
        <Error>로그인이 필요합니다. /test-auth 페이지에서 로그인하세요.</Error>
      </Container>
    );
  }

  return (
    <Container>
      <h1>CRUD 테스트</h1>
      <p>사용자: {user.email}</p>

      <Form onSubmit={handleSubmit}>
        <h2>{editingBoard ? "게시글 수정" : "게시글 생성"}</h2>

        <div>
          <label>Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="설명을 입력하세요"
            rows={3}
          />
        </div>

        <div>
          <label>Date:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div>
          <label>Tags:</label>
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            <input
              type="text"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              placeholder="태그 이름"
              style={{ flex: 1 }}
            />
            <input
              type="color"
              value={tagColor}
              onChange={(e) => setTagColor(e.target.value)}
              style={{ width: "60px" }}
            />
            <Button
              type="button"
              onClick={handleAddTag}
              style={{ width: "auto", padding: "10px 20px" }}
            >
              태그 추가
            </Button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {tags.map((tag, index) => (
              <span
                key={index}
                style={{
                  backgroundColor: tag.tag_color,
                  color: "white",
                  padding: "5px 10px",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                {tag.tag_name}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(index)}
                  style={{
                    background: "rgba(255,255,255,0.3)",
                    border: "none",
                    color: "white",
                    cursor: "pointer",
                    borderRadius: "2px",
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label>Image:</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
          />
          {image && <p>선택된 파일: {image.name}</p>}
        </div>

        {error && <Error>{error}</Error>}

        <div style={{ display: "flex", gap: "10px" }}>
          <Button type="submit" disabled={loading}>
            {loading ? "처리 중..." : editingBoard ? "수정" : "생성"}
          </Button>
          {editingBoard && (
            <Button
              type="button"
              onClick={handleCancelEdit}
              style={{ backgroundColor: "#666" }}
            >
              취소
            </Button>
          )}
        </div>
      </Form>

      <BoardList>
        <h2>게시글 목록 ({boards.length})</h2>
        <Button
          onClick={loadBoards}
          style={{ marginBottom: "20px", backgroundColor: "#2196F3" }}
        >
          새로고침
        </Button>

        {boards.length === 0 ? (
          <p>게시글이 없습니다.</p>
        ) : (
          boards.map((board) => (
            <BoardItem key={board.board_id}>
              <div>
                <h3>Board ID: {board.board_id}</h3>
                <p>Description: {board.description || "없음"}</p>
                <p>Date: {board.date || "없음"}</p>
                <div>
                  <strong>Tags:</strong>
                  {board.tags.length === 0 ? (
                    <span> 없음</span>
                  ) : (
                    board.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        style={{
                          backgroundColor: tag.tag_color,
                          color: "white",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          marginLeft: "5px",
                        }}
                      >
                        {tag.tag_name}
                      </span>
                    ))
                  )}
                </div>
                {board.image_url && (
                  <div>
                    <strong>Image:</strong>
                    <img
                      src={board.image_url}
                      alt="Board"
                      style={{
                        maxWidth: "200px",
                        marginTop: "10px",
                        display: "block",
                      }}
                    />
                  </div>
                )}
              </div>
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <Button
                  onClick={() => handleEdit(board)}
                  style={{ backgroundColor: "#FF9800" }}
                >
                  수정
                </Button>
                <Button
                  onClick={() => handleDelete(board.board_id)}
                  style={{ backgroundColor: "#f44336" }}
                  disabled={loading}
                >
                  삭제
                </Button>
              </div>
            </BoardItem>
          ))
        )}
      </BoardList>
    </Container>
  );
}
