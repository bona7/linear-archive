import { Timeline } from "./components/Timeline";
import { Toolbar } from "./components/Toolbar";
import { ArchiveModal } from "./components/ArchiveModal";
import { ViewArchiveModal } from "./components/ViewArchiveModal";
import { SearchBar } from "./components/SearchBar";
import { LoginModal } from "./components/LoginModal";
import { ProfileMenu } from "./components/ProfileMenu";
import { useState, useRef, useEffect } from "react";
import { readBoardsWithTags } from "../commons/libs/supabase/db";
import {
  getSession,
  getDisplayName,
  signOut,
} from "../commons/libs/supabase/auth";

interface NodeTag {
  name: string;
  color: string;
}

interface NodeData {
  id: string;
  tag?: NodeTag;
  title?: string;
  description?: string;
  date?: Date;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [userNickname, setUserNickname] = useState("Guest"); // User nickname (different from email)
  const [nodeDataMap, setNodeDataMap] = useState<Record<string, NodeData>>({});
  const [recentTags, setRecentTags] = useState<NodeTag[]>([
    { name: "가나디", color: "#FF69B4" },
    { name: "라멘", color: "#FF6B8A" },
    { name: "자동차", color: "#3B82F6" },
  ]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [matchedNodeIds, setMatchedNodeIds] = useState<Set<string>>(new Set());
  const timelineRef = useRef<{ scrollToDate: (date: Date) => void }>(null);
  const [isLoadingBoards, setIsLoadingBoards] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // 인증 확인 중 상태

  // 페이지 로드 시 기존 세션 확인
  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await getSession();

        if (session?.user) {
          // 기존 세션이 있으면 로그인 상태로 설정
          const displayName = await getDisplayName();
          const nickname =
            displayName || session.user.email?.split("@")[0] || "User";
          setUserNickname(nickname);
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error("Failed to check session:", error);
        setIsLoggedIn(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkSession();
  }, []);

  // Supabase에서 보드 데이터 불러오기
  useEffect(() => {
    const loadBoards = async () => {
      if (!isLoggedIn) {
        setNodeDataMap({});
        return;
      }

      setIsLoadingBoards(true);
      try {
        const boards = await readBoardsWithTags();

        // BoardWithTags를 NodeData로 변환
        const nodeDataMap: Record<string, NodeData> = {};
        boards.forEach((board) => {
          // 첫 번째 태그를 사용 (기존 로직과 호환)
          const tag =
            board.tags.length > 0
              ? {
                  name: board.tags[0].tag_name,
                  color: board.tags[0].tag_color,
                }
              : undefined;

          // date와 time을 합쳐서 Date 객체 생성
          let date: Date | undefined;
          if (board.date) {
            const dateParts = board.date.split("-");
            if (dateParts.length === 3) {
              const year = Number(dateParts[0]);
              const month = Number(dateParts[1]) - 1; // month는 0-indexed
              const day = Number(dateParts[2]);

              let hour = 12;
              let minute = 0;
              if (board.time) {
                const timeParts = board.time.split(":");
                if (timeParts.length >= 2) {
                  hour = Number(timeParts[0]);
                  minute = Number(timeParts[1]);
                }
              }

              date = new Date(year, month, day, hour, minute);
            }
          }

          nodeDataMap[board.board_id] = {
            id: board.board_id,
            tag: tag,
            description: board.description || undefined,
            date: date,
          };
        });

        setNodeDataMap(nodeDataMap);
      } catch (error) {
        console.error("Failed to load boards:", error);
        setNodeDataMap({});
      } finally {
        setIsLoadingBoards(false);
      }
    };

    loadBoards();
  }, [isLoggedIn]);

  const handleLogin = (nickname: string) => {
    setUserNickname(nickname);
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
    setIsLoggedIn(false);
    setUserNickname("Guest");
    setNodeDataMap({});
  };

  const handleNodeClick = (
    nodeId: string,
    position: { x: number; y: number }
  ) => {
    setSelectedNodeId(nodeId);
    setModalPosition(position);
    setIsViewModalOpen(true); // ViewArchiveModal 열기
  };

  const handleToolbarNewArchive = () => {
    setSelectedNodeId(null);
    setModalPosition(null);
    setIsEditModalOpen(true); // ArchiveModal 열기 (새 아카이브 생성)
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedNodeId(null);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedNodeId(null);
  };

  const handleEditArchive = () => {
    setIsViewModalOpen(false);
    setIsEditModalOpen(true); // ArchiveModal 열기 (편집 모드)
  };

  const handleSaveArchive = async (
    tag: NodeTag | null,
    description: string,
    date: Date | null
  ) => {
    // 저장 후 데이터 다시 불러오기
    if (isLoggedIn) {
      try {
        const boards = await readBoardsWithTags();
        const nodeDataMap: Record<string, NodeData> = {};
        boards.forEach((board) => {
          const tag =
            board.tags.length > 0
              ? {
                  name: board.tags[0].tag_name,
                  color: board.tags[0].tag_color,
                }
              : undefined;

          // date와 time을 합쳐서 Date 객체 생성
          let date: Date | undefined;
          if (board.date) {
            const dateParts = board.date.split("-");
            if (dateParts.length === 3) {
              const year = Number(dateParts[0]);
              const month = Number(dateParts[1]) - 1; // month는 0-indexed
              const day = Number(dateParts[2]);

              let hour = 12;
              let minute = 0;
              if (board.time) {
                const timeParts = board.time.split(":");
                if (timeParts.length >= 2) {
                  hour = Number(timeParts[0]);
                  minute = Number(timeParts[1]);
                }
              }

              date = new Date(year, month, day, hour, minute);
            }
          }

          nodeDataMap[board.board_id] = {
            id: board.board_id,
            tag: tag,
            description: board.description || undefined,
            date: date,
          };
        });
        setNodeDataMap(nodeDataMap);
      } catch (error) {
        console.error("Failed to reload boards:", error);
      }
    }

    if (tag) {
      // Update recent tags
      setRecentTags((prev) => {
        const filtered = prev.filter(
          (t) => !(t.name === tag.name && t.color === tag.color)
        );
        return [tag, ...filtered].slice(0, 5);
      });
    }

    // Scroll to date if provided
    if (date && timelineRef.current) {
      timelineRef.current.scrollToDate(date);
    }

    handleCloseEditModal();
  };

  const handleDeleteArchive = async () => {
    // 삭제 후 데이터 다시 불러오기
    if (isLoggedIn) {
      try {
        const boards = await readBoardsWithTags();
        const nodeDataMap: Record<string, NodeData> = {};
        boards.forEach((board) => {
          const tag =
            board.tags.length > 0
              ? {
                  name: board.tags[0].tag_name,
                  color: board.tags[0].tag_color,
                }
              : undefined;

          // date와 time을 합쳐서 Date 객체 생성
          let date: Date | undefined;
          if (board.date) {
            const dateParts = board.date.split("-");
            if (dateParts.length === 3) {
              const year = Number(dateParts[0]);
              const month = Number(dateParts[1]) - 1; // month는 0-indexed
              const day = Number(dateParts[2]);

              let hour = 12;
              let minute = 0;
              if (board.time) {
                const timeParts = board.time.split(":");
                if (timeParts.length >= 2) {
                  hour = Number(timeParts[0]);
                  minute = Number(timeParts[1]);
                }
              }

              date = new Date(year, month, day, hour, minute);
            }
          }

          nodeDataMap[board.board_id] = {
            id: board.board_id,
            tag: tag,
            description: board.description || undefined,
            date: date,
          };
        });
        setNodeDataMap(nodeDataMap);
      } catch (error) {
        console.error("Failed to reload boards:", error);
      }
    }
    handleCloseEditModal();
  };

  const handleDateSelect = (date: Date) => {
    if (timelineRef.current) {
      timelineRef.current.scrollToDate(date);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setMatchedNodeIds(new Set());
      return;
    }

    const lowerQuery = query.toLowerCase();
    const matches = new Set<string>();

    Object.values(nodeDataMap).forEach((node) => {
      // Search by tag name
      const tagMatch = node.tag?.name.toLowerCase().includes(lowerQuery);
      const titleMatch = node.title?.toLowerCase().includes(lowerQuery);
      const descMatch = node.description?.toLowerCase().includes(lowerQuery);

      if (tagMatch || titleMatch || descMatch) {
        matches.add(node.id);
      }
    });

    setMatchedNodeIds(matches);
  };

  const handleOpenSearch = () => {
    setIsSearching(true);
  };

  const handleCloseSearch = () => {
    setIsSearching(false);
    setSearchQuery("");
    setMatchedNodeIds(new Set());
  };

  return (
    <>
      {/* 인증 확인 중 로딩 */}
      {isCheckingAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F2F0EB]">
          <span
            style={{
              fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
              fontSize: "14px",
              opacity: 0.5,
            }}
          >
            로딩 중...
          </span>
        </div>
      )}

