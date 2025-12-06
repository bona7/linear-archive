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
      if (!nodeDataMap) return new Map();
      return new Map(nodeDataMap.map((node) => [node.board_id, node]));
    }, [nodeDataMap]);

    // Convert date to position percentage
    const dateToPosition = (date: Date) => {
      const startDate = new Date(2024, 9, 1); // Oct 2024
      const endDate = new Date(2025, 11, 31); // Dec 2025
      const totalDays =
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      const daysSinceStart =
        (date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

      return Math.max(0, Math.min(100, (daysSinceStart / totalDays) * 100));
    };

    // Combine default nodes with dynamic nodes from nodeDataMap
    const allNodes = nodeDataMap
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

    // Zoom handling - Ctrl/Cmd + Scroll
    const handleZoom = (delta: number) => {
      setZoom((prev) => Math.max(0.5, Math.min(5, prev + delta)));
    };

    const handleWheel = (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation(); // Prevent event from bubbling up to prevent browser zoom

        if (!timelineRef.current) return;

        // Calculate mouse position relative to timeline content
        const rect = timelineRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left + timelineRef.current.scrollLeft;

        // Store the mouse position and current zoom for adjustment after zoom changes
        pendingZoomAdjustment.current = {
          mouseX,
          previousZoom: zoom,
        };

        handleZoom(-e.deltaY * 0.01);
      }
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

    useEffect(() => {
      const timeline = timelineRef.current;
      if (timeline) {
        timeline.addEventListener("scroll", handleScroll);

        // Prevent gesture-based zoom on Safari and other browsers
        const preventGesture = (e: Event) => {
          e.preventDefault();
        };

        timeline.addEventListener("gesturestart", preventGesture);
        timeline.addEventListener("gesturechange", preventGesture);
        timeline.addEventListener("gestureend", preventGesture);

        return () => {
          timeline.removeEventListener("scroll", handleScroll);
          timeline.removeEventListener("gesturestart", preventGesture);
          timeline.removeEventListener("gesturechange", preventGesture);
          timeline.removeEventListener("gestureend", preventGesture);
        };
      }
    }, []);

    // Calculate date range based on scroll position
    // Timeline spans from Oct 2024 to Dec 2025 (14 months)
    const getDateFromPosition = (position: number) => {
      const startDate = new Date(2024, 9, 1); // Oct 2024
      const totalMonths = 14;
      const monthsOffset = (position / 100) * totalMonths;

      const resultDate = new Date(startDate);
      resultDate.setMonth(resultDate.getMonth() + monthsOffset);

      return resultDate
        .toLocaleDateString("en-US", { month: "short", year: "numeric" })
        .toUpperCase();
    };

    // Calculate visible range (left and right edges of viewport)
    const getVisibleRange = () => {
      if (!timelineRef.current) return { left: "OCT 2024", right: "DEC 2024" };

      const clientWidth = timelineRef.current.clientWidth;
      const scrollWidth = timelineRef.current.scrollWidth;
      const viewportPercentage = (clientWidth / scrollWidth) * 100;

      const leftPosition = scrollPosition;
      const rightPosition = Math.min(scrollPosition + viewportPercentage, 100);

      return {
        left: getDateFromPosition(leftPosition),
        right: getDateFromPosition(rightPosition),
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

    // Calculate month markers (Oct 2024 - Dec 2025)
    const getMonthMarkers = () => {
      const startDate = new Date(2024, 9, 1); // Oct 2024
      const endDate = new Date(2025, 11, 31); // Dec 2025
      const totalDays =
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

      const markers = [];
      let currentDate = new Date(2024, 9, 1); // Start at Oct 2024

      while (currentDate <= endDate) {
        const daysSinceStart =
          (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        const position = (daysSinceStart / totalDays) * 100;

        const monthName = currentDate
          .toLocaleDateString("en-US", { month: "short" })
          .toUpperCase();
        const year = currentDate.getFullYear();

        markers.push({
          position,
          label: `${monthName} ${year}`,
          monthOnly: monthName,
        });

        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      return markers;
    };

    const monthMarkers = getMonthMarkers();

    // Calculate date labels for tick marks (every 7 days)
    const getDateLabels = () => {
      // 현재 timeline 시작 날짜 - 2024년 10월 1일로 하드코딩
      const startDate = new Date(2024, 9, 1); // Oct 2024
      const endDate = new Date(2025, 11, 31); // Dec 2025
      const totalDays =
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

      const labels = [];
      let currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const daysSinceStart =
          (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
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
      const startDate = new Date(2024, 9, 1); // Oct 2024
      const totalMonths = 14;
      const monthsOffset =
        (date.getFullYear() - startDate.getFullYear()) * 12 +
        (date.getMonth() - startDate.getMonth());

      const scrollPercentage = (monthsOffset / totalMonths) * 100;
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
          onWheel={handleWheel}
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
                  }}
                >
                  {/* Vertical line for month boundary */}
                  <div
                    className="bg-black"
                    style={{
                      width: "2px",
                      height: "40px",
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
                      bottom: "32px",
                      fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                      fontSize: "14px",
                      fontWeight: "bold",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {marker.monthOnly}
                  </span>
                </div>
              ))}

              {/* Extended Tick Marks */}
              {Array.from({ length: 97 }).map((_, i) => {
                const isLargeTick = i % 5 === 0;
                return (
                  <div
                    key={`tick-${i}`}
                    className="absolute bg-black"
                    style={{
                      left: `${(i / 96) * 100}%`,
                      width: "1px",
                      height: isLargeTick ? "24px" : "12px",
                      top: isLargeTick ? "-12px" : "-6px",
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
                    top: "-20px",
                    transform: "translateX(-50%)",
                    fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                    fontSize: "13px",
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
              const nodeTag = nodeData.tags;

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
                      backgroundColor: nodeTag[0]?.tag_color || "#F2F0EB",
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
