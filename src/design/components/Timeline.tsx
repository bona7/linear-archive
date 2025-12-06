import { useState, useRef, useEffect, forwardRef, useImperativeHandle, useMemo } from "react";

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

interface TimelineProps {
  onNodeClick: (nodeId: number, position: { x: number; y: number }) => void;
  selectedNodeId: number | null;
  nodeDataMap: Record<number, NodeData>;
  searchQuery: string;
  matchedNodeIds: Set<number>;
}

export const Timeline = forwardRef<{ scrollToDate: (date: Date) => void }, TimelineProps>(
  ({ onNodeClick, selectedNodeId, nodeDataMap, searchQuery, matchedNodeIds }, ref) => {
    const [scrollPosition, setScrollPosition] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [hoveredCluster, setHoveredCluster] = useState<number | null>(null);
    const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null);
    const [hoveredNodePosition, setHoveredNodePosition] = useState<{ x: number; y: number } | null>(null);
    const timelineRef = useRef<HTMLDivElement>(null);
    const pendingZoomAdjustment = useRef<{ mouseX: number; previousZoom: number } | null>(null);
    // [추가] 1. 데이터에 따라 시작일(가장 오래된 날짜)과 종료일(오늘) 자동 계산
    const { startDate, endDate } = useMemo(() => {
      const today = new Date();
      // 오늘 날짜의 끝(23시 59분)까지 포함
      today.setHours(23, 59, 59, 999);

      // 데이터 노드들에서 날짜만 뽑아내기
      const nodes = Object.values(nodeDataMap);
      const dates = nodes
        .map(node => node.date)
        .filter((date): date is Date => date !== undefined);

      // 하드코딩된 예시 데이터(dataNodes)의 날짜는 없다고 가정하고, 
      // 실제 데이터가 없으면 '오늘로부터 3개월 전'을 기본값으로 씀
      if (dates.length === 0) {
        const defaultStart = new Date(today);
        defaultStart.setMonth(today.getMonth() - 3);
        return { startDate: defaultStart, endDate: today };
      }

      // 가장 오래된 날짜 찾기
      const oldestDate = new Date(Math.min(...dates.map(d => d.getTime())));

      // [디자인 팁] 가장 오래된 날짜보다 7일 정도 여유를 둬서 왼쪽 벽에 딱 붙지 않게 함
      const adjustedStart = new Date(oldestDate);
      adjustedStart.setDate(adjustedStart.getDate() - 7);

      return { startDate: adjustedStart, endDate: today };
    }, [nodeDataMap]);

    // [추가] 2. 전체 기간(일수) 계산 - 이걸 기준으로 비율을 나눕니다
    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

    // Data nodes with different geometric shapes and positions
    // Extended data across longer timeline
    const dataNodes = [
      { id: 1, type: 'circle', position: 5, label: 'Project Alpha' },
      { id: 2, type: 'square', position: 12, label: 'Release 1.0' },
      { id: 3, type: 'circle', position: 18, label: 'Milestone' },
      { id: 4, type: 'square', position: 25, label: 'Update 2.0' },
      { id: 5, type: 'circle', position: 35, label: 'Phase 3' },
      { id: 6, type: 'square', position: 42, label: 'Beta Launch' },
      { id: 7, type: 'circle', position: 50, label: 'Version 3.0' },
      { id: 8, type: 'square', position: 58, label: 'Expansion' },
      { id: 9, type: 'circle', position: 67, label: 'Update 4.0' },
      { id: 10, type: 'square', position: 75, label: 'Phase 5' },
      { id: 11, type: 'circle', position: 82, label: 'Milestone 6' },
      { id: 12, type: 'square', position: 90, label: 'Final Release' },
    ];

    // Convert date to position percentage
    const dateToPosition = (date: Date) => {
      // [수정] 고정 날짜 삭제하고 계산된 변수 사용
      const daysSinceStart = (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      // 전체 기간 대비 며칠이나 지났는지 백분율 계산
      return Math.max(0, Math.min(100, (daysSinceStart / totalDays) * 100));
    };

    // Combine default nodes with dynamic nodes from nodeDataMap
    const allNodes = [
      ...dataNodes,
      ...Object.values(nodeDataMap)
        .filter(node => node.date && !dataNodes.find(n => n.id === node.id))
        .map(node => ({
          id: node.id,
          type: node.tag?.name || 'circle',
          position: dateToPosition(node.date!),
          label: node.title || 'New Archive',
        }))
    ];

    const handleNodeClick = (event: React.MouseEvent, node: { id: number; position: number }) => {
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
        const scrollPercentage = maxScroll > 0 ? (scrollLeft / maxScroll) * 100 : 0;
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
          e.preventDefault(); // 🚨 핵심: 브라우저 전체 페이지 확대 방지
          e.stopPropagation();

          // 마우스 위치 계산
          const rect = timeline.getBoundingClientRect();
          const mouseX = e.clientX - rect.left + timeline.scrollLeft;

          // 줌 속도 조절 (숫자가 작을수록 부드럽게 변함)
          const delta = -e.deltaY * 0.001;

          setZoom(prev => {
            // 최소 스케일을 0.25로 변경 (400% 너비를 한 화면에 보려면 0.25배 필요)
            // 최대 스케일은 5배
            const newZoom = Math.max(0.25, Math.min(5, prev + delta));

            // 줌 변경 후 마우스 포인터 위치 유지를 위한 계산 값 저장
            pendingZoomAdjustment.current = {
              mouseX,
              previousZoom: prev
            };

            return newZoom;
          });
        }
      };

      // wheel 이벤트에 { passive: false } 옵션을 줘야 preventDefault가 작동합니다.
      timeline.addEventListener('wheel', onWheel, { passive: false });
      timeline.addEventListener('scroll', handleScroll);

      // 모바일/트랙패드 제스처 확대 방지
      const preventGesture = (e: Event) => e.preventDefault();
      timeline.addEventListener('gesturestart', preventGesture);
      timeline.addEventListener('gesturechange', preventGesture);
      timeline.addEventListener('gestureend', preventGesture);

      // 뒷정리 (Component가 사라질 때 이벤트도 같이 삭제)
      return () => {
        timeline.removeEventListener('wheel', onWheel);
        timeline.removeEventListener('scroll', handleScroll);
        timeline.removeEventListener('gesturestart', preventGesture);
        timeline.removeEventListener('gesturechange', preventGesture);
        timeline.removeEventListener('gestureend', preventGesture);
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
      const month = String(resultDate.getMonth() + 1).padStart(2, '0');
      return `${year}/${month}`;
    };

    // Calculate visible range (left and right edges of viewport)
    const getVisibleRange = () => {
      // 아직 타임라인이 준비되지 않았을 때는 시작일~종료일 표시 (안전장치)
      if (!timelineRef.current) {
        return { 
          left: getDateFromPosition(0), 
          right: getDateFromPosition(100) 
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
        right: getDateFromPosition(endPercentage)
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
            const centerPos = currentCluster.reduce((sum, n) => sum + n.position, 0) / currentCluster.length;
            clusters.push({
              id: clusterId++,
              centerPosition: centerPos,
              nodes: [...currentCluster]
            });
            currentCluster = [node];
          }
        }

        // Handle last cluster
        if (index === sorted.length - 1 && currentCluster.length > 0) {
          const centerPos = currentCluster.reduce((sum, n) => sum + n.position, 0) / currentCluster.length;
          clusters.push({
            id: clusterId++,
            centerPosition: centerPos,
            nodes: [...currentCluster]
          });
        }
      });

      return clusters;
    };

    const clusters = clusterNodes(allNodes);

    // Calculate node offset within a cluster (pinwheel pattern)
    const getNodeOffset = (clusterSize: number, index: number, isHovered: boolean) => {
      if (clusterSize === 1) return { x: 0, y: 0 };

      // Radius: small when not hovered, large when hovered for easy clicking
      const baseRadius = isHovered ? 28 : 10;
      const radius = baseRadius + (clusterSize > 6 ? (clusterSize - 6) * 2 : 0);

      // Distribute nodes evenly in a circle (pinwheel pattern)
      const angle = (index / clusterSize) * Math.PI * 2 - Math.PI / 2; // Start from top

      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      };
    };

    // Get cluster index and position within cluster for a node
    const getNodeClusterInfo = (nodeId: number) => {
      for (const cluster of clusters) {
        const nodeIndex = cluster.nodes.findIndex(n => n.id === nodeId);
        if (nodeIndex !== -1) {
          return {
            cluster,
            indexInCluster: nodeIndex,
            totalInCluster: cluster.nodes.length
          };
        }
      }
      return null;
    };

    // Calculate month markers
    const getMonthMarkers = () => {
      const markers = [];
      // [수정] 시작 날짜를 기준으로 루프 시작
      let currentDate = new Date(startDate);

      // 날짜를 1일로 맞춤 (월별 마커를 정확히 찍기 위해)
      currentDate.setDate(1);

      // 만약 시작일이 10월 15일이면, 10월 1일은 과거니까 11월 1일부터 마커를 찍기 시작
      if (currentDate < startDate) {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      while (currentDate <= endDate) {
        const daysSinceStart = (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        const position = (daysSinceStart / totalDays) * 100;

        const monthName = `${currentDate.getMonth() + 1}월`;
        const year = currentDate.getFullYear();

        // 범위(0~100%) 안에 있을 때만 표시
        if (position >= 0 && position <= 100) {
          markers.push({
            position,
            label: `${year}년 ${monthName}`,
            monthOnly: monthName,
          });
        }

        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      return markers;
    };

    const monthMarkers = getMonthMarkers();

    // Calculate date labels for tick marks (every 7 days)
    const getDateLabels = () => {
      const labels = [];
      // [수정] 시작 날짜 기준
      let currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const daysSinceStart = (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        const position = (daysSinceStart / totalDays) * 100;

        labels.push({
          position,
          day: currentDate.getDate(),
        });

        // Move to next week (7 days)
        currentDate.setDate(currentDate.getDate() + 7);
      }

      return labels;
    };

    const dateLabels = getDateLabels();

    // Function to scroll to a specific date
    const scrollToDate = (date: Date) => {
      // [수정] 전체 기간 대비 비율 계산
      const daysSinceStart = (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      const scrollPercentage = (daysSinceStart / totalDays) * 100;

      if (timelineRef.current) {
        const maxScroll = timelineRef.current.scrollWidth - timelineRef.current.clientWidth;
        timelineRef.current.scrollLeft = (scrollPercentage / 100) * maxScroll;
      }
    };

    useImperativeHandle(ref, () => ({
      scrollToDate
    }));

    return (
      <div className="relative w-full px-16 py-16 pb-24">
        {/* Scroll Indicators - Dynamic Dates */}
        <div className="absolute left-16 top-8">
          <span className="block border border-black bg-[#F2F0EB] px-3 py-2" style={{ fontFamily: 'SF Mono, Menlo, Monaco, Consolas, monospace', fontSize: '16px' }}>
            {visibleRange.left}
          </span>
        </div>

        {/* Horizontal Scroll Hint - Center */}
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
          <div className="w-8 h-0.5 bg-black" />
          <span style={{ fontFamily: 'SF Mono, Menlo, Monaco, Consolas, monospace', fontSize: '11px' }}>SCROLL</span>
          <div className="w-8 h-0.5 bg-black" />
        </div>

        <div className="absolute right-16 top-8">
          <span className="block border border-black bg-[#F2F0EB] px-3 py-2" style={{ fontFamily: 'SF Mono, Menlo, Monaco, Consolas, monospace', fontSize: '16px' }}>
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
          <div className="relative h-full" style={{ width: `${400 * zoom}%`, minWidth: `${400 * zoom}%` }}>
            {/* Main Ruler Line */}
            <div className="absolute w-full h-0.5 bg-black" style={{ top: '50%', transform: 'translateY(-50%)' }}>
              {/* Month Markers - Thick vertical lines */}
              {monthMarkers.map((marker, index) => (
                <div
                  key={`month-${index}`}
                  className="absolute"
                  style={{
                    left: `${marker.position}%`,
                    top: '-50%',
                    transform: 'translateY(-50%)',
                  }}
                >
                  {/* Vertical line for month boundary */}
                  <div
                    className="bg-black"
                    style={{
                      width: '2px',
                      height: '40px',
                      position: 'absolute',
                      bottom: '0',
                      left: '0',
                    }}
                  />
                  {/* Month label */}
                  <span
                    className="absolute"
                    style={{
                      left: '6px',
                      bottom: '32px',
                      fontFamily: 'SF Mono, Menlo, Monaco, Consolas, monospace',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {marker.monthOnly}
                  </span>
                </div>
              ))}

              {/* Extended Tick Marks */}
              {Array.from({ length: 97 }).map((_, i) => {
                return (
                  <div
                    key={`tick-${i}`}
                    className="absolute bg-black"
                    style={{
                      left: `${(i / 96) * 100}%`,
                      width: '1px',
                      height: '12px',
                      top: '-6px',
                    }}
                  />
                );
              })}

              {/* Date Labels - Every 7 days */}
              {dateLabels.map((label, index) => (
                <span
                  key={`date-label-${index}`}
                  className="absolute"
                  style={{
                    left: `${label.position}%`,
                    top: '-20px',
                    transform: 'translateX(-50%)',
                    fontFamily: 'SF Mono, Menlo, Monaco, Consolas, monospace',
                    fontSize: '13px',
                  }}
                >
                  {label.day}
                </span>
              ))}
            </div>

            {/* Vertical Lines - Extended to full viewport height */}
            {allNodes.map((node) => (
              <div
                key={`vline-${node.id}`}
                className={`absolute bg-black transition-opacity duration-300 ${selectedNodeId === node.id ? 'opacity-100' : 'opacity-0'
                  }`}
                style={{
                  left: `${node.position}%`,
                  width: '2px',
                  height: '100vh',
                  bottom: '50%',
                  zIndex: 0,
                }}
              />
            ))}

            {/* Data Nodes */}
            {allNodes.map((node) => {
              const nodeData = nodeDataMap[node.id];
              const nodeTag = nodeData?.tag;

              // Search filtering
              const isSearching = searchQuery.trim().length > 0;
              const isMatched = matchedNodeIds.has(node.id);
              const shouldDim = isSearching && !isMatched;
              const shouldHighlight = isSearching && isMatched;

              // Get cluster info for this node
              const clusterInfo = getNodeClusterInfo(node.id);
              const offset = clusterInfo
                ? getNodeOffset(clusterInfo.totalInCluster, clusterInfo.indexInCluster, hoveredCluster === clusterInfo.cluster.id)
                : { x: 0, y: 0 };

              const displayPosition = clusterInfo ? clusterInfo.cluster.centerPosition : node.position;
              const isSelected = selectedNodeId === node.id;

              return (
                <div
                  key={node.id}
                  className="absolute cursor-pointer z-10"
                  style={{
                    left: `${displayPosition}%`,
                    top: '50%',
                    transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                    opacity: shouldDim ? 0.2 : 1,
                    transition: 'all 0.3s ease',
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
                      y: rect.top + rect.height / 2 // Center Y position
                    });
                  }}
                  onMouseLeave={() => {
                    setHoveredCluster(null);
                    setHoveredNodeId(null);
                    setHoveredNodePosition(null);
                  }}
                >
                  {/* Node Shape - Always Circle, styled by tag color */}
                  <div
                    className="w-4 h-4 transition-all"
                    style={{
                      borderRadius: '50%',
                      backgroundColor: nodeTag?.color || '#F2F0EB',
                      border: shouldHighlight ? '3px solid black' : isSelected ? '3px solid black' : '2px solid black',
                      boxShadow: isSelected ? '0 0 0 3px rgba(0, 0, 0, 0.3)' : 'none',
                      transform: hoveredNodeId === node.id ? 'scale(2.5)' : 'scale(1)',
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Hover Tooltip - Fixed at bottom, outside timeline container */}
        {hoveredNodeId !== null && hoveredNodePosition && (() => {
          const nodeData = nodeDataMap[hoveredNodeId];
          const nodeTag = nodeData?.tag;

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
                  width: '2px',
                  height: lineHeight,
                  zIndex: 999,
                }}
              />

              {/* Tooltip Box at bottom - Animated */}
              <div
                className="fixed border border-black bg-[#F2F0EB] px-3 py-2 pointer-events-none animate-fadeIn"
                style={{
                  left: `${hoveredNodePosition.x}px`,
                  bottom: '80px',
                  transform: 'translateX(-50%)',
                  fontFamily: 'SF Mono, Menlo, Monaco, Consolas, monospace',
                  fontSize: '12px',
                  zIndex: 1000,
                  minWidth: '200px',
                  maxWidth: '250px',
                }}
              >
                {/* Date */}
                {nodeData?.date && (
                  <div className="mb-1">
                    <span style={{ fontWeight: 'bold' }}>
                      {nodeData.date.getFullYear()}/{String(nodeData.date.getMonth() + 1).padStart(2, '0')}/{String(nodeData.date.getDate()).padStart(2, '0')}
                    </span>
                    {/* Time if hours/minutes are set */}
                    {(nodeData.date.getHours() !== 0 || nodeData.date.getMinutes() !== 0) && (
                      <span>
                        {' '}{String(nodeData.date.getHours()).padStart(2, '0')}:{String(nodeData.date.getMinutes()).padStart(2, '0')}
                      </span>
                    )}
                  </div>
                )}

                {/* Tag */}
                {nodeTag && (
                  <div className="mb-1 flex items-center gap-1">
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: nodeTag.color,
                        border: '1px solid black',
                      }}
                    />
                    <span>{nodeTag.name}</span>
                  </div>
                )}

                {/* Description */}
                {nodeData?.description && (
                  <div
                    className="mt-1 pt-1"
                    style={{
                      borderTop: '1px solid black',
                      lineHeight: '1.4',
                    }}
                  >
                    {nodeData.description.length > 60
                      ? `${nodeData.description.substring(0, 60)}...`
                      : nodeData.description
                    }
                  </div>
                )}

                {/* Title if no description */}
                {!nodeData?.description && nodeData?.title && (
                  <div
                    className="mt-1 pt-1"
                    style={{
                      borderTop: '1px solid black',
                      lineHeight: '1.4',
                    }}
                  >
                    {nodeData.title}
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </div>
    );
  });