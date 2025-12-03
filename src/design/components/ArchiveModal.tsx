import { X, Plus } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { TagCustomizer } from "./TagCustomizer";

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

interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tag: NodeTag | null, description: string, date: Date | null) => void;
  onDelete: () => void;
  position?: { x: number; y: number } | null;
  recentTags: NodeTag[];
  currentNodeData?: NodeData;
}

export function ArchiveModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  position,
  recentTags,
  currentNodeData,
}: ArchiveModalProps) {
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [selectedMonth, setSelectedMonth] = useState<number>(10); // November (0-indexed)
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedHour, setSelectedHour] = useState<number>(12);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);
  const [selectedTag, setSelectedTag] = useState<NodeTag | null>(
    currentNodeData?.tag || null
  );
  const [description, setDescription] = useState(
    currentNodeData?.description || ""
  );
  const [isTagCustomizerOpen, setIsTagCustomizerOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(!currentNodeData); // Start in view mode if editing existing node
  const tagButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Update state when currentNodeData changes
  useEffect(() => {
    if (isOpen) {
      setSelectedTag(currentNodeData?.tag || null);
      setDescription(currentNodeData?.description || "");
      setIsEditMode(!currentNodeData); // Reset edit mode based on whether it's a new or existing node
      if (currentNodeData?.date) {
        setSelectedYear(currentNodeData.date.getFullYear());
        setSelectedMonth(currentNodeData.date.getMonth());
        setSelectedDay(currentNodeData.date.getDate());
        setSelectedHour(currentNodeData.date.getHours());
        setSelectedMinute(currentNodeData.date.getMinutes());
      } else {
        setSelectedYear(2025);
        setSelectedMonth(10);
        setSelectedDay(null);
        setSelectedHour(12);
        setSelectedMinute(0);
      }
    }
  }, [isOpen, currentNodeData]);

  if (!isOpen) return null;

  const handleSave = () => {
    const date = selectedDay
      ? new Date(
          selectedYear,
          selectedMonth,
          selectedDay,
          selectedHour,
          selectedMinute
        )
      : null;
    onSave(selectedTag, description, date);
  };

  const handleSelectRecentTag = (tag: NodeTag) => {
    setSelectedTag(tag);
  };

  // Calendar data
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  const years = [2024, 2025];
  const daysOfWeek = ["월", "화", "수", "목", "금", "토", "일"];

  // Calculate days in selected month
  const getDaysInMonth = () => {
    return new Date(selectedYear, selectedMonth + 1, 0).getDate();
  };

  // Calculate starting day of week (0 = Sunday, 1 = Monday, etc.)
  const getStartPadding = () => {
    const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
    // Convert to Monday start (0 = Monday)
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  const daysInMonth = Array.from({ length: getDaysInMonth() }, (_, i) => i + 1);
  const startPadding = getStartPadding();

  // Calculate modal position
  const getModalStyle = () => {
    // Always center the modal
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
        ref={modalRef}
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
            {currentNodeData
              ? isEditMode
                ? "EDIT_ARCHIVE"
                : "VIEW_ARCHIVE"
              : "NEW_ARCHIVE"}
          </span>
          <div className="flex items-center gap-2">
            {/* Edit Button - Only show in view mode for existing nodes */}
            {currentNodeData && !isEditMode && (
              <button
                onClick={() => setIsEditMode(true)}
                className="border border-black px-3 py-1 hover:bg-black hover:text-[#F2F0EB] transition-colors"
                style={{
                  fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                  fontSize: "11px",
                }}
              >
                수정
              </button>
            )}
            <button
              onClick={onClose}
              className="border border-black w-6 h-6 flex items-center justify-center hover:bg-black hover:text-[#F2F0EB] transition-colors"
              aria-label="Close"
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div
          className="p-4 overflow-y-auto"
          style={{
            paddingBottom: isEditMode ? "16px" : "16px",
            maxHeight: "calc(90vh - 60px)",
          }}
        >
          {/* Top Row: Tag System - REQUIRED */}
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
            <div
              className={`flex items-center gap-3 ${
                isEditMode ? "border border-black bg-white p-3" : ""
              }`}
            >
              {/* Selected Tag - Fixed Left */}
              {selectedTag && (
                <div
                  className="flex items-center gap-2 border border-black bg-white shrink-0"
                  style={{ padding: "7px 11px" }}
                >
                  <div
                    className="border border-black"
                    style={{
                      width: "11.5px",
                      height: "11.5px",
                      backgroundColor: selectedTag.color,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                      fontSize: "12.5px",
                    }}
                  >
                    {selectedTag.name}
                  </span>
                </div>
              )}

              {/* Scrollable Tag List - Only in edit mode */}
              {isEditMode && (
                <>
                  <div
                    className="flex-1 overflow-x-auto"
                    style={{ scrollbarWidth: "thin" }}
                  >
                    <div className="flex items-center gap-2">
                      {/* Recent Tags */}
                      {recentTags.map((tag, index) => (
                        <button
                          key={index}
                          onClick={() => handleSelectRecentTag(tag)}
                          className="border border-gray-300 px-2.5 py-1.5 flex items-center gap-1.5 bg-white opacity-60 hover:opacity-100 transition-opacity shrink-0"
                        >
                          <div
                            className="border border-black"
                            style={{
                              width: "10px",
                              height: "10px",
                              backgroundColor: tag.color,
                            }}
                          />
                          <span
                            style={{
                              fontFamily:
                                "SF Mono, Menlo, Monaco, Consolas, monospace",
                              fontSize: "11px",
                            }}
                          >
                            {tag.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Add Tag Button - Fixed Right */}
                  <button
                    ref={tagButtonRef}
                    onClick={() => setIsTagCustomizerOpen(!isTagCustomizerOpen)}
                    className="border border-black px-3 py-1.5 bg-white hover:bg-black hover:text-white transition-colors shrink-0"
                  >
                    <span
                      style={{
                        fontFamily:
                          "SF Mono, Menlo, Monaco, Consolas, monospace",
                        fontSize: "12px",
                      }}
                    >
                      +
                    </span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tag Customizer Popover */}
          <TagCustomizer
            isOpen={isTagCustomizerOpen}
            onClose={() => setIsTagCustomizerOpen(false)}
            anchorEl={tagButtonRef.current}
            onSelectTag={(shape, color) =>
              setSelectedTag({ name: shape, color })
            }
          />

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Left Column: Date + Image */}
            <div className="flex flex-col gap-4">
              {/* Date Picker - REQUIRED */}
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
                <div className="border border-black p-2 bg-white">
                  {/* Year and Month Selectors */}
                  <div className="flex gap-1 mb-2">
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      disabled={!isEditMode}
                      className="flex-1 border border-black bg-white px-1 py-1 outline-none"
                      style={{
                        fontFamily:
                          "SF Mono, Menlo, Monaco, Consolas, monospace",
                        fontSize: "11px",
                        opacity: isEditMode ? 1 : 0.6,
                      }}
                    >
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      disabled={!isEditMode}
                      className="flex-1 border border-black bg-white px-1 py-1 outline-none"
                      style={{
                        fontFamily:
                          "SF Mono, Menlo, Monaco, Consolas, monospace",
                        fontSize: "11px",
                        opacity: isEditMode ? 1 : 0.6,
                      }}
                    >
                      {months.map((month, index) => (
                        <option key={month} value={index}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-px">
                    {/* Day Headers */}
                    {daysOfWeek.map((day) => (
                      <div
                        key={day}
                        className="text-center py-0.5 border border-black bg-[#F2F0EB]"
                        style={{
                          fontFamily:
                            "SF Mono, Menlo, Monaco, Consolas, monospace",
                          fontSize: "9px",
                        }}
                      >
                        {day}
                      </div>
                    ))}

                    {/* Empty cells for padding */}
                    {Array.from({ length: startPadding }).map((_, i) => (
                      <div key={`empty-${i}`} />
                    ))}

                    {/* Day Numbers */}
                    {daysInMonth.map((day) => (
                      <button
                        key={day}
                        onClick={() => isEditMode && setSelectedDay(day)}
                        disabled={!isEditMode}
                        className={`text-center py-1 border border-black transition-colors ${
                          selectedDay === day
                            ? "text-[#F2F0EB]"
                            : "bg-white hover:bg-[#F2F0EB]"
                        }`}
                        style={{
                          fontFamily:
                            "SF Mono, Menlo, Monaco, Consolas, monospace",
                          fontSize: "10px",
                          backgroundColor:
                            selectedDay === day ? "#3A3834" : undefined,
                          cursor: isEditMode ? "pointer" : "default",
                        }}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Image Upload - OPTIONAL */}
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
                <button
                  disabled={!isEditMode}
                  className="w-full h-48 bg-white hover:bg-[#F2F0EB] transition-colors flex items-center justify-center"
                  style={{
                    border: "1px solid rgba(0,0,0,0.3)",
                    cursor: isEditMode ? "pointer" : "default",
                    opacity: isEditMode ? 1 : 0.6,
                  }}
                >
                  <Plus size={40} strokeWidth={1} style={{ opacity: 0.2 }} />
                </button>
              </div>
            </div>

            {/* Right Column: Time + Description */}
            <div className="flex flex-col gap-4">
              {/* Time Picker - OPTIONAL */}
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
                  className="bg-white p-3 flex items-center justify-center gap-2"
                  style={{
                    border: "1px solid rgba(0,0,0,0.3)",
                    opacity: isEditMode ? 1 : 0.6,
                  }}
                >
                  <select
                    value={selectedHour}
                    onChange={(e) => setSelectedHour(Number(e.target.value))}
                    disabled={!isEditMode}
                    className="bg-white px-2 py-1 outline-none"
                    style={{
                      fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                      fontSize: "12px",
                      border: "1px solid rgba(0,0,0,0.3)",
                    }}
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {String(i).padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                  <span
                    style={{
                      fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                      fontSize: "14px",
                      opacity: 0.3,
                    }}
                  >
                    :
                  </span>
                  <select
                    value={selectedMinute}
                    onChange={(e) => setSelectedMinute(Number(e.target.value))}
                    disabled={!isEditMode}
                    className="bg-white px-2 py-1 outline-none"
                    style={{
                      fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                      fontSize: "12px",
                      border: "1px solid rgba(0,0,0,0.3)",
                    }}
                  >
                    {Array.from({ length: 6 }, (_, i) => {
                      const minute = i * 10;
                      return (
                        <option key={minute} value={minute}>
                          {String(minute).padStart(2, "0")}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Description - OPTIONAL */}
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
                  }}
                >
                  {/* Skeleton Hint */}
                  {!description && (
                    <div className="absolute inset-0 p-3 space-y-2 pointer-events-none select-none opacity-20">
                      <div
                        style={{
                          fontFamily:
                            'Georgia, "Times New Roman", Times, serif',
                          fontSize: "16px",
                          fontWeight: "bold",
                        }}
                      >
                        제목을 입력하세요
                      </div>
                      <div
                        style={{
                          fontFamily:
                            "SF Mono, Menlo, Monaco, Consolas, monospace",
                          fontSize: "12px",
                          lineHeight: "1.5",
                        }}
                      >
                        엔터를 누르면 본문을 작성할 수 있습니다...
                      </div>
                    </div>
                  )}
                  <textarea
                    placeholder=""
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={!isEditMode}
                    className="w-full h-full bg-transparent outline-none resize-none relative z-10"
                    style={{
                      fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                      fontSize: "12px",
                      lineHeight: "1.5",
                      opacity: isEditMode ? 1 : 0.8,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: Save Button (and Delete for existing nodes) - Only in edit mode */}
          {isEditMode && (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className={`text-[#F2F0EB] py-2.5 border border-black transition-colors ${
                  currentNodeData ? "flex-1" : "w-full"
                }`}
                style={{ backgroundColor: "#8B857D" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#3A3834")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "#8B857D")
                }
              >
                <span
                  style={{
                    fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                    fontSize: "13px",
                    letterSpacing: "0.05em",
                  }}
                >
                  저장
                </span>
              </button>

              {/* Delete Button - Only show when editing existing node */}
              {currentNodeData && (
                <button
                  onClick={onDelete}
                  className="px-6 py-2.5 border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-colors bg-white"
                >
                  <span
                    style={{
                      fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                      fontSize: "13px",
                      letterSpacing: "0.05em",
                    }}
                  >
                    삭제
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
