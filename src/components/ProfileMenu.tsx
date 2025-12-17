import { Settings, LogOut, User } from "lucide-react";
import { useState } from "react";
import { Router, useRouter } from "next/router";
import { SettingsModal } from "./SettingsModal"; // Import the new SettingsModal

interface ProfileMenuProps {
  onLogout: () => void;
  userNickname: string;
  onUpdateNickname: (newNickname: string) => void; // Add onUpdateNickname prop
}

export function ProfileMenu({
  onLogout,
  userNickname,
  onUpdateNickname,
}: ProfileMenuProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false); // New state for settings modal

  return (
    <div className="fixed top-8 right-8 z-50">
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-[#F2F0EB] border border-black px-4 py-2 hover:bg-black hover:text-[#F2F0EB] transition-colors"
      >
        {/* Profile Icon - Square with border */}
        <div className="w-10 h-10 border border-black bg-[#D0CEC9] flex items-center justify-center">
          <User style={{ width: "20px", height: "20px" }} strokeWidth={1.5} />
        </div>

        {/* User Name */}
        <span
          className="whitespace-nowrap"
          style={{
            fontFamily: "Space Grotesk, 'Pretendard', serif",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          {userNickname}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop to close menu when clicking outside */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div
            className="absolute top-full right-0 mt-2 bg-[#F2F0EB] border-2 border-black z-50"
            style={{ minWidth: "200px" }}
          >
            {/* Settings Option */}
            <button
              className="w-full flex items-center gap-3 px-4 py-3 border-b border-black hover:bg-black hover:text-[#F2F0EB] transition-colors"
              onClick={() => {
                setIsSettingsModalOpen(true); // Open settings modal
                setIsOpen(false); // Close profile dropdown
              }}
            >
              <Settings
                style={{ width: "18px", height: "18px" }}
                strokeWidth={1.5}
              />
              <span
                style={{
                  // [UI 규칙] IBM Plex Mono + Pretendard
                  fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                  fontSize: "13px",
                }}
              >
                설정
              </span>
            </button>

            {/* Logout Option */}
            <button
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black hover:text-[#F2F0EB] transition-colors"
              onClick={() => {
                // Logout action here
                onLogout();
                setIsOpen(false);

                router.reload();
              }}
            >
              <LogOut
                style={{ width: "18px", height: "18px" }}
                strokeWidth={1.5}
              />
              <span
                style={{
                  // [UI 규칙] IBM Plex Mono + Pretendard
                  fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                  fontSize: "13px",
                }}
              >
                로그아웃
              </span>
            </button>
          </div>
        </>
      )}

      {/* Render SettingsModal */}
      {isSettingsModalOpen && (
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          onSave={onUpdateNickname} // Pass the onUpdateNickname callback
          userNickname={userNickname}
        />
      )}
    </div>
  );
}