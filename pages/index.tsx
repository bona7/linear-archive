import { Timeline } from "@/design/components/Timeline";
import { Toolbar } from "@/design/components/Toolbar";
import { ArchiveModal } from "@/design/components/ArchiveModal";
import { SearchBar } from "@/design/components/SearchBar";
import { LoginModal } from "@/design/components/LoginModal";
import { ProfileMenu } from "@/design/components/ProfileMenu";
import { useState, useRef, useEffect } from "react";
import nodeItems from "@/design/data/nodeItems";
import { signOut, getUser, getDisplayName } from "@/commons/libs/supabase/auth";
import {
  BoardWithTags,
  readBoardsWithTags,
  getCurrentUserTags,
} from "@/commons/libs/supabase/db";
import { Router, useRouter } from "next/router";

export default function App() {
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [boards, setBoards] = useState<BoardWithTags[]>([]);
  const [nodeDataMap, setNodeDataMap] =
    useState<Record<number, BoardWithTags>>(boards);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [matchedNodeIds, setMatchedNodeIds] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<any>(null);
  const [displayNameValue, setDisplayNameValue] = useState<string | null>(null);

  const timelineRef = useRef<{ scrollToDate: (date: Date) => void }>(null);

  useEffect(() => {
    checkUser();
    loadBoards();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await getUser();
      setUser(currentUser);
      const name = await getDisplayName();
      setDisplayNameValue(name);
    } catch (err) {
      setUser(null);
      setDisplayNameValue(null);
    }
  };

  const loadBoards = async () => {
    try {
      const data = await readBoardsWithTags();
      setBoards(data);
    } catch (err: any) {
      console.error(err.message || "게시글 로드 실패");
    }
  };

  const handleLogin = (nickname: string) => {};

  const handleLogout = async () => {
    try {
      await signOut();
      setUser(null);
      setDisplayNameValue(null);
    } catch (err: any) {
      console.error(err.message || "로그아웃 실패");
    }
  };

  const handleNodeClick = (
    nodeId: number,
    position: { x: number; y: number }
  ) => {
    setSelectedNodeId(nodeId);
    setModalPosition(position);
    setIsModalOpen(true);
  };

  const handleToolbarNewArchive = () => {
    setSelectedNodeId(null);
    setModalPosition(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNodeId(null);
  };

  const handleSaveArchive = () =>
    // tag: NodeTag | null,
    // description: string,
    // date: Date | null
    {
      // if (selectedNodeId !== null) {
      //   // Update existing node data
      //   setNodeDataMap((prev) => ({
      //     ...prev,
      //     [selectedNodeId]: {
      //       id: selectedNodeId,
      //       tag: tag || prev[selectedNodeId]?.tag,
      //       description,
      //       date: date || prev[selectedNodeId]?.date,
      //     },
      //   }));
      //   if (tag) {
      //     // Update recent tags (add to beginning, remove duplicates, limit to 5)
      //     setRecentTags((prev) => {
      //       const filtered = prev.filter(
      //         (t) => !(t.name === tag.name && t.color === tag.color)
      //       );
      //       return [tag, ...filtered].slice(0, 5);
      //     });
      //   }
      //   // Scroll to date if provided
      //   if (date && timelineRef.current) {
      //     timelineRef.current.scrollToDate(date);
      //   }
      // } else if (tag && date) {
      //   // Create new node
      //   const newId = nextNodeId;
      //   setNodeDataMap((prev) => ({
      //     ...prev,
      //     [newId]: {
      //       id: newId,
      //       tag,
      //       description,
      //       date,
      //     },
      //   }));
      //   setNextNodeId((prev) => prev + 1);
      //   // Update recent tags
      //   setRecentTags((prev) => {
      //     const filtered = prev.filter(
      //       (t) => !(t.name === tag.name && t.color === tag.color)
      //     );
      //     return [tag, ...filtered].slice(0, 5);
      //   });
      //   // Scroll to the new node's date
      //   if (timelineRef.current) {
      //     timelineRef.current.scrollToDate(date);
      //   }
      // }
      // handleCloseModal();
    };

  const handleDeleteArchive = () => {
    if (selectedNodeId !== null) {
      // Remove node from nodeDataMap
      setNodeDataMap((prev) => {
        const newMap = { ...prev };
        delete newMap[selectedNodeId];
        return newMap;
      });
    }
    handleCloseModal();
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
      const tagMatch = node.tags[0].tag_name.toLowerCase().includes(lowerQuery);
      const descMatch = node.description?.toLowerCase().includes(lowerQuery);
      if (tagMatch || descMatch) {
        matches.add(node.board_id);
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

  // useEffect(() => {
  //   if (!isSearching) {
  //     setSearchQuery("");
  //     setMatchedNodeIds(new Set());
  //   }
  // }, [isSearching]);

  return (
    <>
      {/* Login Modal */}
      <LoginModal isOpen={!user} onLogin={handleLogin} />

      {/* Header - Always visible and clear */}
      <header className="fixed top-0 left-0 right-0 pt-8 pb-8 pointer-events-none z-[100]">
        {/* User Nickname - Only shown when logged in */}
        {user && (
          <div
            className="text-center mb-4 transition-all duration-700 ease-out"
            style={{
              opacity: user ? 1 : 0,
              transform: user ? "translateY(0)" : "translateY(-20px)",
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
              {displayNameValue}'s
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
            transform: user ? "translateY(0)" : "translateY(40px)",
          }}
        >
          Linear Archive
        </h1>

        {/* Toolbar - Below Title - Only shown when logged in */}
        {user && (
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
          !user ? "blur-[2px]" : "blur-0"
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
          style={{ height: user ? "280px" : "240px" }}
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
            nodeDataMap={boards}
            searchQuery={searchQuery}
            matchedNodeIds={matchedNodeIds}
            ref={timelineRef}
          />
        </div>

        {/* Profile Menu - Top Right */}
        {user && (
          <ProfileMenu
            onLogout={handleLogout}
            userNickname={displayNameValue}
          />
        )}

        {/* Archive Modal */}
        {/* <ArchiveModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveArchive}
          onDelete={handleDeleteArchive}
          position={modalPosition}
          recentTags={recentTags}
          currentNodeData={
            selectedNodeId !== null ? nodeDataMap[selectedNodeId] : undefined
          }
        /> */}
      </div>
    </>
  );
}
