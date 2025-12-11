import { useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { BoardWithTags, Tag } from "@/commons/libs/supabase/db";
import { fetchAnalysis, fetchQueryParsing, QueryFilters, fetchSemanticSearchBoards } from "@/commons/statistics/AnalysisCall";
import { StatHighlight, Statistics, calculateStatistics, getRandomHighlights } from "@/commons/statistics/calculate";
import { parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Search, X } from "lucide-react";
import { getPostImageUrl } from "@/commons/libs/supabase/storage";

interface AnalysisData {
  analysis: string;
}

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

interface AnalysisPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  boards: BoardWithTags[];
  tags: Tag[];
}

export function AnalysisPanel({
  isOpen,
  onToggle,
  boards,
  tags,
}: AnalysisPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [randomStats, setRandomStats] = useState<StatHighlight[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<QueryFilters | null>(null);
  const [isUserQuery, setIsUserQuery] = useState(false); // Track if this is a user query vs general analysis

  // Filter boards based on active filters
  const getFilteredBoards = () => {
    if (!activeFilters) return boards;

    return boards.filter((board) => {
      // Date Filter
      if (activeFilters.startDate && activeFilters.endDate && board.date) {
        const boardDate = parseISO(board.date);
        const start = startOfDay(parseISO(activeFilters.startDate));
        const end = endOfDay(parseISO(activeFilters.endDate));
        
        if (!isWithinInterval(boardDate, { start, end })) {
          return false;
        }
      }

      // Tag Filter
      if (activeFilters.tags && activeFilters.tags.length > 0) {
        const boardTagNames = board.tags.map(t => t.tag_name.toLowerCase());
        const hasMatchingTag = activeFilters.tags.some(reqTag => 
          boardTagNames.includes(reqTag.toLowerCase())
        );
        if (!hasMatchingTag) return false;
      }

      // Keyword Filter
      if (activeFilters.keywords && activeFilters.keywords.length > 0) {
        if (!board.description) return false;
        const desc = board.description.toLowerCase();
        const hasKeyword = activeFilters.keywords.some(kw => 
          desc.includes(kw.toLowerCase())
        );
        if (!hasKeyword) return false;
      }

      return true;
    });
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    setAnalysisData(null); // Clear previous analysis

    // Determine if this is a user query or general analysis
    const hasUserQuery = searchQuery.trim().length > 0;
    setIsUserQuery(hasUserQuery);

    let boardsToAnalyze = boards;
    let currentFilters = activeFilters;

    // === USER QUERY PATH: Use RAG + Agentic Filtering ===
    if (hasUserQuery) {
      // 1. Process Query
      if (!activeFilters) {
        setIsSearching(true);
        try {
          const filters = await fetchQueryParsing(searchQuery);
          if (filters) {
            console.log("Applied Filters:", filters);
            setActiveFilters(filters);
            currentFilters = filters;
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsSearching(false);
        }
      }
      
      // 2. Filter Boards (Hybrid: Logic + Vector)
      if (currentFilters) {
        // A. Logic Filtering (Date & Tags & Image)
        boardsToAnalyze = boards.filter((board) => {
          if (currentFilters?.startDate && currentFilters?.endDate && board.date) {
            const boardDate = parseISO(board.date);
            const start = startOfDay(parseISO(currentFilters.startDate));
            const end = endOfDay(parseISO(currentFilters.endDate));
            if (!isWithinInterval(boardDate, { start, end })) return false;
          }
          if (currentFilters?.tags?.length) {
            const boardTagNames = board.tags.map(t => t.tag_name.toLowerCase());
            if (!currentFilters.tags.some(t => boardTagNames.includes(t.toLowerCase()))) return false;
          }
          if (currentFilters?.daysOfWeek && currentFilters.daysOfWeek.length > 0 && board.date) {
            const day = parseISO(board.date).getDay();
            if (!currentFilters.daysOfWeek.includes(day)) return false;
          }
          if (currentFilters?.hasImage === true) {
            if (!board.has_image) return false;
          }
          return true;
        });

        // B. Semantic Filtering (Keywords -> Vector Search)
        if (currentFilters.keywords && currentFilters.keywords.length > 0) {
          setIsSearching(true);
          try {
            const semanticBoardIds = await fetchSemanticSearchBoards(searchQuery);
            if (semanticBoardIds) {
              const semanticIdSet = new Set(semanticBoardIds);
              boardsToAnalyze = boardsToAnalyze.filter(b => semanticIdSet.has(b.board_id));
            }
          } catch (e) {
            console.error("Vector search error", e);
          } finally {
            setIsSearching(false);
          }
        }
      }

      // 3. Sorting and Limiting
      if (currentFilters?.sort) {
        if (currentFilters.sort === 'newest') {
          boardsToAnalyze.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
        } else if (currentFilters.sort === 'oldest') {
          boardsToAnalyze.sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
        } else if (currentFilters.sort === 'random') {
          boardsToAnalyze.sort(() => Math.random() - 0.5);
        }
      }

      if (currentFilters?.limit && currentFilters.limit > 0) {
        boardsToAnalyze = boardsToAnalyze.slice(0, currentFilters.limit);
      }

      if (boardsToAnalyze.length === 0) {
        setRandomStats(null);
        setAnalysisData({
          analysis: "관련 정보를 찾을 수 없었습니다"
        });
        setIsLoading(false);
        return;
      }

      // Hide stats for user queries
      setRandomStats(null);
    } 
    // === GENERAL ANALYSIS PATH: No filtering, fetchAnalysis will handle board filtering ===
    else {
      // For general analysis, pass ALL boards
      // fetchAnalysis will filter based on last_compressed_at
      boardsToAnalyze = boards;
      
      // Calculate and show stats for general analysis
      const stats: Statistics = calculateStatistics(boardsToAnalyze, tags);
      const highlights: StatHighlight[] = getRandomHighlights(stats);
      setRandomStats(highlights);
    }

    // Stats are already calculated in each branch above
    // For user query: calculated on filtered boards
    // For general analysis: calculated on all boards (will be filtered in fetchAnalysis)
    const stats: Statistics = calculateStatistics(boardsToAnalyze, tags);
    const highlights: StatHighlight[] = getRandomHighlights(stats);

    console.log(highlights);

    try {
      // Pass isUserQuery flag to fetchAnalysis
      const data = await fetchAnalysis(boardsToAnalyze, stats, highlights, hasUserQuery);
      if (data) {
        setAnalysisData(data);
      }
    } catch (error) {
      console.error("Failed to get analysis:", error);
      // Optionally, set an error state to show in the UI
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
      setActiveFilters(null);
      setSearchQuery("");
      setAnalysisData(null);
      setRandomStats(null);
      setIsUserQuery(false);
  };

  return (
    <>
      {/* Toggle Button - Same height as profile button (top-8 = 32px) */}
      <button
        onClick={onToggle}
        className="fixed bg-[#F2F0EB] border border-black hover:bg-black hover:text-white transition-colors flex items-center justify-center"
        style={{
          left: isOpen ? "320px" : "32px",
          top: "32px",
          width: "44px",
          height: "44px",
          transition: "left 0.3s ease",
          zIndex: 105,
          pointerEvents: "auto",
        }}
      >
        <Sparkles size={20} strokeWidth={1.5} />
      </button>

      {/* Side Panel - Top left corner, 1/8 screen size */}
      <div
        className="fixed bg-white border-r border-b border-black flex flex-col transition-transform duration-300"
        style={{
          left: "0",
          top: "0",
          width: "300px",
          height: "400px",
          transform: isOpen ? "translate(0, 0)" : "translate(-100%, 0)",
          zIndex: 105,
          pointerEvents: isOpen ? "auto" : "none",
        }}
      >
        {/* Header */}
        <div className="bg-[#F2F0EB] px-4 py-3 border-b border-black flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={14} strokeWidth={1.5} />
            <span
              style={{
                // [제목 규칙] Space Grotesk + Pretendard
                fontFamily: "'Space Grotesk', 'Pretendard', sans-serif",
                fontWeight: "bold",
                fontSize: "11px",
                letterSpacing: "0.05em",
              }}
            >
              AI 요약
            </span>
          </div>
          <button
            onClick={onToggle}
            className="border border-black w-6 h-6 flex items-center justify-center hover:bg-black hover:text-white transition-colors"
          >
            <ChevronLeft size={14} strokeWidth={2} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 modal-scrollbar">
          
          {/* Query Input */}
          <div className="flex flex-col gap-2">
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Ask about a specific period..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAnalyze();
                    }}
                    className="w-full border border-black p-2 pr-8 text-[13px] outline-none placeholder:text-gray-400"
                    style={{ fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace" }}
                    disabled={isLoading || isSearching || !!activeFilters}
                />
                {activeFilters ? (
                    <button 
                        onClick={clearFilters}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                    >
                        <X size={14} />
                    </button>
                ) : (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
                        <Search size={14} />
                    </div>
                )}
            </div>
            
            {/* Active Filters Display */}
            {activeFilters && (
                <div className="flex flex-wrap gap-1 text-[10px] text-gray-600 font-mono">
                    {activeFilters.startDate && (
                        <span className="bg-gray-100 px-1 border border-gray-200">
                            {activeFilters.startDate} ~ {activeFilters.endDate}
                        </span>
                    )}
                    {activeFilters.tags.map(t => (
                        <span key={t} className="bg-gray-100 px-1 border border-gray-200">#{t}</span>
                    ))}
                    {activeFilters.keywords.map(k => (
                        <span key={k} className="bg-gray-100 px-1 border border-gray-200">"{k}"</span>
                    ))}
                </div>
            )}
          </div>

          {isLoading || isSearching ? (
            // Loading State
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="border border-black p-3">
                <div
                  className="w-8 h-8 border-2 border-black border-t-transparent animate-spin"
                  style={{ borderRadius: "50%" }}
                />
              </div>
              <span
                style={{
                  // [UI 규칙] IBM Plex Mono + Pretendard
                  fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                  fontSize: "12px",
                }}
              >
                {isSearching ? "질문 분석 중..." : "데이터 분석 중..."}
              </span>
            </div>
          ) : analysisData ? (
            // Analysis Results
            <>
              {/* Stats - Only show for general analysis, not user queries */}
              {randomStats && (
                <>
              {/* Fact 1 */}
              <div>
                <div className="flex items-center gap-2 mb-2 border-b border-black pb-1">
                  <TrendingUp size={14} strokeWidth={1.5} />
                  <span
                    style={{
                      // [UI 규칙] IBM Plex Mono + Pretendard
                      fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                      fontSize: "11px",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {randomStats[0].label}
                  </span>
                </div>
                <div
                  className="border border-black bg-white p-3"
                  style={{
                    // [본문 규칙] IBM Plex Mono + Pretendard
                    fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                    fontSize: "13px",
                    lineHeight: "1.6",
                  }}
                >
                  {randomStats[0].value}
                </div>
              </div>

              {/* Fact 2 */}
              <div>
                <div className="flex items-center gap-2 mb-2 border-b border-black pb-1">
                  <BarChart3 size={14} strokeWidth={1.5} />
                  <span
                    style={{
                      // [UI 규칙] IBM Plex Mono + Pretendard
                      fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                      fontSize: "11px",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {randomStats[1].label}
                  </span>
                </div>
                <div
                  className="border border-black bg-white p-3"
                  style={{
                    // [본문 규칙] IBM Plex Mono + Pretendard
                    fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                    fontSize: "13px",
                    lineHeight: "1.6",
                  }}
                >
                  {randomStats[1].value}
                </div>
              </div>

              {/* Fact 3 */}
              <div>
                <div className="flex items-center gap-2 mb-2 border-b border-black pb-1">
                  <BarChart3 size={14} strokeWidth={1.5} />
                  <span
                    style={{
                      // [UI 규칙] IBM Plex Mono + Pretendard
                      fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                      fontSize: "11px",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {randomStats[2].label}
                  </span>
                </div>
                <div
                  className="border border-black bg-white p-3"
                  style={{
                    // [본문 규칙] IBM Plex Mono + Pretendard
                    fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                    fontSize: "13px",
                    lineHeight: "1.6",
                  }}
                >
                  {randomStats[2].value}
                </div>
              </div>
              </>
              )}

              {/* Analysis Summary */}
              <div>
                <div className="border-b border-black pb-1 mb-2">
                  <span
                    style={{
                      // [UI 규칙] IBM Plex Mono + Pretendard
                      fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                      fontSize: "11px",
                      letterSpacing: "0.05em",
                    }}
                  >
                    요약
                  </span>
                </div>
                <div
                  className="border border-black bg-[#F2F0EB] p-3"
                  style={{
                    // [본문 규칙] IBM Plex Mono + Pretendard
                    fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                    fontSize: "13px",
                    lineHeight: "1.6",
                  }}
                >
                  {analysisData.analysis}
                </div>
              </div>

              {/* Re-analyze Button */}
              <button
                onClick={handleAnalyze}
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
                    // [UI 규칙] IBM Plex Mono + Pretendard
                    fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                    fontSize: "13px",
                    letterSpacing: "0.05em",
                  }}
                >
                  재분석
                </span>
              </button>
            </>
          ) : (
            // Initial State - No Data
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="border border-black p-4 bg-[#F2F0EB]">
                <Sparkles size={32} strokeWidth={1.5} />
              </div>
              <span
                style={{
                  // [UI 규칙] IBM Plex Mono + Pretendard
                  fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                  fontSize: "12px",
                }}
              >
                아직 분석 전입니다
              </span>
              <button
                onClick={handleAnalyze}
                className="text-[#F2F0EB] py-2.5 border border-black transition-colors px-6"
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
                    // [UI 규칙] IBM Plex Mono + Pretendard
                    fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                    fontSize: "12px",
                    letterSpacing: "0.05em",
                  }}
                >
                  분석 시작
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}