      {/* Login Modal */}
      {!isCheckingAuth && (
        <LoginModal isOpen={!isLoggedIn} onLogin={handleLogin} />
      )}

      {/* Header - Always visible and clear */}
      <header className="fixed top-0 left-0 right-0 pt-8 pb-8 pointer-events-none z-[100]">
        {/* User Nickname - Only shown when logged in */}
        {isLoggedIn && (
          <div
            className="text-center mb-4 transition-all duration-700 ease-out"
            style={{
              opacity: isLoggedIn ? 1 : 0,
              transform: isLoggedIn ? "translateY(0)" : "translateY(-20px)",
            }}
          >
            <span
              className="tracking-tight"
              style={{
                fontFamily: "Georgia, serif",
                fontSize: "48px",
                lineHeight: "1",
              }}
            >
              {userNickname}'s
            </span>
          </div>
        )}

        {/* Linear Archive Title - Moves down when logged in */}
        <h1
          className="text-center tracking-tight transition-all duration-700 ease-out"
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "96px",
            lineHeight: "1",
            transform: isLoggedIn ? "translateY(0)" : "translateY(40px)",
          }}
        >
          Linear Archive
        </h1>

        {/* Toolbar - Below Title - Only shown when logged in */}
        {isLoggedIn && (
          <div className="flex justify-center mt-6 pointer-events-auto">
            <Toolbar
              onNewArchive={handleToolbarNewArchive}
              onDateSelect={handleDateSelect}
              onSearch={handleOpenSearch}
            />
          </div>
        )}
      </header>

      <div
        className={`min-h-screen bg-[#F2F0EB] relative overflow-hidden flex flex-col transition-all duration-500 z-[120]${
          !isLoggedIn ? "blur-[2px]" : "blur-0"
        }`}
        style={{
          backgroundImage: `
            radial-gradient(circle, rgba(0, 0, 0, 0.15) 1px, transparent 1px),
            url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23noise)' opacity='0.06'/%3E%3C/svg%3E\")
          `,
          backgroundSize: "24px 24px, 400px 400px",
        }}
      >
        {/* Header Spacer - Adjusts based on login state */}
        <div
          className="transition-all duration-700 ease-out"
          style={{ height: isLoggedIn ? "280px" : "240px" }}
        />

        {/* Search Bar */}
        {isSearching && (
          <div className="pb-8 pt-4">
            <SearchBar
              onSearch={handleSearch}
              onClose={handleCloseSearch}
              matchCount={matchedNodeIds.size}
            />
          </div>
        )}

        {/* Timeline Section - Center of Screen */}
        <div className="flex-1 flex items-center justify-center w-full">
          <Timeline
            onNodeClick={handleNodeClick}
            selectedNodeId={selectedNodeId}
            nodeDataMap={nodeDataMap}
            searchQuery={searchQuery}
            matchedNodeIds={matchedNodeIds}
            ref={timelineRef}
          />
        </div>

        {/* Profile Menu - Top Right */}
        {isLoggedIn && (
          <ProfileMenu onLogout={handleLogout} userNickname={userNickname} />
        )}

        {/* View Archive Modal */}
        <ViewArchiveModal
          isOpen={isViewModalOpen}
          onClose={handleCloseViewModal}
          onEdit={handleEditArchive}
          onDelete={handleDeleteArchive}
          currentNodeData={
            selectedNodeId !== null ? nodeDataMap[selectedNodeId] : undefined
          }
        />

        {/* Edit/Create Archive Modal */}
        <ArchiveModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSave={handleSaveArchive}
          onDelete={handleDeleteArchive}
          position={modalPosition}
          currentNodeData={
            selectedNodeId !== null ? nodeDataMap[selectedNodeId] : undefined
          }
        />
      </div>
    </>
  );
}
