import { Timeline } from "@/design/components/Timeline";
import { Toolbar } from "@/design/components/Toolbar";
import { ArchiveModal } from "@/design/components/ArchiveModal";
import { ViewArchiveModal } from "@/design/components/ViewArchiveModal";
import { SearchBar } from "@/design/components/SearchBar";
import { LoginModal } from "@/design/components/LoginModal";
import { ProfileMenu } from "@/design/components/ProfileMenu";
import { useState, useRef, useEffect, useMemo } from "react";
import { NodeData, NodeTag } from "@/commons/types/types";
import {
  signOut,
  getSession,
} from "@/commons/libs/supabase/auth";
import {
  BoardWithTags,
  Tag,
  readBoardsWithTags,
  getCurrentUserTags,
} from "@/commons/libs/supabase/db";
import { useRouter } from "next/router";
import { AnalysisPanel } from "@/design/components/AnalysisPanel";
import {
  LoadingOverlay,
  LoadingIcon,
} from "@/commons/libraries/loadingOverlay";
import styled from "@emotion/styled";
import { supabase } from "@/commons/libs/supabase/client";

const FullScreenLoadingOverlay = styled(LoadingOverlay)`
  position: fixed !important;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
`;

export default function App() {
  const router = useRouter();

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [modalPosition, setModalPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [boards, setBoards] = useState<BoardWithTags[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [matchedNodeIds, setMatchedNodeIds] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<any>(null);
  const [displayNameValue, setDisplayNameValue] = useState<string | null>(null);
  const [tags, setTags] = useState<NodeTag[]>([]);
  const [rawTags, setRawTags] = useState<Tag[]>([]); // New state for raw tags
  const [selectedFilterTags, setSelectedFilterTags] = useState<NodeTag[]>([]);
  const [isAnalysisPanelOpen, setIsAnalysisPanelOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [initialSignUpStep, setInitialSignUpStep] = useState<
    "email" | "check_email" | "success" | null
  >(null);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const { minYear, maxYear } = useMemo(() => {
    const currentYear = new Date().getFullYear();
    
    if (boards.length === 0) {
      return { minYear: currentYear - 1, maxYear: currentYear + 1 };
    }

    const years = boards
      .map(b => b.date ? new Date(b.date).getFullYear() : currentYear)
      .filter(y => !isNaN(y));

    if (years.length === 0) {
      return { minYear: currentYear - 1, maxYear: currentYear + 1 };
    }

    return {
      minYear: Math.min(...years), // 가장 과거 노드의 연도
      maxYear: Math.max(...years, currentYear) // 오늘 날짜
    };
  }, [boards]);

  const nodeDataMap = useMemo(() => {
    return Object.fromEntries(boards.map((board) => [board.board_id, board]));
  }, [boards]);

  function boardToNodeData(board: BoardWithTags): NodeData {
    return {
      id: board.board_id,
      description: board.description ?? undefined,
      tag:
        board.tags.length > 0
          ? { name: board.tags[0].tag_name, color: board.tags[0].tag_color }
          : undefined,
      date: board.date
        ? new Date(`${board.date}T${"00:00:00"}`)
        : undefined,
    };
  }

  const checkUser = async () => {
    try {
      const session = await getSession();
      if (session?.user) {
        const displayName =
          (session.user.user_metadata?.display_name as string) || null;

        if (
          session.user.email_confirmed_at &&
          displayName &&
          !initialSignUpStep &&
          !user
        ) {
          setInitialSignUpStep("success");
        }

        if (user?.id !== session.user.id || displayNameValue !== displayName) {
          setUser(session.user);
          setDisplayNameValue(displayName);
        }
      } else {
        if (user !== null) {
          setUser(null);
          setDisplayNameValue(null);
          setInitialSignUpStep(null);
        }
      }
    } catch (err) {
      if (user !== null) {
        setUser(null);
        setDisplayNameValue(null);
        setInitialSignUpStep(null);
      }
    }
  };

  const timelineRef = useRef<{ scrollToDate: (date: Date) => void }>(null);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (!user) {
      setBoards([]);
      return;
    }
    // [중요] 로그인 성공 시 회원가입 모드 해제
    setIsSignUpMode(false);

    const loadBoards = async () => {
      try {
        const data = await readBoardsWithTags();
        setBoards(data);
      } catch (err: any) {
        console.error(err.message || "게시글 로드 실패");
      }
    };
    loadBoards();
    const loadTags = async () => {
      if (!user) return;
      try {
        const tagsData = await getCurrentUserTags();
        setRawTags(tagsData);
        // Tag 타입을 NodeTag 타입으로 변환
        const nodeTags: NodeTag[] = tagsData.map((tag) => ({
          name: tag.tag_name,
          color: tag.tag_color,
        }));
        setTags(nodeTags);
      } catch (error) {
        console.error("Failed to load tags:", error);
        setTags([]);
        setRawTags([]);
      }
    };
    loadTags();
    setIsSignUpMode(false); // 로그인된 상태에서는 회원가입 모드 해제
  }, [user]);

  const handleLogin = () => {
    checkUser();
    setIsSignUpMode(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      setUser(null);
      setDisplayNameValue(null);
      setInitialSignUpStep(null);
    } catch (err: any) {
      console.error(err.message || "로그아웃 실패");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleNodeClick = (
    nodeId: string,
    position: { x: number; y: number }
  ) => {
    setSelectedNodeId(nodeId);
    setModalPosition(position);
    setIsViewModalOpen(true);
  };

  const handleToolbarNewArchive = () => {
    setSelectedNodeId(null);
    setModalPosition(null);
    setIsEditModalOpen(true);
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
    setIsEditModalOpen(true);
  };

  const handleSaveArchive = async (date: Date | null) => {
    if (user) {
      try {
        const updatedBoards = await readBoardsWithTags();
        const updatedTags = await getCurrentUserTags();
        const newNodeTags: NodeTag[] = updatedTags.map((tag) => ({
          name: tag.tag_name,
          color: tag.tag_color,
        }));
        setTags(newNodeTags);
        setBoards(updatedBoards);
      } catch (error) {
        console.error("Failed to reload boards:", error);
      }
    }

    if (date && timelineRef.current) {
      timelineRef.current.scrollToDate(date);
    }

    handleCloseEditModal();
  };

  const handleDeleteArchive = async () => {
    if (user) {
      try {
        const updatedBoards = await readBoardsWithTags();
        setBoards(updatedBoards);
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
      const tagMatch = node.tags?.[0]?.tag_name
        .toLowerCase()
        .includes(lowerQuery);
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

  const handleTagClick = (tag: NodeTag) => {
    setSelectedFilterTags((prev) => {
      const isSelected = prev.some(
        (t) => t.name === tag.name && t.color === tag.color
      );

      let newSelectedTags;
      if (isSelected) {
        newSelectedTags = prev.filter(
          (t) => !(t.name === tag.name && t.color === tag.color)
        );
      } else {
        newSelectedTags = [...prev, tag];
      }

      if (newSelectedTags.length === 0) {
        setMatchedNodeIds(new Set());
        setSearchQuery("");
      } else {
        const matches = new Set<string>();
        Object.values(nodeDataMap).forEach((node) => {
          const hasAnyTag = newSelectedTags.some((selectedTag) =>
            node.tags.some(
              (t) =>
                t.tag_name === selectedTag.name &&
                t.tag_color === selectedTag.color
            )
          );
          if (hasAnyTag) {
            matches.add(node.board_id);
          }
        });
        setMatchedNodeIds(matches);
        setSearchQuery("Tag fliter Activated");
      }

      return newSelectedTags;
    });
  };

  const handleToggleAnalysisPanel = () => {
    setIsAnalysisPanelOpen((prev) => !prev);
  };

  useEffect(() => {
    console.log("검색/필터링 매칭 노드:", matchedNodeIds);
  }, [matchedNodeIds]);

  useEffect(() => {
    const { signup_step } = router.query;

    if (window.opener && signup_step === "success") {
      const currentUrl = window.location.href;
      window.opener.location.href = currentUrl;
      window.close();
      return;
    }

    if (signup_step === "success") {
      setInitialSignUpStep("success");
      router.replace("/", undefined, { shallow: true });
    }
  }, [router.query, router]);

  useEffect(() => {
    console.log("isSignUpMode:", isSignUpMode);
  }, [isSignUpMode]);

  return (
    <>
      {/* Login Modal (z-index 50) - 헤더보다 위에 위치 */}
      <LoginModal
        isOpen={!user}
        onLogin={handleLogin}
        initialStep={initialSignUpStep}
        onSignUpModeChange={setIsSignUpMode}
      />

      <FullScreenLoadingOverlay visible={isLoggingOut}>
        <LoadingIcon spin fontSize={48} />
      </FullScreenLoadingOverlay>

      {user && (
        <AnalysisPanel
          isOpen={isAnalysisPanelOpen}
          onToggle={handleToggleAnalysisPanel}
          boards={boards}
          tags={rawTags}
        />
      )}

      {/* [수정됨] Header 
        - z-index: 50 (배경보다 무조건 위에 있어야 함)
        - pointer-events-none: 클릭 통과 (하위 버튼들은 auto로 설정)
      */}
      <header className="fixed top-0 left-0 right-0 pt-8 pb-8 pointer-events-none z-50">
        {/* User Nickname */}
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
                fontFamily: "Georgia, 'Pretendard', sans-serif",
                fontSize: "48px",
                fontWeight: "bold",
                lineHeight: "1",
              }}
            >
              {displayNameValue}'s
            </span>
          </div>
        )}

        {/* Linear Archive Title - 조건문 제거, 항상 렌더링 */}
        <h1
          className="text-center tracking-tight transition-all duration-700 ease-out"
          style={{
            fontFamily: "Georgia, sans-serif",
            fontSize: "96px",
            fontWeight: "bold",
            lineHeight: "1",
            transform: user ? "translateY(0)" : "translateY(40px)",
          }}
        >
          Linear Archive
        </h1>

        {/* Toolbar */}
        {user && (
          <div className="flex justify-center mt-6 pointer-events-auto">
            <Toolbar
              onNewArchive={handleToolbarNewArchive}
              onDateSelect={handleDateSelect}
              onSearch={handleOpenSearch}
              minYear={minYear}
              maxYear={maxYear}
            />
          </div>
        )}
      </header>

      {/* [수정됨] Main Content Background
        - z-index: 0 (가장 뒤로 보내서 헤더를 덮지 않게 함)
      */}
      <div
        className={`min-h-screen bg-[#F2F0EB] relative overflow-hidden flex flex-col transition-all duration-500 z-0 ${
          !user ? "blur-[2px]" : "blur-0"
        }`}
        style={{
          backgroundImage: `
            radial-gradient(circle, rgba(0, 0, 0, 0.15) 1px, transparent 1px),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23noise)' opacity='0.06'/%3E%3C/svg%3E")
          `,
          backgroundSize: "24px 24px, 400px 400px",
        }}
      >
        {/* Header Spacer - 헤더 높이만큼 공간 확보 */}
        <div
          className="transition-all duration-700 ease-out"
          style={{ height: user ? "320px" : "280px" }}
        />

        {/* Generate Tags Button (Dev Only/Temporary) */}
        {user && (
          <div className="fixed bottom-4 left-4 z-[99999] flex flex-col gap-2">
            <button
               onClick={async () => {
                 try {
                   console.log("Calling API route for generation...");
                   const res = await fetch('/api/generate-tags', { method: 'POST' });
                   const data = await res.json();
                   
                   if (!res.ok) throw new Error(data.error || "Generation failed");

                   console.log("Got tags from API. Inserting into Supabase...", data.items);

                   // Dynamically import supabase client
                   const { supabase } = await import("@/commons/libs/supabase/client");

                   // Add user_id to each item
                   const itemsWithUser = data.items.map((item: any) => ({
                       ...item,
                       user_id: user.id
                   }));

                   const { data: insertedData, error } = await supabase
                      .from("tags")
                      .insert(itemsWithUser)
                      .select();

                   if (error) {
                     alert(`Supabase Insert Error: ${error.message}`);
                   } else {
                     alert(`Success! Generated and saved ${insertedData?.length} tags.`);
                     window.location.reload(); 
                   }
                 } catch (e: any) {
                   console.error(e);
                   alert(`Failed: ${e.message}`);
                 }
               }}
               className="bg-black text-white px-4 py-2 rounded shadow hover:bg-gray-800 transition"
            >
              Generate Tags
            </button>
        {/* Generate Boards Button (Dev Only/Temporary) */}
            <button
               onClick={async () => {
                 try {
                   console.log("Calling API route for BOARD generation...");
                   
                   // 1. Prepare available tags
                   const availableTagNames = tags.map(t => t.name);
                   
                   const res = await fetch('/api/generate-boards', { 
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({ availableTags: availableTagNames })
                   });
                   const data = await res.json();
                   
                   if (!res.ok) throw new Error(data.error || "Generation failed");

                   console.log("Got boards from API. Creating via createBoard...", data.items);

                   // Dynamically import createBoard
                   const { createBoard } = await import("@/commons/libs/supabase/db");

                   // Process serially to avoid overwhelming Supabase or hitting rate limits
                   let success = 0;
                   let failed = 0;
                   
                   for (const item of data.items) {
                      try {
                          // Map string tags back to full tag objects { tag_name, tag_color }
                          // availableTags is a string array in response.
                          // We need to look up the color from our local 'tags' state.
                          const mappedTags = (item.tags || []).map((tagName: string) => {
                              const found = tags.find(t => t.name === tagName);
                              if (found) {
                                  return { tag_name: found.name, tag_color: found.color };
                              }
                              return null;
                          }).filter((t: any) => t !== null);

                          await createBoard({
                             description: item.description,
                             date: item.date,
                             tags: mappedTags,
                             image: null,
                             waitForEmbedding: true
                          });
                          success++;
                      } catch (err) {
                          console.error("Failed to create board:", item, err);
                          failed++;
                      }
                   }

                   if (failed > 0) {
                      alert(`Partial Success: ${success} created, ${failed} failed.`);
                   } else {
                      alert(`Success! Created ${success} boards.`);
                      window.location.reload();
                   }

                 } catch (e: any) {
                   console.error(e);
                   alert(`Failed: ${e.message}`);
                 }
               }}
               className="bg-black text-white px-4 py-2 rounded shadow hover:bg-gray-800 transition"
            >
              Generate Boards
            </button>
            
            {/* Clear All Button */}
            <button
              onClick={async () => {
                try {                  
                  // Delete Boards
                  const { error: boardError } = await supabase
                    .from('board')
                    .delete()
                    .eq('user_id', user.id);
                    
                  if (boardError) throw boardError;

                  // Delete Tags
                  const { error: tagError } = await supabase
                    .from('tags')
                    .delete()
                    .eq('user_id', user.id);

                  if (tagError) throw tagError;

                  // Delete User Analysis (compression history)
                  const { error: analysisError } = await supabase
                    .from('user_analysis')
                    .delete()
                    .eq('user_id', user.id);

                  if (analysisError) throw analysisError;

                  alert("모든 데이터가 삭제되었습니다");
                  window.location.reload();
                } catch (e: any) {
                  console.error(e);
                  alert(`삭제 실패: ${e.message}`);
                }
              }}
              className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-800 transition block mt-2"
            >
              Clear Data
            </button>
          </div>
        )}

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

        {/* Tags List */}
        <div className="flex justify-center overflow-hidden p-8 space-x-8">
          {tags.map((tag, index) => {
            const isSelected = selectedFilterTags.some(
              (t) => t.name === tag.name && t.color === tag.color
            );

            return (
              <button
                key={index}
                onClick={() => handleTagClick(tag)}
                className={`border px-2.5 py-1.5 flex items-center gap-1.5 transition-all shrink-0 ${
                  isSelected
                    ? "border-black bg-white opacity-100 shadow-sm"
                    : "border-gray-300 bg-[#F2F0EB] opacity-60 hover:opacity-100"
                }`}
              >
                <div
                  className="border border-black"
                  style={{
                    width: "13px",
                    height: "13px",
                    backgroundColor: tag.color,
                  }}
                />
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', 'Pretendard', monospace",
                    fontSize: "14px",
                  }}
                >
                  {tag.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Timeline Section */}
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
      </div>

      {/* Modals & Menu (z-index는 컴포넌트 내부나 fixed로 제어됨) */}
      
      {user && (
        <ProfileMenu
          onLogout={handleLogout}
          userNickname={displayNameValue}
        />
      )}

      {(() => {
        const currentViewNodeData =
          selectedNodeId !== null
            ? boardToNodeData(nodeDataMap[selectedNodeId])
            : undefined;

        return (
          <ViewArchiveModal
            isOpen={isViewModalOpen}
            onClose={handleCloseViewModal}
            onEdit={handleEditArchive}
            onDelete={handleDeleteArchive}
            currentNodeData={currentViewNodeData}
          />
        );
      })()}

      <ArchiveModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveArchive}
        onDelete={handleDeleteArchive}
        position={modalPosition}
        currentNodeData={
          selectedNodeId !== null
            ? boardToNodeData(nodeDataMap[selectedNodeId])
            : undefined
        }
      />
    </>
  );
}