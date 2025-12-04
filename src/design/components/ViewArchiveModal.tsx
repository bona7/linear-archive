import { X } from "lucide-react";

interface NodeTag {
  name: string;
  color: string;
}

interface NodeData {
  id: number;
  tag?: NodeTag;
  title?: string;
  description?: string;
  date?: Date;
}

interface ViewArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void; // 편집 모드로 전환하는 콜백
  currentNodeData?: NodeData;
}

export function ViewArchiveModal({
  isOpen,
  onClose,
  onEdit,
  currentNodeData,
}: ViewArchiveModalProps) {
  if (!isOpen || !currentNodeData) return null;

  // 날짜 포맷팅 함수
  const formatDate = (date: Date | undefined) => {
    if (!date) return "날짜 없음";
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}년 ${month}월 ${day}일`;
  };

  // 시간 포맷팅 함수
  const formatTime = (date: Date | undefined) => {
    if (!date) return "시간 없음";
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
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
            <div className="border border-black bg-white p-3">
              {currentNodeData.tag && (
                <div
                  className="flex items-center gap-2 border border-black bg-white shrink-0 inline-block"
                  style={{ padding: "7px 11px" }}
                >
                  <div
                    className="border border-black"
                    style={{
                      width: "11.5px",
                      height: "11.5px",
                      backgroundColor: currentNodeData.tag.color,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                      fontSize: "12.5px",
                    }}
                  >
                    {currentNodeData.tag.name}
                  </span>
                </div>
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
                  {formatDate(currentNodeData.date)}
                </div>
              </div>

              {/* Image Display - 읽기 전용 */}
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
                  이미지
                </div>
                <div
                  className="w-full h-48 bg-white flex items-center justify-center opacity-60"
                  style={{
                    border: "1px solid rgba(0,0,0,0.3)",
                  }}
                >
                  {/* 이미지가 있다면 여기에 표시 */}
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
                  {formatTime(currentNodeData.date)}
                </div>
              </div>

              {/* Description Display - 읽기 전용 */}
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
                  내용
                </div>
                <div
                  className="bg-white p-3 relative"
                  style={{
                    border: "1px solid rgba(0,0,0,0.3)",
                    height: "342px",
                    opacity: 0.8,
                  }}
                >
                  {currentNodeData.description ? (
                    <div
                      className="w-full h-full overflow-auto"
                      style={{
                        fontFamily:
                          "SF Mono, Menlo, Monaco, Consolas, monospace",
                        fontSize: "12px",
                        lineHeight: "1.5",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {currentNodeData.description}
                    </div>
                  ) : (
                    <div
                      className="text-gray-400"
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
    </div>
  );
}
