import { Search, Calendar, Plus } from "lucide-react";
import { useState, useMemo, useEffect } from "react";

interface ToolbarProps {
  onNewArchive: () => void;
  onDateSelect: (date: Date) => void;
  onSearch: () => void;
  // [수정] 데이터의 최소/최대 연도를 props로 받음
  minYear: number;
  maxYear: number;
}

export function Toolbar({ 
  onNewArchive, 
  onDateSelect, 
  onSearch, 
  minYear, 
  maxYear 
}: ToolbarProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  // [수정] minYear부터 maxYear까지의 연도 배열 생성
  const years = useMemo(() => {
    const arr = [];
    // 데이터가 없어서 minYear가 maxYear보다 클 경우에 대한 안전장치
    const start = Math.min(minYear, maxYear);
    const end = Math.max(minYear, maxYear);
    
    for (let y = start; y <= end; y++) {
      arr.push(y);
    }
    // 최신 연도가 위로 오게 하려면 .reverse() 추가, 과거순이면 그대로
    return arr.sort((a, b) => b - a); 
  }, [minYear, maxYear]);

  // 팝업 열릴 때, 선택된 연도가 범위 밖에 있으면 범위 내로 보정
  useEffect(() => {
    if (showDatePicker) {
      if (selectedYear < minYear) setSelectedYear(minYear);
      if (selectedYear > maxYear) setSelectedYear(maxYear);
    }
  }, [showDatePicker, minYear, maxYear]);

  const handleDateConfirm = () => {
    const date = new Date(selectedYear, selectedMonth - 1, selectedDay);
    onDateSelect(date);
    setShowDatePicker(false);
  };

  return (
    <div className="relative">
      <div 
        className="bg-[#F2F0EB] border-black flex flex-row items-center gap-0"
        style={{ borderWidth: '1px' }}
      >
        {/* Calendar Button */}
        <button 
          onClick={() => setShowDatePicker(!showDatePicker)}
          className="border-black bg-[#F2F0EB] hover:bg-black hover:text-[#F2F0EB] transition-colors"
          style={{
            borderWidth: '0px',
            borderRightWidth: '1px',
            padding: '12px 16px',
            width: '56px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Select Date"
        >
          <Calendar style={{ width: '24px', height: '24px' }} strokeWidth={1.5} />
        </button>

        {/* Plus Button */}
        <button 
          onClick={onNewArchive}
          className="border-black bg-[#F2F0EB] hover:bg-black hover:text-[#F2F0EB] transition-colors"
          style={{
            borderWidth: '0px',
            borderRightWidth: '1px',
            padding: '12px 16px',
            width: '56px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="New Archive"
        >
          <Plus style={{ width: '24px', height: '24px' }} strokeWidth={1.5} />
        </button>

        {/* Search Button */}
        <button 
          onClick={onSearch}
          className="border-black bg-[#F2F0EB] hover:bg-black hover:text-[#F2F0EB] transition-colors"
          style={{
            borderWidth: '0px',
            padding: '12px 16px',
            width: '56px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Search"
        >
          <Search style={{ width: '24px', height: '24px' }} strokeWidth={1.5} />
        </button>
      </div>

      {/* Date Picker Popup */}
      {showDatePicker && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDatePicker(false)}
          />
          
          <div 
            className="absolute left-0 top-full mt-4 bg-[#F2F0EB] border-2 border-black p-4 z-50"
            style={{ width: '200px' }}
          >
            <div className="mb-3">
              <span className="block mb-1" style={{ fontFamily: "'IBM Plex Mono', 'Pretendard', monospace", fontSize: '12px', fontWeight: 'bold' }}>
                날짜 선택
              </span>
            </div>

            {/* Year Selector */}
            <div className="mb-3">
              <label className="block mb-1" style={{ fontFamily: "'IBM Plex Mono', 'Pretendard', monospace", fontSize: '10px' }}>
                년도
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full border border-black bg-[#F2F0EB] px-2 py-1"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}
              >
                {/* [수정] 동적으로 생성된 연도 옵션 렌더링 */}
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Month Selector */}
            <div className="mb-3">
              <label className="block mb-1" style={{ fontFamily: "'IBM Plex Mono', 'Pretendard', monospace", fontSize: '10px' }}>
                월
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full border border-black bg-[#F2F0EB] px-2 py-1"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>

            {/* Day Selector */}
            <div className="mb-3">
              <label className="block mb-1" style={{ fontFamily: "'IBM Plex Mono', 'Pretendard', monospace", fontSize: '10px' }}>
                일
              </label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(Number(e.target.value))}
                className="w-full border border-black bg-[#F2F0EB] px-2 py-1"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px' }}
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleDateConfirm}
                className="flex-1 border border-black bg-black text-[#F2F0EB] px-3 py-1 hover:bg-[#F2F0EB] hover:text-black transition-colors"
                style={{ fontFamily: "'IBM Plex Mono', 'Pretendard', monospace", fontSize: '11px' }}
              >
                이동
              </button>
              <button
                onClick={() => setShowDatePicker(false)}
                className="flex-1 border border-black bg-[#F2F0EB] px-3 py-1 hover:bg-black hover:text-[#F2F0EB] transition-colors"
                style={{ fontFamily: "'IBM Plex Mono', 'Pretendard', monospace", fontSize: '11px' }}
              >
                취소
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}