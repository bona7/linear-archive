import { Search, Calendar, Plus } from "lucide-react";
import { useState } from "react";

interface ToolbarProps {
  onNewArchive: () => void;
  onDateSelect: (date: Date) => void;
  onSearch: () => void;
}

export function Toolbar({ onNewArchive, onDateSelect, onSearch }: ToolbarProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState(2024);
  const [selectedMonth, setSelectedMonth] = useState(10); // October
  const [selectedDay, setSelectedDay] = useState(1);

  const handleDateConfirm = () => {
    const date = new Date(selectedYear, selectedMonth - 1, selectedDay);
    onDateSelect(date);
    setShowDatePicker(false);
  };

  return (
    <div className="relative">
      <div 
        className="bg-[#F2F0EB] border-black flex flex-row items-center gap-0"
        style={{
          borderWidth: '1px',
        }}
      >
        {/* Calendar Button - Opens Date Picker */}
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

        {/* Plus Button - Opens Archive Modal */}
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
          {/* Backdrop to close date picker when clicking outside */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowDatePicker(false)}
          />
          
          <div 
            className="absolute left-0 top-full mt-4 bg-[#F2F0EB] border-2 border-black p-4 z-50"
            style={{ width: '200px' }}
          >
            <div className="mb-3">
              <span className="block mb-1" style={{ fontFamily: 'SF Mono, Menlo, Monaco, Consolas, monospace', fontSize: '12px', fontWeight: 'bold' }}>
                날짜 선택
              </span>
            </div>

            {/* Year */}
            <div className="mb-3">
              <label className="block mb-1" style={{ fontFamily: 'SF Mono, Menlo, Monaco, Consolas, monospace', fontSize: '10px' }}>
                년도
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full border border-black bg-[#F2F0EB] px-2 py-1"
                style={{ fontFamily: 'SF Mono, Menlo, Monaco, Consolas, monospace', fontSize: '11px' }}
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
              </select>
            </div>

            {/* Month */}
            <div className="mb-3">
              <label className="block mb-1" style={{ fontFamily: 'SF Mono, Menlo, Monaco, Consolas, monospace', fontSize: '10px' }}>
                월
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full border border-black bg-[#F2F0EB] px-2 py-1"
                style={{ fontFamily: 'SF Mono, Menlo, Monaco, Consolas, monospace', fontSize: '11px' }}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>

            {/* Day */}
            <div className="mb-3">
              <label className="block mb-1" style={{ fontFamily: 'SF Mono, Menlo, Monaco, Consolas, monospace', fontSize: '10px' }}>
                일
              </label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(Number(e.target.value))}
                className="w-full border border-black bg-[#F2F0EB] px-2 py-1"
                style={{ fontFamily: 'SF Mono, Menlo, Monaco, Consolas, monospace', fontSize: '11px' }}
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
                style={{ fontFamily: 'SF Mono, Menlo, Monaco, Consolas, monospace', fontSize: '11px' }}
              >
                이동
              </button>
              <button
                onClick={() => setShowDatePicker(false)}
                className="flex-1 border border-black bg-[#F2F0EB] px-3 py-1 hover:bg-black hover:text-[#F2F0EB] transition-colors"
                style={{ fontFamily: 'SF Mono, Menlo, Monaco, Consolas, monospace', fontSize: '11px' }}
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