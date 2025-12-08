import { useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Sparkles,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { BoardWithTags } from "@/commons/libs/supabase/db";
import { fetchAnalysis } from "@/components/commons/units/AnalysisCall/AnalysisCall.index";

interface AnalysisData {
  fact1: string;
  fact2: string;
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
}

export function AnalysisPanel({
  isOpen,
  onToggle,
  boards,
}: AnalysisPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setAnalysisData(null); // Clear previous analysis

    try {
      const data = await fetchAnalysis(boards);
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
                fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
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
          {isLoading ? (
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
                  fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                  fontSize: "12px",
                }}
              >
                데이터 분석 중...
              </span>
            </div>
          ) : analysisData ? (
            // Analysis Results
            <>
              {/* Fact 1 */}
              <div>
                <div className="flex items-center gap-2 mb-2 border-b border-black pb-1">
                  <TrendingUp size={14} strokeWidth={1.5} />
                  <span
                    style={{
                      fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                      fontSize: "11px",
                      letterSpacing: "0.05em",
                    }}
                  >
                    인사이트 01
                  </span>
                </div>
                <div
                  className="border border-black bg-white p-3"
                  style={{
                    fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                    fontSize: "13px",
                    lineHeight: "1.6",
                  }}
                >
                  {analysisData.fact1}
                </div>
              </div>

              {/* Fact 2 */}
              <div>
                <div className="flex items-center gap-2 mb-2 border-b border-black pb-1">
                  <BarChart3 size={14} strokeWidth={1.5} />
                  <span
                    style={{
                      fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                      fontSize: "11px",
                      letterSpacing: "0.05em",
                    }}
                  >
                    인사이트 02
                  </span>
                </div>
                <div
                  className="border border-black bg-white p-3"
                  style={{
                    fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                    fontSize: "13px",
                    lineHeight: "1.6",
                  }}
                >
                  {analysisData.fact2}
                </div>
              </div>

              {/* Analysis Summary */}
              <div>
                <div className="border-b border-black pb-1 mb-2">
                  <span
                    style={{
                      fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
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
                    fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
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
                    fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
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
                  fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
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
                    fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
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
