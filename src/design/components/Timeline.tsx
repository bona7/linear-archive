import {
  useState,
  useRef,
  useEffect,
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
  nodeDataMap: BoardWithTags[]; // This is the array of nodes
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
    const [zoom, setZoom] = useState(1);
    const [hoveredCluster, setHoveredCluster] = useState<
      number | string | null
    >(null);
    const [hoveredNodeId, setHoveredNodeId] = useState<number | string | null>(
      null
    );
    const [hoveredNodePosition, setHoveredNodePosition] = useState<{
      x: number;
      y: number;
    } | null>(null);
    const timelineRef = useRef<HTMLDivElement>(null);
    const pendingZoomAdjustment = useRef<{
      mouseX: number;
      previousZoom: number;
    } | null>(null);

    const nodesById = useMemo(() => {
      if (!Array.isArray(nodeDataMap)) return new Map();
      return new Map(nodeDataMap.map((node) => [node.board_id, node]));
    }, [nodeDataMap]);

    // [추가] 1. 데이터에 따라 시작일(가장 오래된 날짜)과 종료일(오늘) 자동 계산
    const { startDate, endDate } = useMemo(() => {
      const today = new Date();
      // 오늘 날짜의 끝(23시 59분)까지 포함
      today.setHours(23, 59, 59, 999);

      // 데이터 노드들에서 날짜만 뽑아내기
      const nodes = Array.from(nodesById.values());
      const dates = nodes
        .map((node) => new Date(node.date)) // node.date는 string이므로 Date 객체로 변환                              │
        .filter((date) => !isNaN(date.getTime()));

      // 하드코딩된 예시 데이터(dataNodes)의 날짜는 없다고 가정하고,
      // 실제 데이터가 없으면 '오늘로부터 3개월 전'을 기본값으로 씀
      if (dates.length === 0) {
        const defaultStart = new Date(today);
        defaultStart.setMonth(today.getMonth() - 3);
        return { startDate: defaultStart, endDate: today };
      }

      // 가장 오래된 날짜 찾기
      const oldestDate = new Date(Math.min(...dates.map((d) => d.getTime())));

      // [디자인 팁] 가장 오래된 날짜보다 7일 정도 여유를 둬서 왼쪽 벽에 딱 붙지 않게 함
      const adjustedStart = new Date(oldestDate);
      adjustedStart.setDate(adjustedStart.getDate() - 7);

      return { startDate: adjustedStart, endDate: today };
    }, [nodeDataMap]);
    // 현재 줌 레벨에서 화면에 보이는 총 일수 계산
    const getVisibleDays = () => {
      return totalDays / zoom;
    };

    // [추가] 2. 전체 기간(일수) 계산 - 이걸 기준으로 비율을 나눕니다
    const totalDays =
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

    // [추가] 데이터 기간에 맞춘 반응형 최대 줌 배율 계산
    const maxZoom = useMemo(() => {
      // 데이터가 너무 적을 때(예: 10일)를 대비해 최소 1배는 보장
      // 데이터가 많으면(예: 10년), 10일 단위까지 확대할 수 있도록 배율을 높임
      // 공식: 전체 기간 / 10일 (화면에 최소 10일은 보이게 제한)
      const calculatedMax = totalDays / 10;

      // 너무 과하거나 적지 않게 안전장치 (최소 1배 ~ 최대 100배)
      return Math.max(1, Math.min(100, calculatedMax));
    }, [totalDays]);

    // Convert date to position percentage
    const dateToPosition = (date: Date) => {
      // [수정] 고정 날짜 삭제하고 계산된 변수 사용
      const daysSinceStart =
        (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      // 전체 기간 대비 며칠이나 지났는지 백분율 계산
      return Math.max(0, Math.min(100, (daysSinceStart / totalDays) * 100));
    };

    // Combine default nodes with dynamic nodes from nodeDataMap
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

    // Adjust scroll position after zoom to keep mouse position stable
    useEffect(() => {
      if (!timelineRef.current || !pendingZoomAdjustment.current) return;

      const { mouseX, previousZoom } = pendingZoomAdjustment.current;
      const rect = timelineRef.current.getBoundingClientRect();
      const mouseViewportX = mouseX - timelineRef.current.scrollLeft;

      // Calculate the new scroll position to keep the same content under the mouse
      const zoomRatio = zoom / previousZoom;
      const newScrollLeft = mouseX * zoomRatio - mouseViewportX;

      timelineRef.current.scrollLeft = newScrollLeft;
      pendingZoomAdjustment.current = null;
    }, [zoom]);

    // Handle scroll event
    const handleScroll = () => {
      if (timelineRef.current) {
        const scrollLeft = timelineRef.current.scrollLeft;
        const scrollWidth = timelineRef.current.scrollWidth;
        const clientWidth = timelineRef.current.clientWidth;
        const maxScroll = scrollWidth - clientWidth;

        // Calculate scroll percentage (0-100)
        const scrollPercentage =
          maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0;
        setScrollPosition(scrollPercentage);
      }
    };

    // [수정된 useEffect] 브라우저 줌 방지 및 타임라인 확대/축소 로직
    useEffect(() => {
      const timeline = timelineRef.current;
      if (!timeline) return;

      const onWheel = (e: WheelEvent) => {
        // Ctrl(또는 Command) 키를 누른 상태에서만 줌 동작하도록 설정
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault(); // 브라우저 전체 페이지 확대 방지
          e.stopPropagation();

          // 마우스 위치 계산
          const rect = timeline.getBoundingClientRect();
          const mouseX = e.clientX - rect.left + timeline.scrollLeft;

          // 줌 속도 조절 (숫자가 작을수록 부드럽게 변함)
          const delta = -e.deltaY * 0.001;

          setZoom((prev) => {
            const newZoom = Math.max(0.25, Math.min(maxZoom, prev + delta)); // 👈 maxZoom 적용

            pendingZoomAdjustment.current = {
              mouseX,
              previousZoom: prev,
            };
            return newZoom;
          }); // }, [maxZoom]);
        }
      };

      // wheel 이벤트에 { passive: false } 옵션을 줘야 preventDefault가 작동합니다.
      timeline.addEventListener("wheel", onWheel, { passive: false });
      timeline.addEventListener("scroll", handleScroll);

      // 모바일/트랙패드 제스처 확대 방지
      const preventGesture = (e: Event) => e.preventDefault();
      timeline.addEventListener("gesturestart", preventGesture);
      timeline.addEventListener("gesturechange", preventGesture);
      timeline.addEventListener("gestureend", preventGesture);

      // 뒷정리 (Component가 사라질 때 이벤트도 같이 삭제)
      return () => {
        timeline.removeEventListener("wheel", onWheel);
        timeline.removeEventListener("scroll", handleScroll);
        timeline.removeEventListener("gesturestart", preventGesture);
        timeline.removeEventListener("gesturechange", preventGesture);
        timeline.removeEventListener("gestureend", preventGesture);
      };
    }, []);

    // Calculate date range based on scroll position
    const getDateFromPosition = (position: number) => {
      // [수정] 고정 날짜 삭제
      const daysOffset = (position / 100) * totalDays;

      const resultDate = new Date(startDate);
      resultDate.setDate(resultDate.getDate() + daysOffset);

      // YYYY/MM 형태로 변경 (예: 2025/01)
      const year = resultDate.getFullYear();
      const month = String(resultDate.getMonth() + 1).padStart(2, "0");
      return `${year}/${month}`;
    };

    // Calculate visible range (left and right edges of viewport)
    const getVisibleRange = () => {
      // 아직 타임라인이 준비되지 않았을 때는 시작일~종료일 표시 (안전장치)
      if (!timelineRef.current) {
        return {
          left: getDateFromPosition(0),
          right: getDateFromPosition(100),
        };
      }

      const scrollLeft = timelineRef.current.scrollLeft;
      const scrollWidth = timelineRef.current.scrollWidth;
      const clientWidth = timelineRef.current.clientWidth;

      // 수정: '스크롤바 위치'가 아니라 '전체 길이 대비 현재 위치'를 직접 계산하게 함
      const startPercentage = (scrollLeft / scrollWidth) * 100;
      const endPercentage = ((scrollLeft + clientWidth) / scrollWidth) * 100;

      return {
        left: getDateFromPosition(startPercentage),
        right: getDateFromPosition(endPercentage),
      };
    };

    const visibleRange = getVisibleRange();

    // Cluster nearby nodes to prevent overlap and create pinwheel patterns
    const clusterNodes = (nodes: typeof allNodes) => {
      // Sort nodes by position
      const sorted = [...nodes].sort((a, b) => a.position - b.position);

      const clusters: Array<{
        id: number;
        centerPosition: number;
        nodes: typeof allNodes;
      }> = [];

      // Cluster threshold: nodes within this distance are grouped together
      // Threshold should be small enough to separate different dates but group overlapping nodes
      const clusterThreshold = 0.5 / zoom; // At zoom 1x, nodes within 0.5% are clustered

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
            // Save current cluster and start new one
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

        // Handle last cluster
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

    // Calculate node offset within a cluster (pinwheel pattern)
    const getNodeOffset = (
      clusterSize: number,
      index: number,
      isHovered: boolean
    ) => {
      if (clusterSize === 1) return { x: 0, y: 0 };

      // Radius: small when not hovered, large when hovered for easy clicking
      const baseRadius = isHovered ? 28 : 10;
      const radius = baseRadius + (clusterSize > 6 ? (clusterSize - 6) * 2 : 0);

      // Distribute nodes evenly in a circle (pinwheel pattern)
      const angle = (index / clusterSize) * Math.PI * 2 - Math.PI / 2; // Start from top

      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      };
    };

    // Get cluster index and position within cluster for a node
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

    // [수정] 월/년 마커: 1개월 -> 3개월 -> 6개월 -> 1년 순으로 자연스럽게 축소
    const getMonthMarkers = () => {
      const markers = [];
      let currentDate = new Date(startDate);
      currentDate.setDate(1);

      if (currentDate < startDate) {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      const visibleDays = getVisibleDays();

      // [조건] 화면에 5년치(1800일) 이상이 한 번에 보일 때만 분기(3개월)로 줄임
      // 즉, 지금 데이터(약 1.5년) 수준에서는 웬만하면 항상 '매월' 표시됨
      let monthStep = 1;
      if (visibleDays > 1800) monthStep = 3;

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

    // [수정] 날짜 채우기: 3일, 2일, 1일 간격이 훨씬 빨리(저배율에서) 나타나도록 설정
    const getDateLabels = () => {
      const visibleDays = getVisibleDays();
      const labels = [];

      // [조건] 화면에 약 2.5년(900일) 이상 보이면 날짜 숨김
      // (이때는 위의 getMonthMarkers에 의해 '매월'은 표시되고 있음 -> 역전 해결)
      if (visibleDays > 900) return [];

      // [간격 결정] 숫자가 높을수록 더 넓은 화면에서 해당 간격이 나타남
      let step = 1;

      // 1. [10일 간격]: ~900일 (약 2.5년) 보일 때
      if (visibleDays > 450) step = 10;
      // 2. [7일 간격]: ~450일 (약 1.2년) 보일 때 (적당한 유지)
      else if (visibleDays > 250) step = 7;
      // 3. [3일 간격]: 🚨 ~250일 (약 8개월) 보이면 바로 진입! (기존보다 훨씬 빨라짐)
      else if (visibleDays > 150) step = 3;
      // 4. [2일 간격]: 🚨 ~150일 (약 5개월) 보이면 바로 진입!
      else if (visibleDays > 100) step = 2;
      // 5. [1일 간격]: ~100일 (약 3개월) 이하로 보이면 바로 매일 표시
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

    // Function to scroll to a specific date
    const scrollToDate = (date: Date) => {
      // [수정] 전체 기간 대비 비율 계산
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
        {/* Scroll Indicators - Dynamic Dates */}
        <div className="absolute left-16 top-8">
          <span
            className="block border border-black bg-[#F2F0EB] px-3 py-2"
            style={{
              fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
              fontSize: "16px",
            }}
          >
            {visibleRange.left}
          </span>
        </div>

        {/* Horizontal Scroll Hint - Center */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
          <div className="w-8 h-0.5 bg-black" />
          <span
            style={{
              fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
              fontSize: "11px",
            }}
          >
            SCROLL
          </span>
          <div className="w-8 h-0.5 bg-black" />
        </div>

        <div className="absolute right-16 top-8">
          <span
            className="block border border-black bg-[#F2F0EB] px-3 py-2"
            style={{
              fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
              fontSize: "16px",
            }}
          >
            {visibleRange.right}
          </span>
        </div>

        {/* Timeline Container - Scrollable */}
        <div
          ref={timelineRef}
          className="relative w-full h-48 overflow-x-auto overflow-y-hidden timeline-container"
          // onWheel={handleWheel}
        >
          {/* Extended Timeline Content - Dynamic width based on zoom */}
          <div
            className="relative h-full"
            style={{ width: `${400 * zoom}%`, minWidth: `${400 * zoom}%` }}
          >
            {/* Main Ruler Line */}
            <div
              className="absolute w-full h-0.5 bg-black"
              style={{ top: "50%", transform: "translateY(-50%)" }}
            >
              {/* Month Markers - Thick vertical lines */}
              {monthMarkers.map((marker, index) => (
                <div
                  key={`month-${index}`}
                  className="absolute"
                  style={{
                    left: `${marker.position}%`,
                    top: "-50%",
                    transform: "translateY(-50%)",
                    // zIndex: marker.isYear ? 2 : 1, // 년도가 월보다 위에 오게. optional
                  }}
                >
                  {/* 세로선: 년도 vs 월 구분 */}
                  <div
                    className="bg-black"
                    style={{
                      width: marker.isYear ? "2px" : "1px",
                      height: marker.isYear ? "40px" : "24px",
                      position: "absolute",
                      bottom: "0",
                      left: "0",
                    }}
                  />
                  {/* Month label */}
                  <span
                    className="absolute"
                    style={{
                      left: "6px",
                      bottom: marker.isYear ? "32px" : "16px",
                      fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                      fontSize: marker.isYear ? "14px" : "12px",
                      fontWeight: marker.isYear ? "bold" : "normal",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {marker.monthOnly}
                  </span>
                </div>
              ))}

              {/* [수정] 줌 레벨에 따라 동적으로 변하는 눈금과 날짜 */}
              {dateLabels.map((label, index) => (
                <div key={`date-tick-${index}`}>
                  {/* 세로선 (Tick): type에 따라 길이 조절 */}
                  <div
                    className="absolute bg-black"
                    style={{
                      left: `${label.position}%`,
                      width: "1px",
                      // daily는 짧게(8px), weekly는 조금 길게(12px)
                      height: label.type === "daily" ? "8px" : "12px",
                      top: "-6px",
                    }}
                  />

                  {/* 날짜 글씨: showLabel이 true일 때만 표시 */}
                  {label.showLabel && (
                    <span
                      className="absolute"
                      style={{
                        left: `${label.position}%`,
                        top: "-20px",
                        transform: "translateX(-50%)",
                        fontFamily:
                          "SF Mono, Menlo, Monaco, Consolas, monospace",
                        fontSize: "11px",
                        color: label.day === 1 ? "black" : "#666", // 1일은 진하게
                        fontWeight: label.day === 1 ? "bold" : "normal",
                      }}
                    >
                      {label.day}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Vertical Lines - Extended to full viewport height */}
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

              // Search filtering
              const isSearching = searchQuery.trim().length > 0;
              const isMatched = matchedNodeIds.has(node.id);
              const shouldDim = isSearching && !isMatched;
              const shouldHighlight = isSearching && isMatched;

              // Get cluster info for this node
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
                    if (clusterInfo) {
                      setHoveredCluster(clusterInfo.cluster.id);
                    }
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoveredNodeId(node.id);
                    setHoveredNodePosition({
                      x: rect.left + rect.width / 2,
                      y: rect.top + rect.height / 2, // Center Y position
                    });
                  }}
                  onMouseLeave={() => {
                    setHoveredCluster(null);
                    setHoveredNodeId(null);
                    setHoveredNodePosition(null);
                  }}
                >
                  {/* Node Shape - styled by tag color */}
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

        {/* Hover Tooltip - Fixed at bottom, outside timeline container */}
        {hoveredNodeId !== null &&
          hoveredNodePosition &&
          (() => {
            const nodeData = nodesById.get(hoveredNodeId);
            if (!nodeData) return null;

            const nodeTag = nodeData.tags[0];
            const nodeDate = new Date(nodeData.date);

            // Node radius when hovered (w-4 = 16px, scale 2.5 = 40px, radius = 20px)
            const nodeRadius = 20;
            const lineStartY = hoveredNodePosition.y + nodeRadius;
            const lineHeight = `calc(100vh - ${lineStartY}px - 140px)`;

            return (
              <>
                {/* Connection line from node to tooltip - Animated */}
                <div
                  className="fixed bg-black pointer-events-none animate-fadeIn"
                  style={{
                    left: `${hoveredNodePosition.x}px`,
                    top: `${lineStartY}px`,
                    width: "2px",
                    height: lineHeight,
                    zIndex: 999,
                  }}
                />

                {/* Tooltip Box at bottom - Animated */}
                <div
                  className="fixed border border-black bg-[#F2F0EB] px-3 py-2 pointer-events-none animate-fadeIn"
                  style={{
                    left: `${hoveredNodePosition.x}px`,
                    bottom: "80px",
                    transform: "translateX(-50%)",
                    fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                    fontSize: "12px",
                    zIndex: 1000,
                    minWidth: "200px",
                    maxWidth: "250px",
                  }}
                >
                  {/* Date */}
                  {nodeData.date && (
                    <div className="mb-1">
                      <span style={{ fontWeight: "bold" }}>
                        {nodeDate.getFullYear()}/
                        {String(nodeDate.getMonth() + 1).padStart(2, "0")}/
                        {String(nodeDate.getDate()).padStart(2, "0")}
                      </span>
                      {/* Time if hours/minutes are set */}
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

                  {/* Tag */}
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

                  {/* Description */}
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
