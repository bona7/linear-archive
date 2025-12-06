import { useState, useRef, useEffect } from "react";
import { Palette } from "lucide-react";

interface TagCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  anchorEl: HTMLElement | null;
  onCreateTag: (name: string, color: string) => void;
}

// 태그 생성 모달 & db.ts생성 후 커밋

export function TagCreator({
  isOpen,
  onClose,
  anchorEl,
  onCreateTag,
}: TagCreatorProps) {
  const [tagName, setTagName] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("#FF69B4");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const defaultColors = [
    "#FF69B4", // Pink
    "#FF6B8A", // Light Red
    "#8B7FFF", // Purple
    "#FFD700", // Gold
    "#C0C0C0", // Silver
    "#9370DB", // Medium Purple
    "#3B82F6", // Blue
    "#EF4444", // Red
    "#10B981", // Green
    "#F59E0B", // Amber
    "#8B4789", // Dark Purple
    "#B8860B", // Dark Goldenrod
  ];

  // 모달이 열릴 때 입력창에 포커스
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // 모달이 닫힐 때 초기화
  useEffect(() => {
    if (!isOpen) {
      setTagName("");
      setSelectedColor("#FF69B4");
      setShowColorPicker(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleCreate = () => {
    if (tagName.trim()) {
      onCreateTag(tagName.trim(), selectedColor);
      onClose();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagName.trim()) {
      handleCreate();
    }
  };

  if (!isOpen || !anchorEl) return null;

  return (
    <div
      ref={popoverRef}
      className="fixed bg-white border border-black z-[120] flex flex-col"
      style={{
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "320px",
        maxHeight: "85vh",
      }}
    >
      {/* Header */}
      <div className="bg-[#F2F0EB] px-4 py-3 border-b border-black flex-shrink-0">
        <span
          style={{
            fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
            fontSize: "11px",
            letterSpacing: "0.05em",
            opacity: 0.5,
          }}
        >
          CREATE_TAG
        </span>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {/* Section 1: Tag Name Input */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div
              className="border-b border-black pb-1 flex-1"
              style={{
                fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                fontSize: "12px",
              }}
            >
              태그 이름
            </div>
          </div>
          <input
            ref={inputRef}
            type="text"
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="태그 이름을 입력하세요"
            className="w-full border border-black px-3 py-2 bg-white outline-none focus:ring-0"
            style={{
              fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
              fontSize: "13px",
            }}
          />
        </div>

        {/* Section 2: Color Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div
              className="border-b border-black pb-1 flex-1"
              style={{
                fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                fontSize: "12px",
              }}
            >
              색상
            </div>
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="border border-black px-2 py-0.5 bg-white hover:bg-[#E5E5E5] transition-colors ml-2"
              style={{
                fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                fontSize: "10px",
              }}
            >
              <Palette size={12} strokeWidth={1.5} />
            </button>
          </div>

          <div className="grid grid-cols-6 gap-1.5">
            {defaultColors.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`aspect-square border transition-all relative ${
                  selectedColor === color
                    ? "border-black"
                    : "border-gray-400 hover:border-black"
                }`}
                style={{ backgroundColor: color }}
              >
                {selectedColor === color && (
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      color: "#F2F0EB",
                      fontSize: "12px",
                      fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                      textShadow: "0 0 2px rgba(0,0,0,0.5)",
                    }}
                  >
                    ✓
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Color Picker */}
          {showColorPicker && (
            <div className="mt-3 p-2 border border-black bg-white">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-12 h-8 border border-black cursor-pointer"
                />
                <input
                  type="text"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="flex-1 border border-black px-2 py-1 bg-white outline-none"
                  style={{
                    fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                    fontSize: "11px",
                  }}
                  placeholder="#RRGGBB"
                />
              </div>
            </div>
          )}
        </div>

        {/* Preview - Small */}
        <div className="flex items-center gap-2 px-3 py-2 border border-black bg-white">
          <span
            style={{
              fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
              fontSize: "10px",
              opacity: 0.6,
            }}
          >
            미리보기:
          </span>
          <div
            className="w-3 h-3 border border-black"
            style={{ backgroundColor: selectedColor }}
          />
          <span
            style={{
              fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
              fontSize: "11px",
            }}
          >
            {tagName || "태그 이름"}
          </span>
        </div>

        {/* Add Button */}
        <button
          onClick={handleCreate}
          disabled={!tagName.trim()}
          className="w-full text-[#F2F0EB] py-2.5 border border-black hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#8B857D" }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = "#3A3834";
            }
          }}
          onMouseLeave={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = "#8B857D";
            }
          }}
        >
          <span
            style={{
              fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
              fontSize: "13px",
              letterSpacing: "0.05em",
            }}
          >
            추가하기
          </span>
        </button>
      </div>
    </div>
  );
}
