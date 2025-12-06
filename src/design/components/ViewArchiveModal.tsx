import { X } from "lucide-react";
import { useState, useEffect } from "react";
import { readBoardById, deleteBoard } from "../../commons/libs/supabase/db";

interface NodeTag {
  name: string;
  color: string;
}

interface NodeData {
  id: string;
  tag?: NodeTag;
  title?: string;
  description?: string;
  date?: Date;
}

interface ViewArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void; // 편집 모드로 전환하는 콜백
  onDelete?: () => void; // 삭제 후 부모 컴포넌트에서 데이터를 다시 불러오기 위한 콜백
  currentNodeData?: NodeData;
}

export function ViewArchiveModal({
  isOpen,
  onClose,
  onEdit,
  onDelete,
  currentNodeData,
}: ViewArchiveModalProps) {
  const [boardData, setBoardData] = useState<{
    tags: NodeTag[];
    description: string | null;
    date: string | null;
    time: string | null;
    imageUrl: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 모달이 열릴 때 readBoardById로 데이터 불러오기
  useEffect(() => {
    const loadBoardData = async () => {
      if (!isOpen || !currentNodeData?.id) {
        setBoardData(null);
        return;
      }

      setIsLoading(true);
      try {
        const data = await readBoardById(currentNodeData.id);

        if (data) {
          // 콘솔에 데이터 출력
          console.log("=== 노드 클릭 데이터 ===");
          console.log("Node ID:", currentNodeData.id);
          console.log("Board Data:", {
            date: data.date,
            time: data.time,
            description: data.description,
            tags: data.tags,
            image_url: data.image_url,
          });
          console.log("Full Data:", data);
          console.log("======================");

          // 태그 배열로 변환
          const tags: NodeTag[] = data.tags.map((tag) => ({
            name: tag.tag_name,
            color: tag.tag_color,
          }));

          setBoardData({
            tags: tags,
            description: data.description,
            date: data.date,
            time: data.time,
            imageUrl: data.image_url || null,
          });
        } else {
          console.log("데이터를 찾을 수 없습니다:", currentNodeData.id);
        }
      } catch (error) {
        console.error("Failed to load board data:", error);
        setBoardData(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadBoardData();
  }, [isOpen, currentNodeData?.id]);

  if (!isOpen || !currentNodeData) return null;

  // 날짜 포맷팅 함수
  const formatDate = (date: Date | null) => {
    if (!date) return "날짜 없음";
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}년 ${month}월 ${day}일`;
  };

  // 시간 포맷팅 함수
  const formatTime = (date: Date | null) => {
    if (!date) return "시간 없음";
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // date와 time을 합쳐서 Date 객체 생성
  const displayDate = boardData?.date
    ? (() => {
        const dateParts = boardData.date.split("-");
        if (dateParts.length === 3) {
          // time이 있으면 함께 사용, 없으면 시간은 0으로 설정
          if (boardData.time) {
            const timeParts = boardData.time.split(":");
            if (timeParts.length >= 2) {
              return new Date(
                Number(dateParts[0]),
                Number(dateParts[1]) - 1,
                Number(dateParts[2]),
                Number(timeParts[0]),
                Number(timeParts[1])
              );
            }
          }
          // time이 없으면 날짜만 사용 (시간은 0:00)
          return new Date(
            Number(dateParts[0]),
            Number(dateParts[1]) - 1,
            Number(dateParts[2]),
            0,
            0
          );
        }
        return null;
      })()
    : null;

  const handleDelete = async () => {
    if (!currentNodeData?.id) return;

    setIsDeleting(true);
    try {
      await deleteBoard(currentNodeData.id);
      setShowDeleteConfirm(false);
      onClose(); // 모달 닫기
      // 부모 컴포넌트에서 데이터를 다시 불러오기
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error("Failed to delete board:", error);
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getModalStyle = () => {
    return {
      position: "fixed" as const,
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };
  };

  return (
    <div
      className="fixed inset-0 z-[120]"
      style={{
        backdropFilter: "blur(8px)",
        backgroundColor: "rgba(0, 0, 0, 0.15)",
      }}
    >
      <div
        className="bg-[#F2F0EB] border border-black w-full max-w-xl overflow-visible"
        style={{
          ...getModalStyle(),
          boxShadow: "2px 2px 0 rgba(0, 0, 0, 0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-[#F2F0EB] px-4 py-3 flex items-center justify-between border-b border-black">
          <span
            style={{
              fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
              fontSize: "11px",
              letterSpacing: "0.05em",
              opacity: 0.5,
            }}
          >
            VIEW_ARCHIVE
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="border border-black px-3 py-1 hover:bg-black hover:text-[#F2F0EB] transition-colors"
              style={{
                fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                fontSize: "11px",
              }}
            >
              수정
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="border border-red-600 px-3 py-1 hover:bg-red-600 hover:text-white transition-colors text-red-600"
              style={{
                fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                fontSize: "11px",
              }}
            >
              삭제
            </button>
            <button
              onClick={onClose}
              className="border border-black w-6 h-6 flex items-center justify-center hover:bg-black hover:text-[#F2F0EB] transition-colors"
              aria-label="Close"
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Content Area - 읽기 전용 */}
        <div
          className="p-4 overflow-y-auto"
          style={{
            paddingBottom: "16px",
            maxHeight: "calc(90vh - 60px)",
          }}
        >
          {/* 로딩 상태 */}
          {isLoading && (
            <div className="mb-4 p-3 text-center">
              <span
                style={{
                  fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                  fontSize: "12px",
                  opacity: 0.5,
                }}
              >
                데이터 불러오는 중...
              </span>
            </div>
          )}

          {/* Tag System - 읽기 전용 */}
          <div className="mb-4">
            <div
              className="flex items-center gap-1.5 mb-2"
              style={{
                fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                fontSize: "13px",
              }}
            >
              <span style={{ color: "#D32F2F" }}>*</span>
              <span>태그 타입</span>
            </div>
            <div className="border border-black bg-white p-3 flex flex-wrap gap-2">
              {boardData?.tags && boardData.tags.length > 0 ? (
                boardData.tags.map((tag, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 border border-black bg-white shrink-0"
                    style={{ padding: "7px 11px" }}
                  >
                    <div
                      className="border border-black"
                      style={{
                        width: "11.5px",
                        height: "11.5px",
                        backgroundColor: tag.color,
                      }}
                    />
                    <span
                      style={{
                        fontFamily:
                          "SF Mono, Menlo, Monaco, Consolas, monospace",
                        fontSize: "12.5px",
                      }}
                    >
                      {tag.name}
                    </span>
                  </div>
                ))
              ) : (
                <span
                  style={{
                    fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                    fontSize: "11px",
                    opacity: 0.5,
                  }}
                >
                  태그 없음
                </span>
              )}
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Left Column: Date + Image */}
            <div className="flex flex-col gap-4">
              {/* Date Display - 단순 텍스트 */}
              <div>
                <div
                  className="flex items-center gap-1.5 mb-2"
                  style={{
                    fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                    fontSize: "13px",
                  }}
                >
                  <span style={{ color: "#D32F2F" }}>*</span>
                  <span>날짜 선택</span>
                </div>
                <div
                  className="border border-black bg-white p-3 opacity-60"
                  style={{
                    fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                    fontSize: "12px",
                  }}
                >
                  {formatDate(displayDate)}
                </div>
              </div>

              {/* Image Display - 읽기 전용 */}
              <div className="flex-1">
                <div
                  style={{
                    fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                    fontSize: "11px",
                    marginBottom: "8px",
                    opacity: 0.4,
                    color: "#666",
                  }}
                >
                  이미지
                </div>
                <div
                  className="w-full bg-white flex items-center justify-center relative"
                  style={{
                    border: "1px solid rgba(0,0,0,0.3)",
                    height: "342px", // 내용 div와 동일한 높이
                  }}
                >
                  {boardData?.imageUrl ? (
                    <img
                      src={boardData.imageUrl}
                      alt="Archive"
                      className="w-full h-auto"
                      style={{
                        maxHeight: "342px", // description div의 높이와 동일
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        fontFamily:
                          "SF Mono, Menlo, Monaco, Consolas, monospace",
                        fontSize: "11px",
                        opacity: 0.3,
                      }}
                    >
                      이미지 없음
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Time + Description */}
            <div className="flex flex-col gap-4">
              {/* Time Display - 단순 텍스트 */}
              <div>
                <div
                  style={{
                    fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                    fontSize: "11px",
                    marginBottom: "8px",
                    opacity: 0.4,
                    color: "#666",
                  }}
                >
                  시간
                </div>
                <div
                  className="bg-white p-3 flex items-center justify-center opacity-60"
                  style={{
                    border: "1px solid rgba(0,0,0,0.3)",
                    fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                    fontSize: "12px",
                  }}
                >
                  {formatTime(displayDate)}
                </div>
              </div>

              {/* Description Display - 읽기 전용 */}
              <div className="flex-1 flex flex-col">
                <div
                  style={{
                    fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                    fontSize: "11px",
                    marginBottom: "8px",
                    opacity: 0.4,
                    color: "#666",
                  }}
                >
                  내용
                </div>
                <div
                  className="bg-white relative flex-1"
                  style={{
                    border: "1px solid rgba(0,0,0,0.3)",
                    height: "342px",
                    opacity: 0.8,
                  }}
                >
                  {boardData?.description ? (
                    <div
                      className="w-full h-full overflow-auto p-3"
                      style={{
                        fontFamily:
                          "SF Mono, Menlo, Monaco, Consolas, monospace",
                        fontSize: "12px",
                        lineHeight: "1.5",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {boardData.description}
                    </div>
                  ) : (
                    <div
                      className="text-gray-400 p-3"
                      style={{
                        fontFamily:
                          "SF Mono, Menlo, Monaco, Consolas, monospace",
                        fontSize: "12px",
                      }}
                    >
                      내용이 없습니다
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center"
          style={{
            backdropFilter: "blur(8px)",
            backgroundColor: "rgba(0, 0, 0, 0.3)",
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-[#F2F0EB] border border-black w-full max-w-md p-6"
            style={{
              boxShadow: "2px 2px 0 rgba(0, 0, 0, 0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4">
              <span
                style={{
                  fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                  fontSize: "14px",
                }}
              >
                이 덕질 기록을 삭제하시겠습니까?
              </span>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="border border-black px-4 py-2 hover:bg-black hover:text-[#F2F0EB] transition-colors bg-white"
                style={{
                  fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                  fontSize: "12px",
                }}
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="border border-red-600 px-4 py-2 hover:bg-red-600 hover:text-white transition-colors text-red-600 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                  fontSize: "12px",
                }}
              >
                {isDeleting ? "삭제 중..." : "확인"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
