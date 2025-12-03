import { Settings, LogOut, User } from "lucide-react";
import { useState } from "react";

interface ProfileMenuProps {
  onLogout: () => void;
  userNickname: string;
}

export function ProfileMenu({ onLogout, userNickname }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed top-8 right-8 z-50">
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-[#F2F0EB] border border-black px-4 py-2 hover:bg-black hover:text-[#F2F0EB] transition-colors"
      >
        {/* Profile Icon - Square with border */}
        <div 
          className="w-10 h-10 border border-black bg-[#D0CEC9] flex items-center justify-center"
        >
          <User style={{ width: '20px', height: '20px' }} strokeWidth={1.5} />
        </div>
        
        {/* User Name */}
        <span 
          className="whitespace-nowrap"
          style={{ 
            fontFamily: 'SF Mono, Menlo, Monaco, Consolas, monospace', 
            fontSize: '14px' 
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
            style={{ minWidth: '200px' }}
          >
            {/* Settings Option */}
            <button
              className="w-full flex items-center gap-3 px-4 py-3 border-b border-black hover:bg-black hover:text-[#F2F0EB] transition-colors"
              onClick={() => {
                // Settings action here
                console.log("Settings clicked");
                setIsOpen(false);
              }}
            >
              <Settings style={{ width: '18px', height: '18px' }} strokeWidth={1.5} />
              <span style={{ fontFamily: 'SF Mono, Menlo, Monaco, Consolas, monospace', fontSize: '13px' }}>
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
              }}
            >
              <LogOut style={{ width: '18px', height: '18px' }} strokeWidth={1.5} />
              <span style={{ fontFamily: 'SF Mono, Menlo, Monaco, Consolas, monospace', fontSize: '13px' }}>
                로그아웃
              </span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}