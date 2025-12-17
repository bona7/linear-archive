import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newNickname: string) => void;
  userNickname: string;
}

export function SettingsModal({
  isOpen,
  onClose,
  onSave,
  userNickname,
}: SettingsModalProps) {
  const [newNickname, setNewNickname] = useState(userNickname);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNewNickname(userNickname);
      setErrorMessage(null);
    }
  }, [isOpen, userNickname]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!newNickname.trim()) {
      setErrorMessage("닉네임을 입력해주세요.");
      return;
    }
    if (newNickname.trim() === userNickname) {
      onClose();
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      onSave(newNickname.trim());
      onClose();
    } catch (error: any) {
      console.error("Failed to save nickname:", error);
      setErrorMessage(error.message || "닉네임 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
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
      onClick={onClose}
    >
      <div
        className="bg-[#F2F0EB] border border-black w-full max-w-md"
        style={{
          ...getModalStyle(),
          boxShadow: "2px 2px 0 rgba(0, 0, 0, 0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#F2F0EB] px-4 py-3 flex items-center justify-between border-b border-black">
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "11px",
              letterSpacing: "0.05em",
              opacity: 0.5,
            }}
          >
            EDIT_PROFILE
          </span>
          <button
            onClick={onClose}
            className="border border-black w-6 h-6 flex items-center justify-center hover:bg-black hover:text-[#F2F0EB] transition-colors"
            aria-label="Close"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label
              htmlFor="nickname"
              className="block mb-2"
              style={{
                fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                fontSize: "14px",
                fontWeight: "bold",
              }}
            >
              닉네임 수정
            </label>
            <input
              id="nickname"
              type="text"
              value={newNickname}
              onChange={(e) => setNewNickname(e.target.value)}
              className="w-full border-2 border-black bg-white px-4 py-3 focus:outline-none focus:border-black"
              style={{
                fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                fontSize: "14px",
              }}
              placeholder="새 닉네임을 입력하세요"
            />
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-300 rounded">
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                  fontSize: "12px",
                  color: "#D32F2F",
                }}
              >
                {errorMessage}
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-black flex gap-2">
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
                fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                fontSize: "13px",
                letterSpacing: "0.05em",
              }}
            >
              {isSaving ? "저장 중..." : "저장"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
