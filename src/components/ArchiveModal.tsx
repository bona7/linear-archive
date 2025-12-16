import { X, Plus } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { TagCreator } from "./TagCreator";
import {
  getCurrentUserTags,
  Tag,
  createBoard,
  updateBoard,
  readBoardById,
} from "../commons/libs/supabase/db";
import { NodeData, NodeTag } from "@/commons/types/types";

interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (date: Date | null) => void;
  onDelete: () => void;
  position?: { x: number; y: number } | null;
  currentNodeData?: NodeData;
}

export function ArchiveModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  position,
  currentNodeData,
}: ArchiveModalProps) {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedHour, setSelectedHour] = useState<number>(0);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);
  // selectedTag를 selectedTags 배열로 변경
  const [selectedTags, setSelectedTags] = useState<NodeTag[]>([]);
  const [description, setDescription] = useState("");
  const [isTagCustomizerOpen, setIsTagCustomizerOpen] = useState(false);
  const [recentTags, setRecentTags] = useState<NodeTag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tagButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

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

  // 연도 배열: 1950년부터 현재 연도까지 (최신 연도부터 표시)
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 1950 + 1 },
    (_, i) => 1950 + i
  ).reverse();

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

  // 태그 불러오기
  useEffect(() => {
    const loadTags = async () => {
      if (!isOpen) return;

      setIsLoadingTags(true);
      try {
        const tags = await getCurrentUserTags();
        // Tag 타입을 NodeTag 타입으로 변환
        const nodeTags: NodeTag[] = tags.map((tag) => ({
          name: tag.tag_name,
          color: tag.tag_color,
        }));
        setRecentTags(nodeTags);
      } catch (error) {
        console.error("Failed to load tags:", error);
        setRecentTags([]);
      } finally {
        setIsLoadingTags(false);
      }
    };

    loadTags();
  }, [isOpen]);

  // 수정 모드일 때 Supabase에서 데이터 불러오기
  useEffect(() => {
    const loadBoardData = async () => {
      if (!isOpen) return;

      // 수정 모드가 아니면 초기값 오늘로 설정
      if (!currentNodeData?.id) {
        const today = new Date();
        setSelectedYear(today.getFullYear());
        setSelectedMonth(today.getMonth());
        setSelectedDay(today.getDate());
        setSelectedTags([]);
        setDescription("");
        setErrorMessage(null);
        setSelectedHour(0);
        setSelectedMinute(0);
        setSelectedImage(null);
        setSelectedImageFile(null);
        return;
      }

      // 수정 모드: Supabase에서 데이터 불러오기
      setIsLoadingData(true);
      try {
        const boardData = await readBoardById(currentNodeData.id);

        if (boardData) {
          // 태그 설정 (배열로 변환)
          const tags: NodeTag[] = boardData.tags.map((tag) => ({
            name: tag.tag_name,
            color: tag.tag_color,
          }));
          setSelectedTags(tags);

          // 설명 설정
          setDescription(boardData.description || "");

          // 날짜 설정
          if (boardData.date) {
            const dateParts = boardData.date.split("-");
            if (dateParts.length === 3) {
              setSelectedYear(Number(dateParts[0]));
              setSelectedMonth(Number(dateParts[1]) - 1); // month는 0-indexed
              setSelectedDay(Number(dateParts[2]));
            }
          } else {
            setSelectedYear(2025);
            setSelectedMonth(10);
            setSelectedDay(null);
          }

          // 시간 설정
          if (boardData.time) {
            const timeParts = boardData.time.split(":");
            if (timeParts.length >= 2) {
              setSelectedHour(Number(timeParts[0]));
              setSelectedMinute(Number(timeParts[1]));
            }
          } else {
            setSelectedHour(0);
            setSelectedMinute(0);
          }

          // 이미지 설정
          if (boardData.image_url) {
            setSelectedImage(boardData.image_url);
            // 이미지 파일은 불러올 수 없으므로 null로 설정
            // 사용자가 새 이미지를 선택하면 selectedImageFile이 설정됨
            setSelectedImageFile(null);
          } else {
            setSelectedImage(null);
            setSelectedImageFile(null);
          }

          setErrorMessage(null);
        }
      } catch (error) {
        console.error("Failed to load board data:", error);
        setErrorMessage("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoadingData(false);
      }
    };

    loadBoardData();
  }, [isOpen, currentNodeData?.id]);

  // 선택된 날짜가 유효한지 확인하고 조정
  useEffect(() => {
    if (selectedDay !== null) {
      const daysInSelectedMonth = getDaysInMonth();
      // 선택된 일이 해당 월의 일수보다 크면 조정
      if (selectedDay > daysInSelectedMonth) {
        setSelectedDay(daysInSelectedMonth);
      }
    }
  }, [selectedYear, selectedMonth]);

  if (!isOpen) return null;

  const handleSave = async () => {
    // 필수 입력 검증
    if (selectedTags.length === 0) {
      setErrorMessage("태그를 선택해주세요.");
      return;
    }

    if (selectedDay === null) {
      setErrorMessage("날짜를 선택해주세요.");
      return;
    }

    // 검증 통과 시 에러 메시지 초기화
    setErrorMessage(null);
    setIsSaving(true);

    try {
      // date는 YYYY-MM-DD 형식으로 변환
      const dateString = `${selectedYear}-${String(selectedMonth + 1).padStart(
        2,
        "0"
      )}-${String(selectedDay).padStart(2, "0")}`;

      // time은 HH:mm:ss 형식으로 변환
      const timeString = `${String(selectedHour).padStart(2, "0")}:${String(
        selectedMinute
      ).padStart(2, "0")}:00`;

      // 디버깅용: 프론트에서 어떤 시간 문자열을 만드는지 확인
      console.log("[ArchiveModal] Debug time payload", {
        selectedHour,
        selectedMinute,
        timeString,
      });

      // 태그 배열을 createBoard 형식으로 변환
      const tags = selectedTags.map((tag) => ({
        tag_name: tag.name,
        tag_color: tag.color,
      }));

      if (currentNodeData) {
        // 기존 아카이브 수정
        const result = await updateBoard(currentNodeData.id, {
          description: description || undefined,
          date: dateString,
          time: timeString,
          tags: tags,
          image: selectedImageFile || undefined,
        });

        console.log("아카이브 수정 완료:", {
          id: currentNodeData.id,
          description: description || undefined,
          date: dateString,
          time: timeString,
          tags: tags,
          image: selectedImageFile ? "이미지 포함" : "이미지 없음",
          result: result,
        });
      } else {
        // 새 아카이브 생성
        const result = await createBoard({
          description: description || undefined,
          date: dateString,
          time: timeString,
          tags: tags,
          image: selectedImageFile || undefined,
        });

        console.log("아카이브 생성 완료:", {
          description: description || undefined,
          date: dateString,
          time: timeString,
          tags: tags,
          image: selectedImageFile ? "이미지 포함" : "이미지 없음",
          result: result,
        });
      }

      // 성공 시 부모 컴포넌트의 onSave 호출 (기존 동작 유지)
      // date와 time을 합쳐서 Date 객체 생성
      const date = new Date(
        selectedYear,
        selectedMonth,
        selectedDay,
        selectedHour,
        selectedMinute
      );
      onSave(date);

      // 모달 닫기
      onClose();
    } catch (error: any) {
      console.error("Failed to save archive:", error);
      setErrorMessage(
        error.message || "저장 중 오류가 발생했습니다. 다시 시도해주세요."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectTag = (tag: NodeTag) => {
    // 태그 토글: 이미 선택되어 있으면 제거, 없으면 추가
    setSelectedTags((prev) => {
      const isSelected = prev.some(
        (t) => t.name === tag.name && t.color === tag.color
      );

      if (isSelected) {
        // 제거
        return prev.filter(
          (t) => !(t.name === tag.name && t.color === tag.color)
        );
      } else {
        // 추가
        return [...prev, tag];
      }
    });
  };

  // 태그가 선택되어 있는지 확인하는 헬퍼 함수
  const isTagSelected = (tag: NodeTag) => {
    return selectedTags.some(
      (t) => t.name === tag.name && t.color === tag.color
    );
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedImageFile(file);
      // FileReader를 사용하여 이미지 미리보기 URL 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setSelectedImage(null);
    setSelectedImageFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
              // [제목 규칙] Space Grotesk
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "11px",
              letterSpacing: "0.05em",
              opacity: 0.5,
            }}
          >
            {currentNodeData ? "EDIT_ARCHIVE" : "NEW_ARCHIVE"}
          </span>
          <div className="flex items-center gap-2">
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
            paddingBottom: "16px",
            maxHeight: "calc(90vh - 60px)",
          }}
        >
          {/* 로딩 상태일 때는 로딩 메시지만 표시 */}
          {isLoadingData ? (
            <div
              className="flex items-center justify-center"
              style={{ minHeight: "400px" }}
            >
              <span
                style={{
                  // [UI 규칙] IBM Plex Mono + Pretendard
                  fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                  fontSize: "12px",
                  opacity: 0.5,
                }}
              >
                데이터 불러오는 중...
              </span>
            </div>
          ) : (
            <>
              {/* Top Row: Tag System - REQUIRED */}
              <div className="mb-4">
                <div
                  className="flex items-center gap-1.5 mb-2"
                  style={{
                    // [UI 규칙] IBM Plex Mono + Pretendard
                    fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                    fontSize: "13px",
                  }}
                >
                  <span style={{ color: "#D32F2F" }}>*</span>
                  <span>태그 타입</span>
                </div>
                <div className="flex items-center gap-3 border border-black bg-white p-3">
                  {/* 통합된 스크롤 영역 - 선택된 태그 + 불러온 태그 */}
                  <div
                    className="flex-1 overflow-x-auto flex items-center gap-2"
                    style={{ scrollbarWidth: "thin" }}
                  >
                    {/* 선택된 태그들 */}
                    {selectedTags.map((tag, index) => (
                      <button
                        key={`selected-${tag.name}-${tag.color}-${index}`}
                        onClick={() => handleSelectTag(tag)}
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
                            // [UI 규칙] IBM Plex Mono + Pretendard
                            fontFamily:
                              "'IBM Plex Mono', 'Pretendard', monospace",
                            fontSize: "12.5px",
                          }}
                        >
                          {tag.name}
                        </span>
                      </button>
                    ))}

                    {/* 불러온 태그들 - 선택된 태그 제외 */}
                    {isLoadingTags ? (
                      <span
                        style={{
                          // [UI 규칙] IBM Plex Mono + Pretendard
                          fontFamily:
                            "'IBM Plex Mono', 'Pretendard', monospace",
                          fontSize: "11px",
                          opacity: 0.5,
                        }}
                      >
                        태그 불러오는 중...
                      </span>
                    ) : (
                      (() => {
                        // 선택된 태그를 제외한 태그 목록
                        const filteredTags = recentTags.filter(
                          (tag) => !isTagSelected(tag)
                        );

                        return filteredTags.length === 0
                          ? selectedTags.length === 0 && (
                              <span
                                style={{
                                  // [UI 규칙] IBM Plex Mono + Pretendard
                                  fontFamily:
                                    "'IBM Plex Mono', 'Pretendard', monospace",
                                  fontSize: "11px",
                                  opacity: 0.5,
                                }}
                              >
                                태그가 없습니다
                              </span>
                            )
                          : filteredTags.map((tag, index) => (
                              <button
                                key={index}
                                onClick={() => handleSelectTag(tag)}
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
                                    // [UI 규칙] IBM Plex Mono + Pretendard
                                    fontFamily:
                                      "'IBM Plex Mono', 'Pretendard', monospace",
                                    fontSize: "11px",
                                  }}
                                >
                                  {tag.name}
                                </span>
                              </button>
                            ));
                      })()
                    )}
                  </div>

                  {/* Add Tag Button - Fixed Right */}
                  <button
                    ref={tagButtonRef}
                    onClick={() => setIsTagCustomizerOpen(!isTagCustomizerOpen)}
                    className="border border-black w-8 h-8 bg-white hover:bg-black hover:text-white transition-colors shrink-0 flex items-center justify-center"
                  >
                    <span
                      style={{
                        // [UI 규칙] IBM Plex Mono + Pretendard
                        fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                        fontSize: "12px",
                        lineHeight: "1",
                      }}
                    >
                      +
                    </span>
                  </button>
                </div>
              </div>

              {/* Tag Creator Popover */}
              <TagCreator
                isOpen={isTagCustomizerOpen}
                onClose={() => setIsTagCustomizerOpen(false)}
                anchorEl={tagButtonRef.current}
                onCreateTag={(name, color) => {
                  const newTag: NodeTag = { name, color };

                  // 새 태그를 선택된 태그에 추가
                  setSelectedTags((prev) => {
                    const exists = prev.some(
                      (tag) => tag.name === name && tag.color === color
                    );
                    if (exists) {
                      return prev;
                    }
                    return [...prev, newTag];
                  });

                  // recentTags 목록에 추가
                  setRecentTags((prev) => {
                    const exists = prev.some(
                      (tag) => tag.name === name && tag.color === color
                    );
                    if (exists) {
                      return prev;
                    }
                    return [newTag, ...prev];
                  });
                }}
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
                        // [UI 규칙] IBM Plex Mono + Pretendard
                        fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
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
                          onChange={(e) => {
                            const newYear = Number(e.target.value);
                            setSelectedYear(newYear);
                            // 연도 변경 시 선택된 일이 유효한지 확인
                            const daysInNewMonth = new Date(
                              newYear,
                              selectedMonth + 1,
                              0
                            ).getDate();
                            if (
                              selectedDay !== null &&
                              selectedDay > daysInNewMonth
                            ) {
                              setSelectedDay(daysInNewMonth);
                            }
                          }}
                          className="flex-1 border border-black bg-white px-1 py-0.5 outline-none "
                          style={{
                            // [데이터/숫자 규칙] JetBrains Mono
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: "11px",
                          }}
                          size={1}
                        >
                          {years.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                        <select
                          value={selectedMonth}
                          onChange={(e) => {
                            const newMonth = Number(e.target.value);
                            setSelectedMonth(newMonth);
                            // 월 변경 시 선택된 일이 유효한지 확인
                            const daysInNewMonth = new Date(
                              selectedYear,
                              newMonth + 1,
                              0
                            ).getDate();
                            if (
                              selectedDay !== null &&
                              selectedDay > daysInNewMonth
                            ) {
                              setSelectedDay(daysInNewMonth);
                            }
                          }}
                          className="flex-1 border border-black bg-white px-1 py-0.5 outline-none"
                          style={{
                            // [데이터/숫자 규칙] JetBrains Mono
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: "11px",
                          }}
                          size={1}
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
                              // [UI 규칙] IBM Plex Mono + Pretendard
                              fontFamily:
                                "'IBM Plex Mono', 'Pretendard', monospace",
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
                            onClick={() => setSelectedDay(day)}
                            className={`text-center py-1 border border-black transition-colors ${
                              selectedDay === day
                                ? "text-[#F2F0EB]"
                                : "bg-white hover:bg-[#F2F0EB]"
                            }`}
                            style={{
                              // [데이터/숫자 규칙] JetBrains Mono
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: "10px",
                              backgroundColor:
                                selectedDay === day ? "#3A3834" : undefined,
                              cursor: "pointer",
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
                        // [UI 규칙] IBM Plex Mono + Pretendard
                        fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                        fontSize: "11px",
                        marginBottom: "8px",
                        opacity: 0.4,
                        color: "#666",
                      }}
                    >
                      이미지
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <button
                      onClick={handleImageButtonClick}
                      className="w-full bg-white hover:bg-[#F2F0EB] transition-colors flex items-center justify-center relative"
                      style={{
                        border: "1px solid rgba(0,0,0,0.3)",
                        cursor: "pointer",
                        minHeight: "192px", // 기본 최소 높이
                      }}
                    >
                      {selectedImage ? (
                        <>
                          <img
                            src={selectedImage}
                            alt="Preview"
                            className="w-full h-auto"
                            style={{
                              maxHeight: "342px", // 내용 영역의 높이와 동일
                              objectFit: "contain",
                            }}
                          />
                          <button
                            onClick={handleRemoveImage}
                            className="absolute top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-1 transition-colors"
                            style={{
                              backdropFilter: "blur(4px)",
                            }}
                            role="button"
                            tabIndex={0}
                            aria-label="Remove image"
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                e.stopPropagation();
                                handleRemoveImage(e);
                              }
                            }}
                          >
                            <X size={16} strokeWidth={2} />
                          </button>
                        </>
                      ) : (
                        <Plus
                          size={40}
                          strokeWidth={1}
                          style={{ opacity: 0.2 }}
                        />
                      )}
                    </button>
                  </div>
                </div>

                {/* Right Column: Time + Description */}
                <div className="flex flex-col gap-4">
                  {/* Time Picker - OPTIONAL */}
                  <div>
                    <div
                      style={{
                        // [UI 규칙] IBM Plex Mono + Pretendard
                        fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
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
                      }}
                    >
                      <select
                        value={selectedHour}
                        onChange={(e) =>
                          setSelectedHour(Number(e.target.value))
                        }
                        className="bg-white px-2 py-1 outline-none"
                        style={{
                          // [데이터/숫자 규칙] JetBrains Mono
                          fontFamily: "'JetBrains Mono', monospace",
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
                          // [데이터/숫자 규칙] JetBrains Mono
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "14px",
                          opacity: 0.3,
                        }}
                      >
                        :
                      </span>
                      <select
                        value={selectedMinute}
                        onChange={(e) =>
                          setSelectedMinute(Number(e.target.value))
                        }
                        className="bg-white px-2 py-1 outline-none"
                        style={{
                          // [데이터/숫자 규칙] JetBrains Mono
                          fontFamily: "'JetBrains Mono', monospace",
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
                    <div className="flex items-center mb-2">
                      <div
                        style={{
                          // [UI 규칙] IBM Plex Mono + Pretendard
                          fontFamily:
                            "'IBM Plex Mono', 'Pretendard', monospace",
                          fontSize: "11px",
                          opacity: 0.4,
                          color: "#666",
                        }}
                      >
                        내용
                      </div>
                    </div>
                    <div
                      className="bg-white p-3 relative overflow-auto"
                      style={{
                        border: "1px solid rgba(0,0,0,0.3)",
                        height: "342px",
                      }}
                    >
                      <textarea
                        placeholder="내용을 입력해주세요"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full h-full bg-transparent outline-none resize-none"
                        style={{
                          // [본문 규칙] IBM Plex Mono + Pretendard
                          fontFamily:
                            "'IBM Plex Mono', 'Pretendard', monospace",
                          fontSize: "12px",
                          lineHeight: "1.5",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 에러 메시지 표시 */}
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded">
                  <span
                    style={{
                      // [UI 규칙] IBM Plex Mono + Pretendard
                      fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                      fontSize: "12px",
                      color: "#D32F2F",
                    }}
                  >
                    {errorMessage}
                  </span>
                </div>
              )}

              {/* Bottom: Save/Edit Button */}
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`text-[#F2F0EB] py-2.5 border border-black transition-colors w-full ${
                    isSaving ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  style={{ backgroundColor: "#8B857D" }}
                  onMouseEnter={(e) => {
                    if (!isSaving) {
                      e.currentTarget.style.backgroundColor = "#3A3834";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSaving) {
                      e.currentTarget.style.backgroundColor = "#8B857D";
                    }
                  }}
                >
                  <span
                    style={{
                      // [UI 규칙] IBM Plex Mono + Pretendard
                      fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                      fontSize: "13px",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {isSaving
                      ? currentNodeData
                        ? "수정 중..."
                        : "저장 중..."
                      : currentNodeData
                      ? "수정"
                      : "저장"}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
