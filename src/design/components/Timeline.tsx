import {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from "react";
import { BoardWithTags } from "@/commons/libs/supabase/db";

interface TimelineProps {
  onNodeClick: (
    nodeId: number | string,
    position: { x: number; y: number }
  ) => void;
  selectedNodeId: number | string | null;
  nodeDataMap: BoardWithTags[];
  searchQuery: string;
  matchedNodeIds: Set<number | string>;
}

export const Timeline = forwardRef<
  { scrollToDate: (date: Date) => void },
  TimelineProps
>(
  (
    { onNodeClick, selectedNodeId, nodeDataMap, searchQuery, matchedNodeIds },
    ref
  ) => {
    const [scrollPosition, setScrollPosition] = useState(0);
    const [zoom, setZoom] = useState(0.25);
    const [hoveredCluster, setHoveredCluster] = useState<
      number | string | null
    >(null);
    const [hoveredNodeId, setHoveredNodeId] = useState<number | string | null>(
      null
    );
    const timelineRef = useRef<HTMLDivElement>(null);

    const nodesById = useMemo(() => {
      if (!Array.isArray(nodeDataMap)) return new Map();
      return new Map(nodeDataMap.map((node) => [node.board_id, node]));
    }, [nodeDataMap]);

    const { startDate, endDate } = useMemo(() => {
      const today = new Date();
      today.setHours(23, 59, 59, 999);

      const nodes = Array.from(nodesById.values());
      const dates = nodes
        .map((node) => new Date(node.date))
        .filter((date) => !isNaN(date.getTime()));

      if (dates.length === 0) {
        const defaultStart = new Date(today);
        defaultStart.setMonth(today.getMonth() - 3);
        return { startDate: defaultStart, endDate: today };
      }

      const oldestDate = new Date(Math.min(...dates.map((d) => d.getTime())));
      const adjustedStart = new Date(oldestDate);
      adjustedStart.setDate(adjustedStart.getDate() - 7);

      return { startDate: adjustedStart, endDate: today };
    }, [nodeDataMap]);

    const totalDays =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

    const getVisibleDays = () => {
      return totalDays / zoom;
    };

    const maxZoom = useMemo(() => {
      const calculatedMax = totalDays / 10;
      return Math.max(1, Math.min(100, calculatedMax));
    }, [totalDays]);

    useLayoutEffect(() => {
      if (timelineRef.current) {
        timelineRef.current.scrollLeft = timelineRef.current.scrollWidth;
      }
    }, []);

    const dateToPosition = (date: Date) => {
      const daysSinceStart =
        (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      return Math.max(0, Math.min(100, (daysSinceStart / totalDays) * 100));
    };

    const allNodes = (Array.isArray(nodeDataMap) ? nodeDataMap : [])
      .filter((node) => node.date)
      .map((node) => ({
        id: node.board_id,
        type: node.tags[0]?.tag_name || "circle",
        position: dateToPosition(new Date(node.date)),
        label: node.description || "New Archive",
      }));

    const handleNodeClick = (
      event: React.MouseEvent,
      node: { id: string; position: number }
    ) => {
      const rect = event.currentTarget.getBoundingClientRect();
      onNodeClick(node.id, {
        x: rect.left + rect.width / 2,
        y: rect.top,
      });
    };

    const handleScroll = () => {
      if (timelineRef.current) {
        const scrollLeft = timelineRef.current.scrollLeft;
        const scrollWidth = timelineRef.current.scrollWidth;
        const clientWidth = timelineRef.current.clientWidth;
        const maxScroll = scrollWidth - clientWidth;
        const scrollPercentage =
          maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0;
        setScrollPosition(scrollPercentage);
      }
    };

    // 마우스 휠 이벤트 핸들러 - 줌 로직 안정화
    useEffect(() => {
      const timeline = timelineRef.current;
      if (!timeline) return;

      const onWheel = (e: WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          e.stopPropagation();

          // 1. 현재 상태 캡처
          const rect = timeline.getBoundingClientRect();
          const mouseX = e.clientX - rect.left; // 컨테이너 내 마우스 X 좌표
          const currentScrollLeft = timeline.scrollLeft;
          
          // 2. 줌 변경량 계산
          const delta = -e.deltaY * 0.001;
          
          setZoom((prevZoom) => {
            const newZoom = Math.max(0.25, Math.min(maxZoom, prevZoom + delta));
            
            // 3. 줌 비율 (몇 배 커졌/작아졌는지)
            const zoomFactor = newZoom / prevZoom;

            // 4. 새로운 스크롤 위치 계산 (핵심 공식)
            // (현재 보고 있는 지점) * 비율 - (마우스 위치 보정)
            // 논리: 마우스가 가리키는 실제 데이터 지점은 변하지 않아야 함
            const newScrollLeft = (currentScrollLeft + mouseX) * zoomFactor - mouseX;

            // 5. 즉시 적용 (requestAnimationFrame 제거 - 동기화 문제 방지)
            if (timeline) {
                timeline.scrollLeft = newScrollLeft;
            }

            return newZoom;
          });
        }
      };

      timeline.addEventListener("wheel", onWheel, { passive: false });
      timeline.addEventListener("scroll", handleScroll);

      const preventGesture = (e: Event) => e.preventDefault();
      timeline.addEventListener("gesturestart", preventGesture);
      timeline.addEventListener("gesturechange", preventGesture);
      timeline.addEventListener("gestureend", preventGesture);

      return () => {
        timeline.removeEventListener("wheel", onWheel);
        timeline.removeEventListener("scroll", handleScroll);
        timeline.removeEventListener("gesturestart", preventGesture);
        timeline.removeEventListener("gesturechange", preventGesture);
        timeline.removeEventListener("gestureend", preventGesture);
      };
    }, [maxZoom]);

    const getDateFromPosition = (position: number) => {
      const daysOffset = (position / 100) * totalDays;
      const resultDate = new Date(startDate);
      resultDate.setDate(resultDate.getDate() + daysOffset);
      const year = resultDate.getFullYear();
      const month = String(resultDate.getMonth() + 1).padStart(2, "0");
      return `${year}/${month}`;
    };

    const getVisibleRange = () => {
      if (!timelineRef.current) {
        return {
          left: getDateFromPosition(0),
          right: getDateFromPosition(100),
        };
      }
      const scrollLeft = timelineRef.current.scrollLeft;
      const scrollWidth = timelineRef.current.scrollWidth;
      const clientWidth = timelineRef.current.clientWidth;
      const startPercentage = (scrollLeft / scrollWidth) * 100;
      const endPercentage = ((scrollLeft + clientWidth) / scrollWidth) * 100;

      return {
        left: getDateFromPosition(startPercentage),
        right: getDateFromPosition(endPercentage),
      };
    };

    const visibleRange = getVisibleRange();

    const clusterNodes = (nodes: typeof allNodes) => {
      const sorted = [...nodes].sort((a, b) => a.position - b.position);
      const clusters: Array<{
        id: number;
        centerPosition: number;
        nodes: typeof allNodes;
      }> = [];

      const clusterThreshold = 0.5 / zoom;
      let currentCluster: typeof allNodes = [];
      let clusterId = 0;

      sorted.forEach((node, index) => {
        if (currentCluster.length === 0) {
          currentCluster.push(node);
        } else {
          const lastNode = currentCluster[currentCluster.length - 1];
          const distance = Math.abs(node.position - lastNode.position);

          if (distance <= clusterThreshold) {
            currentCluster.push(node);
          } else {
            const centerPos =
              currentCluster.reduce((sum, n) => sum + n.position, 0) /
              currentCluster.length;
            clusters.push({
              id: clusterId++,
              centerPosition: centerPos,
              nodes: [...currentCluster],
            });
            currentCluster = [node];
          }
        }
        if (index === sorted.length - 1 && currentCluster.length > 0) {
          const centerPos =
            currentCluster.reduce((sum, n) => sum + n.position, 0) /
            currentCluster.length;
          clusters.push({
            id: clusterId++,
            centerPosition: centerPos,
            nodes: [...currentCluster],
          });
        }
      });
      return clusters;
    };

    const clusters = clusterNodes(allNodes);

    const getNodeOffset = (
      clusterSize: number,
      index: number,
      isHovered: boolean
    ) => {
      if (clusterSize === 1) return { x: 0, y: 0 };
      const baseRadius = isHovered ? 28 : 10;
      const radius = baseRadius + (clusterSize > 6 ? (clusterSize - 6) * 2 : 0);
      const angle = (index / clusterSize) * Math.PI * 2 - Math.PI / 2;
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      };
    };

    const getNodeClusterInfo = (nodeId: number | string) => {
      for (const cluster of clusters) {
        const nodeIndex = cluster.nodes.findIndex((n) => n.id === nodeId);
        if (nodeIndex !== -1) {
          return {
            cluster,
            indexInCluster: nodeIndex,
            totalInCluster: cluster.nodes.length,
          };
        }
      }
      return null;
    };

    const getMonthMarkers = () => {
      const markers = [];
      let currentDate = new Date(startDate);
      currentDate.setDate(1);

      if (currentDate < startDate) {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      const visibleDays = getVisibleDays();
      let monthStep = 1;
      if (visibleDays > 3000) monthStep = 12;
      else if (visibleDays > 1800) monthStep = 3;

      while (currentDate <= endDate) {
        const daysSinceStart =
          (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        const position = (daysSinceStart / totalDays) * 100;
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        const isJanuary = month === 1;
        const shouldShowMonth = (month - 1) % monthStep === 0;

        if (position >= 0 && position <= 100) {
          if (shouldShowMonth) {
            markers.push({
              position,
              label: isJanuary ? `${year}년` : `${month}월`,
              monthOnly: isJanuary ? `${year}년` : `${month}월`,
              isYear: isJanuary,
            });
          }
        }
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      return markers;
    };

    const monthMarkers = getMonthMarkers();

    const getDateLabels = () => {
      const visibleDays = getVisibleDays();
      const labels = [];
      if (visibleDays > 900) return [];

      let step = 1;
      if (visibleDays > 600) step = 14;
      else if (visibleDays > 450) step = 10;
      else if (visibleDays > 300) step = 7;
      else if (visibleDays > 200) step = 3;
      else if (visibleDays > 150) step = 2;
      else step = 1;

      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const daysSinceStart =
          (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        const position = (daysSinceStart / totalDays) * 100;
        const day = currentDate.getDate();

        if (position >= 0 && position <= 100) {
          labels.push({
            position,
            day,
            type: step === 1 ? "daily" : "sparse",
            showLabel: true,
          });
        }
        currentDate.setDate(currentDate.getDate() + step);
      }
      return labels;
    };

    const dateLabels = getDateLabels();

    const scrollToDate = (date: Date) => {
      const daysSinceStart =
        (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      const scrollPercentage = (daysSinceStart / totalDays) * 100;
      if (timelineRef.current) {
        const maxScroll =
          timelineRef.current.scrollWidth - timelineRef.current.clientWidth;
        timelineRef.current.scrollLeft = (scrollPercentage / 100) * maxScroll;
      }
    };

    useImperativeHandle(ref, () => ({
      scrollToDate,
    }));

    return (
      <div className="relative w-full px-16 py-16 pb-24">
        {/* Scroll Indicators */}
        <div className="absolute left-16 top-8">
          <span
            className="block border border-black bg-[#F2F0EB] px-3 py-2"
            style={{
              fontFamily: "'JetBrains Mono', 'Pretendard', monospace",
              fontSize: "16px",
              fontWeight: "normal",
            }}
          >
            {visibleRange.left}
          </span>
        </div>

        {/* Zoom Hint */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
          <div className="w-8 h-0.5 bg-black" />
          <span
            style={{
              fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
              fontSize: "11px",
              fontWeight: "normal",
              whiteSpace: "nowrap",
            }}
          >
            CTRL + SCROLL TO ZOOM
          </span>
          <div className="w-8 h-0.5 bg-black" />
        </div>

        <div className="absolute right-16 top-8">
          <span
            className="block border border-black bg-[#F2F0EB] px-3 py-2"
            style={{
              fontFamily: "'JetBrains Mono', 'Pretendard', monospace",
              fontSize: "16px",
              fontWeight: "normal",
            }}
          >
            {visibleRange.right}
          </span>
        </div>

        {/* Timeline Container */}
        <div
          ref={timelineRef}
          className="relative w-full h-60 overflow-x-auto overflow-y-hidden timeline-container"
        >
          <div
            className="relative h-full"
            style={{ width: `${400 * zoom}%`, minWidth: `${400 * zoom}%` }}
          >
            {/* Main Ruler Line */}
            <div
              className="absolute w-full h-1 bg-black"
              style={{ top: "50%", transform: "translateY(-50%)" }}
            >
              {/* Month Markers */}
              {monthMarkers.map((marker, index) => (
                <div
                  key={`month-${index}`}
                  className="absolute"
                  style={{
                    left: `${marker.position}%`,
                    top: "-50%",
                    transform: "translateY(-50%)",
                    zIndex: marker.isYear ? 2 : 1,
                  }}
                >
                  <div
                    className="bg-black"
                    style={{
                      width: marker.isYear ? "4px" : "2px",
                      height: marker.isYear ? "60px" : "36px",
                      position: "absolute",
                      bottom: "0",
                      left: "0",
                    }}
                  />
                  <span
                    className="absolute"
                    style={{
                      left: "8px",
                      bottom: marker.isYear ? "42px" : "22px",
                      fontFamily: "'JetBrains Mono', 'Pretendard', monospace",
                      fontSize: marker.isYear ? "18px" : "15px",
                      fontWeight: "normal",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {marker.monthOnly}
                  </span>
                </div>
              ))}

              {/* Date Ticks */}
              {dateLabels.map((label, index) => (
                <div key={`date-tick-${index}`}>
                  <div
                    className="absolute bg-black"
                    style={{
                      left: `${label.position}%`,
                      width: "1px",
                      height: label.type === "daily" ? "14px" : "20px",
                      top: "-6px",
                    }}
                  />
                  {label.showLabel && (
                    <span
                      className="absolute"
                      style={{
                        left: `${label.position}%`,
                        top: "-20px",
                        transform: "translateX(-50%)",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "12px",
                        color: label.day === 1 ? "black" : "#000000",
                        fontWeight: label.day === 1 ? "bold" : "normal",
                      }}
                    >
                      {label.day}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Vertical Lines */}
            {allNodes.map((node) => (
              <div
                key={`vline-${node.id}`}
                className={`absolute bg-black transition-opacity duration-300 ${
                  selectedNodeId === node.id ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  left: `${node.position}%`,
                  width: "2px",
                  height: "100vh",
                  bottom: "50%",
                  zIndex: 0,
                }}
              />
            ))}

            {/* Data Nodes */}
            {allNodes.map((node) => {
              const nodeData = nodesById.get(node.id);
              if (!nodeData) return null;
              const nodeTag = nodeData.tags[0];

              const isSearching = searchQuery.trim().length > 0;
              const isMatched = matchedNodeIds.has(node.id);
              const shouldDim = isSearching && !isMatched;
              const shouldHighlight = isSearching && isMatched;

              const clusterInfo = getNodeClusterInfo(node.id);
              const offset = clusterInfo
                ? getNodeOffset(
                    clusterInfo.totalInCluster,
                    clusterInfo.indexInCluster,
                    hoveredCluster === clusterInfo.cluster.id
                  )
                : { x: 0, y: 0 };

              const displayPosition = clusterInfo
                ? clusterInfo.cluster.centerPosition
                : node.position;
              const isSelected = selectedNodeId === node.id;

              return (
                <div
                  key={node.id}
                  className="absolute cursor-pointer z-10"
                  style={{
                    left: `${displayPosition}%`,
                    top: "50%",
                    transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                    opacity: shouldDim ? 0.2 : 1,
                    transition: "all 0.3s ease",
                  }}
                  onClick={(e) => handleNodeClick(e, node)}
                  onMouseEnter={(e) => {
                    if (clusterInfo) setHoveredCluster(clusterInfo.cluster.id);
                    setHoveredNodeId(node.id);
                  }}
                  onMouseLeave={() => {
                    setHoveredCluster(null);
                    setHoveredNodeId(null);
                  }}
                >
                  <div
                    className="w-4 h-4 transition-all"
                    style={{
                      borderRadius: "50%",
                      backgroundColor: nodeTag?.tag_color || "#F2F0EB",
                      border: shouldHighlight
                        ? "3px solid black"
                        : isSelected
                        ? "3px solid black"
                        : "2px solid black",
                      boxShadow: isSelected
                        ? "0 0 0 3px rgba(0, 0, 0, 0.3)"
                        : "none",
                      transform:
                        hoveredNodeId === node.id ? "scale(2.5)" : "scale(1)",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Hover Tooltip */}
        {hoveredNodeId !== null &&
          (() => {
            const node = allNodes.find((n) => n.id === hoveredNodeId);
            const nodeData = nodesById.get(hoveredNodeId);

            if (!node || !nodeData || !timelineRef.current) return null;

            const nodeTag = nodeData.tags[0];
            const nodeDate = new Date(nodeData.date);

            const clusterInfo = getNodeClusterInfo(node.id);
            const offset = clusterInfo
              ? getNodeOffset(
                  clusterInfo.totalInCluster,
                  clusterInfo.indexInCluster,
                  hoveredCluster === clusterInfo.cluster.id
                )
              : { x: 0, y: 0 };

            const displayPosition = clusterInfo
              ? clusterInfo.cluster.centerPosition
              : node.position;

            // 실시간 좌표 계산
            const container = timelineRef.current;
            const rect = container.getBoundingClientRect();
            const scrollLeft = container.scrollLeft;
            const totalContentWidth = rect.width * 4 * zoom;

            const currentX =
              rect.left +
              totalContentWidth * (displayPosition / 100) -
              scrollLeft +
              offset.x;
            const currentY = rect.top + rect.height / 2 + offset.y;

            const nodeRadius = 20;
            const lineStartY = currentY + nodeRadius;

            return (
              <>
                <div
                  className="fixed bg-black pointer-events-none animate-fadeIn"
                  style={{
                    left: `${currentX}px`,
                    top: `${lineStartY}px`,
                    bottom: "80px",
                    width: "2px",
                    zIndex: 999, // 정보창(1000)
                  }}
                />
                <div
                  className="fixed border border-black bg-[#F2F0EB] px-3 py-2 pointer-events-none animate-fadeIn"
                  style={{
                    left: `${currentX}px`,
                    bottom: "80px",
                    transform: "translateX(-50%)",
                    fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                    fontSize: "12px",
                    zIndex: 1000,
                    minWidth: "200px",
                    maxWidth: "250px",
                  }}
                >
                  {nodeData.date && (
                    <div className="mb-1">
                      <span
                        style={{
                          fontWeight: "bold",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {nodeDate.getFullYear()}/
                        {String(nodeDate.getMonth() + 1).padStart(2, "0")}/
                        {String(nodeDate.getDate()).padStart(2, "0")}
                      </span>
                      {(nodeDate.getHours() !== 0 ||
                        nodeDate.getMinutes() !== 0) && (
                        <span>
                          {" "}
                          {String(nodeDate.getHours()).padStart(2, "0")}:
                          {String(nodeDate.getMinutes()).padStart(2, "0")}
                        </span>
                      )}
                    </div>
                  )}
                  {nodeTag && (
                    <div className="mb-1 flex items-center gap-1">
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          backgroundColor: nodeTag.tag_color,
                          border: "1px solid black",
                        }}
                      />
                      <span>{nodeTag.tag_name}</span>
                    </div>
                  )}
                  {nodeData.description && (
                    <div
                      className="mt-1 pt-1"
                      style={{
                        borderTop: "1px solid black",
                        lineHeight: "1.4",
                      }}
                    >
                      {nodeData.description.length > 60
                        ? `${nodeData.description.substring(0, 60)}...`
                        : nodeData.description}
                    </div>
                  )}
                </div>
              </>
            );
          })()}
      </div>
    );
  }
);