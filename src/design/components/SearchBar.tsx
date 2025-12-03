import { X } from "lucide-react";
import { useState } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClose: () => void;
  matchCount: number;
}

export function SearchBar({ onSearch, onClose, matchCount }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSearch = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-8">
      {/* Search Input */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="아카이브 검색..."
          className="flex-1 border-2 border-black bg-[#F2F0EB] px-4 py-3"
          style={{ 
            fontFamily: 'SF Mono, Menlo, Monaco, Consolas, monospace', 
            fontSize: '14px',
            outline: 'none'
          }}
          autoFocus
        />
        <button
          onClick={handleClear}
          className="border-2 border-black bg-[#F2F0EB] px-4 hover:bg-black hover:text-[#F2F0EB] transition-colors"
          style={{ fontFamily: 'SF Mono, Menlo, Monaco, Consolas, monospace', fontSize: '12px' }}
        >
          지우기
        </button>
        <button
          onClick={onClose}
          className="border-2 border-black bg-black text-[#F2F0EB] px-3 hover:bg-[#F2F0EB] hover:text-black transition-colors"
          aria-label="Close Search"
        >
          <X size={18} strokeWidth={2} />
        </button>
      </div>

      {/* Results Info */}
      {query && (
        <div className="border border-black bg-[#F2F0EB] px-3 py-2 inline-block">
          <span style={{ fontFamily: 'SF Mono, Menlo, Monaco, Consolas, monospace', fontSize: '12px' }}>
            {matchCount === 0 ? '일치 없음' : `${matchCount}건 일치`}
          </span>
        </div>
      )}
    </div>
  );
}