import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

interface QuickInsightProps {
  insight: string | null;
}

export function QuickInsight({ insight }: QuickInsightProps) {
  const [displayedInsight, setDisplayedInsight] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (insight) {
      // Fade out current message
      setIsVisible(false);

      // Wait for fade out, then update content and fade in
      const updateTimer = setTimeout(() => {
        setDisplayedInsight(insight);
        // Trigger fade-in
        const fadeInTimer = setTimeout(() => setIsVisible(true), 50);
        return () => clearTimeout(fadeInTimer);
      }, 300);

      return () => clearTimeout(updateTimer);
    } else {
      setIsVisible(false);
      setDisplayedInsight(null);
    }
  }, [insight]);

  return (
    <div
      className="flex justify-center px-8 pb-8 transition-all duration-500 ease-out"
      style={{
        opacity: isVisible && displayedInsight ? 1 : 0,
        transform: isVisible && displayedInsight ? "translateY(0)" : "translateY(10px)",
        minHeight: "60px", // Reserve space to prevent layout shift
      }}
    >
      <div className="max-w-2xl w-full flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Sparkles size={16} strokeWidth={1.5} className="text-black" />
        </div>
        <p
          style={{
            fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
            fontSize: "14px",
            lineHeight: "1.7",
            color: "#000000",
          }}
        >
          {displayedInsight}
        </p>
      </div>
    </div>
  );
}
