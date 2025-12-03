import { Timeline } from "./components/Timeline";
import { Toolbar } from "./components/Toolbar";
import { ArchiveModal } from "./components/ArchiveModal";
import { SearchBar } from "./components/SearchBar";
import { LoginModal } from "./components/LoginModal";
import { ProfileMenu } from "./components/ProfileMenu";
import { useState, useRef } from "react";
import nodeItems from "./data/nodeItems";

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

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [userNickname, setUserNickname] = useState("Guest"); // User nickname (different from email)
  const [nodeDataMap, setNodeDataMap] =
    useState<Record<number, NodeData>>(nodeItems);
  const [recentTags, setRecentTags] = useState<NodeTag[]>([
    { name: "가나디", color: "#FF69B4" },
    { name: "라멘", color: "#FF6B8A" },
    { name: "자동차", color: "#3B82F6" },
  ]);
  const [nextNodeId, setNextNodeId] = useState(31); // Continue from existing nodes
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [matchedNodeIds, setMatchedNodeIds] = useState<Set<number>>(new Set());
  const timelineRef = useRef<{ scrollToDate: (date: Date) => void }>(null);

  const handleLogin = (nickname: string) => {
    setUserNickname(nickname);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserNickname("Guest");
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

  const handleSaveArchive = (
    tag: NodeTag | null,
    description: string,
    date: Date | null
  ) => {
    if (selectedNodeId !== null) {
      // Update existing node data
      setNodeDataMap((prev) => ({
        ...prev,
        [selectedNodeId]: {
          id: selectedNodeId,
          tag: tag || prev[selectedNodeId]?.tag,
          description,
          date: date || prev[selectedNodeId]?.date,
        },
      }));

      if (tag) {
        // Update recent tags (add to beginning, remove duplicates, limit to 5)
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
    } else if (tag && date) {
      // Create new node
      const newId = nextNodeId;
      setNodeDataMap((prev) => ({
        ...prev,
        [newId]: {
          id: newId,
          tag,
          description,
          date,
        },
      }));

      setNextNodeId((prev) => prev + 1);

      // Update recent tags
      setRecentTags((prev) => {
        const filtered = prev.filter(
          (t) => !(t.name === tag.name && t.color === tag.color)
        );
        return [tag, ...filtered].slice(0, 5);
      });

      // Scroll to the new node's date
      if (timelineRef.current) {
        timelineRef.current.scrollToDate(date);
      }
    }
    handleCloseModal();
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
    const matches = new Set<number>();

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
      {/* Login Modal */}
      <LoginModal isOpen={!isLoggedIn} onLogin={handleLogin} />

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

        {/* Archive Modal */}
        <ArchiveModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveArchive}
          onDelete={handleDeleteArchive}
          position={modalPosition}
          recentTags={recentTags}
          currentNodeData={
            selectedNodeId !== null ? nodeDataMap[selectedNodeId] : undefined
          }
        />
      </div>
    </>
  );
}
