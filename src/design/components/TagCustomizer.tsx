import { useState, useRef, useEffect } from "react";
import { Palette } from "lucide-react";

interface TagCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  anchorEl: HTMLElement | null;
  onSelectTag: (name: string, color: string) => void;
}

export function TagCustomizer({
  isOpen,
  onClose,
  anchorEl,
  onSelectTag,
}: TagCustomizerProps) {
  const [selectedTag, setSelectedTag] = useState<string>("가나디");
  const [selectedColor, setSelectedColor] = useState<string>("#FF69B4");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const tags = [
    { name: "가나디", defaultColor: "#FF69B4" },
    { name: "라멘", defaultColor: "#FF6B8A" },
    { name: "자동차", defaultColor: "#3B82F6" },
    { name: "콘서트", defaultColor: "#9370DB" },
    { name: "보드", defaultColor: "#10B981" },
    { name: "음악", defaultColor: "#F59E0B" },
  ];

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

  const handleApply = () => {
    onSelectTag(selectedTag, selectedColor);
    onClose();
  };

  const handleTagSelect = (tagName: string, defaultColor: string) => {
    setSelectedTag(tagName);
    setSelectedColor(defaultColor);
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
            fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
            fontSize: "11px",
            letterSpacing: "0.05em",
            opacity: 0.5,
          }}
        >
          TAG_SELECT
        </span>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {/* Section 1: Tag Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div
              className="border-b border-black pb-1 flex-1"
              style={{
                fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                fontSize: "12px",
              }}
            >
              선택
            </div>
          </div>
          <div className="space-y-1.5">
            {tags.map((tag) => (
              <button
                key={tag.name}
                onClick={() => handleTagSelect(tag.name, tag.defaultColor)}
                className={`w-full border px-3 py-2 transition-colors flex items-center gap-3 ${
                  selectedTag === tag.name
                    ? "border-black bg-white"
                    : "border-gray-300 bg-white hover:border-black"
                }`}
              >
                {/* Color Square */}
                <div
                  className="w-4 h-4 border border-black flex-shrink-0"
                  style={{
                    backgroundColor:
                      selectedTag === tag.name
                        ? selectedColor
                        : tag.defaultColor,
                  }}
                />
                {/* Tag Name */}
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                    fontSize: "13px",
                  }}
                >
                  {tag.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Add Button */}
        <button className="w-full border border-black bg-white hover:bg-[#F2F0EB] transition-colors py-2 flex items-center justify-center gap-2">
          <span
            style={{
              fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
              fontSize: "18px",
            }}
          >
            +
          </span>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
              fontSize: "12px",
            }}
          >
            추가하기
          </span>
        </button>

        {/* Section 2: Color Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div
              className="border-b border-black pb-1 flex-1"
              style={{
                fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                fontSize: "12px",
              }}
            >
              색상
            </div>
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="border border-black px-2 py-0.5 bg-white hover:bg-[#E5E5E5] transition-colors ml-2"
              style={{
                fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
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
                      fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
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
                    fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
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
              fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
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
              fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
              fontSize: "11px",
            }}
          >
            {selectedTag}
          </span>
        </div>

        {/* Apply Button */}
        <button
          onClick={handleApply}
          className="w-full text-[#F2F0EB] py-2.5 border border-black hover:bg-black transition-colors"
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
              fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
              fontSize: "13px",
              letterSpacing: "0.05em",
            }}
          >
            적용
          </span>
        </button>
      </div>
    </div>
  );
}