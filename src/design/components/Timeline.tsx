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
            const newScrollLeft =
              (currentScrollLeft + mouseX) * zoomFactor - mouseX;

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

    // 줌 정도에 따라 "기간 버킷" 개수(= 동심원 중심 개수)를
    // 기계적으로, 단계적으로 변화시키는 함수
    const getPeriodBucketCount = (zoomLevel: number) => {
      const BUCKET_DISABLE_THRESHOLD = 3.0; // 이 이상이면 버킷 해제 (clusterNodes에서 처리)
      const HIGH_DENSE_START = 2.7; // 가장 촘촘한 구간 시작
      const MID_DENSE_START = 2.3; // 그 직전 구간 시작

      const MIN_BUCKETS_HIGH = 80; // 최상위 구간: 최소 70개 버킷
      const MIN_BUCKETS_MID = 30; // 중간 구간: 최소 30개 버킷

      // 1) 가장 촘촘한 구간: 2.7 ~ 3.0
      if (
        zoomLevel >= HIGH_DENSE_START &&
        zoomLevel < BUCKET_DISABLE_THRESHOLD
      ) {
        const clampedZoom = Math.min(zoomLevel, 5);
        const base =
          1 + 6 * Math.log2(1 + clampedZoom) + 2 * Math.sqrt(clampedZoom);

        return Math.max(MIN_BUCKETS_HIGH, Math.min(80, Math.round(base)));
      }

      // 2) 중간 촘촘 구간: 2.3 ~ 2.7
      if (zoomLevel >= MID_DENSE_START && zoomLevel < HIGH_DENSE_START) {
        const clampedZoom = Math.min(zoomLevel, 5);
        const base =
          1 + 6 * Math.log2(1 + clampedZoom) + 2 * Math.sqrt(clampedZoom);

        return Math.max(MIN_BUCKETS_MID, Math.min(60, Math.round(base)));
      }

      // 3) 그 밖의 구간: 기본 기계적 증가 로직
      const clampedZoom = Math.min(zoomLevel, 5); // 0 ~ 5 구간으로 클램프
      const base =
        1 + 6 * Math.log2(1 + clampedZoom) + 2 * Math.sqrt(clampedZoom);

      // 최소 1, 최대 40 버킷 사이로 제한
      const bucketCount = Math.max(1, Math.min(40, Math.round(base)));

      return bucketCount;
    };

    // 기간(포지션 구간) 기준으로 노드를 묶어서
    // 각 기간이 동심원 하나의 중심이 되도록 만드는 함수
    const clusterNodes = (nodes: typeof allNodes) => {
      if (nodes.length === 0) return [];

      // ✅ 충분히 확대되었을 때(zoom ≥ 3.0)는
      // 같은 날짜(YYYY-MM-DD)끼리 묶어서 동심원 클러스터를 만든다
      if (zoom >= 3.0) {
        const clusters: Array<{
          id: number;
          centerPosition: number;
          nodes: typeof allNodes;
        }> = [];

        const groups = new Map<string, typeof allNodes>();

        // 날짜 키 기준으로 그룹화
        nodes.forEach((node) => {
          const nodeData = nodesById.get(node.id);
          if (!nodeData || !nodeData.date) return;

          const dateObj = new Date(nodeData.date);
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, "0");
          const day = String(dateObj.getDate()).padStart(2, "0");
          const dateKey = `${year}-${month}-${day}`;

          const arr = groups.get(dateKey);
          if (arr) arr.push(node);
          else groups.set(dateKey, [node]);
        });

        let clusterId = 0;
        groups.forEach((groupNodes) => {
          if (groupNodes.length === 0) return;

          // 이 날짜 그룹의 중심 position (타임라인 상 x 위치)
          const centerPos =
            groupNodes.reduce((sum, n) => sum + n.position, 0) /
            groupNodes.length;

          clusters.push({
            id: clusterId++,
            centerPosition: centerPos,
            nodes: groupNodes, // 같은 날짜 노드들이 한 클러스터 안에 모임
          });
        });

        return clusters;
      }

      // ⬇️ zoom < 3.0 에서는 기존 버킷(기간) 기반 클러스터링 유지
      const bucketCount = getPeriodBucketCount(zoom);
      const bucketWidth = 100 / bucketCount;

      const buckets: Array<{
        id: number;
        centerPosition: number;
        nodes: typeof allNodes;
      }> = [];

      for (let i = 0; i < bucketCount; i++) {
        buckets.push({
          id: i,
          centerPosition: 0,
          nodes: [],
        });
      }

      // 각 노드를 0~100% 구간 기준으로 버킷에 할당
      nodes.forEach((node) => {
        const rawIndex = Math.floor(node.position / bucketWidth);
        const bucketIndex = Math.min(bucketCount - 1, Math.max(0, rawIndex));
        buckets[bucketIndex].nodes.push(node);
      });

      const clusters: Array<{
        id: number;
        centerPosition: number;
        nodes: typeof allNodes;
      }> = [];

      buckets.forEach((bucket) => {
        if (bucket.nodes.length === 0) return;

        const centerPos =
          bucket.nodes.reduce((sum, n) => sum + n.position, 0) /
          bucket.nodes.length;

        clusters.push({
          id: bucket.id,
          centerPosition: centerPos,
          nodes: bucket.nodes,
        });
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

      // 동심원 방식: 반지름이 커질수록 그 링이 수용할 수 있는 노드 개수(capacity)가 늘어나고,
      // 바깥 링이 너무 비어 보이지 않도록 링 개수와 배치를 동적으로 조정한다.
      const nodeSize = 24; // 노드 직경(px)
      const minSpacing = 8; // 노드 간 최소 간격(px)
      const spacingPerNode = nodeSize + minSpacing; // 노드 하나가 차지하는 둘레 길이

      const baseRadius = isHovered ? 20 : 15; // 첫 번째 링 반지름
      const radiusStep = 25; // 링이 하나 늘어날 때마다 반지름 증가
      const MAX_RINGS = 8; // 한 클러스터에서 사용할 수 있는 최대 링 개수
      const MIN_FILL_RATIO = 0.4; // 마지막 링이 이 비율보다 적게 채워지면 링 개수를 줄여서 재배치

      // 1) 각 링의 반지름과 수용 가능 노드 수(capacity) 계산
      const radii: number[] = [];
      const capacities: number[] = [];
      for (let ring = 0; ring < MAX_RINGS; ring++) {
        const radius = baseRadius + ring * radiusStep;
        const circumference = 2 * Math.PI * radius;
        const capacity = Math.max(
          3, // 최소 3개는 보장
          Math.floor(circumference / spacingPerNode)
        );
        radii.push(radius);
        capacities.push(capacity);
      }

      // 2) 최소한 clusterSize를 커버할 수 있는 가장 작은 링 개수 선택
      let ringCount = 1;
      for (let r = 1; r <= MAX_RINGS; r++) {
        const totalCap = capacities.slice(0, r).reduce((sum, c) => sum + c, 0);
        if (totalCap >= clusterSize) {
          ringCount = r;
          break;
        }
      }

      // 3) 주어진 ringCount에서 각 링에 실제로 몇 개의 노드를 배치할지 계산
      const computeLayout = (rings: number) => {
        const nodesPerRing: number[] = new Array(rings).fill(0);
        let remaining = clusterSize;

        for (let i = 0; i < rings; i++) {
          const take = Math.min(capacities[i], remaining);
          nodesPerRing[i] = take;
          remaining -= take;
        }

        // capacity를 다 써도 남는 노드가 있다면 마지막 링에 몰아넣기
        if (remaining > 0) {
          nodesPerRing[rings - 1] += remaining;
        }

        return nodesPerRing;
      };

      let nodesPerRing = computeLayout(ringCount);

      // 4) 마지막 링이 너무 비어 있거나,
      //    바깥 링의 노드 수가 바로 안쪽 링보다 많지 않으면
      //    링 개수를 줄여서 재배치
      while (ringCount > 1) {
        const lastCapacity = capacities[ringCount - 1];
        const lastNodes = nodesPerRing[ringCount - 1];
        const prevNodes = nodesPerRing[ringCount - 2];
        const fillRatio = lastNodes / lastCapacity;
        const outerMoreThanInner = lastNodes > prevNodes;

        if (fillRatio >= MIN_FILL_RATIO && outerMoreThanInner) break;

        ringCount -= 1;
        nodesPerRing = computeLayout(ringCount);
      }

      // 5) 각 링의 시작 인덱스(prefix sum) 계산
      const ringStartIndex: number[] = new Array(ringCount).fill(0);
      {
        let acc = 0;
        for (let i = 0; i < ringCount; i++) {
          ringStartIndex[i] = acc;
          acc += nodesPerRing[i];
        }
      }

      // 6) 주어진 index가 어느 링에 속하는지, 그 링 안에서 몇 번째인지 계산
      let ringIndex = ringCount - 1;
      let indexInRing = 0;
      for (let i = 0; i < ringCount; i++) {
        const start = ringStartIndex[i];
        const end = start + nodesPerRing[i];
        if (index >= start && index < end) {
          ringIndex = i;
          indexInRing = index - start;
          break;
        }
      }

      const radius = radii[ringIndex];
      const nodesInThisRing = Math.max(1, nodesPerRing[ringIndex]);

      // 링 안에서는 항상 균등 분포로 배치 → 원형이 유지됨
      const angle = (indexInRing / nodesInThisRing) * Math.PI * 2 - Math.PI / 2;

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
          className="relative w-full h-60 overflow-x-auto overflow-y-hidden timeline-container px-8"
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
                    className="w-6 h-6 transition-all"
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
                        hoveredNodeId === node.id ? "scale(2)" : "scale(1)",
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

            const nodeRadius = 18;
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
