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
  getDisplayName,
} from "@/commons/libs/supabase/auth";
import {
  BoardWithTags,
  readBoardsWithTags,
  getCurrentUserTags,
  deleteBoard, // Assuming deleteBoard exists in db.ts and takes boardId: string
} from "@/commons/libs/supabase/db";
import { Router, useRouter } from "next/router";
import { AnalysisPanel } from "@/design/components/AnalysisPanel";
import {
  LoadingOverlay,
  LoadingIcon,
} from "@/commons/libraries/loadingOverlay";
import styled from "@emotion/styled";

// 전체 화면을 덮는 로딩 오버레이
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
  const [selectedFilterTags, setSelectedFilterTags] = useState<NodeTag[]>([]);
  const [isAnalysisPanelOpen, setIsAnalysisPanelOpen] = useState(false); // AnalysisPanel 상태 추가
  const [isLoggingOut, setIsLoggingOut] = useState(false); // 로그아웃 로딩 상태 추가
  const [initialSignUpStep, setInitialSignUpStep] = useState<
    "email" | "check_email" | "success" | null
  >(null); // 초기 회원가입 단계
  const [isSignUpMode, setIsSignUpMode] = useState(false); // LoginModal 회원가입 모드 상태

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
        ? new Date(`${board.date}T${board.time ?? "00:00:00"}`)
        : undefined,
    };
  }

  const checkUser = async () => {
    try {
      const session = await getSession();
      if (session?.user) {
        // 상태가 실제로 변경될 때만 업데이트하여 불필요한 리렌더링 방지
        const displayName =
          (session.user.user_metadata?.display_name as string) || null;

        // 이메일 인증 완료 후 success 단계로 이동 (닉네임은 이미 입력됨)
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
        // user가 이미 null이 아닐 때만 null로 설정
        if (user !== null) {
          setUser(null);
          setDisplayNameValue(null);
          setInitialSignUpStep(null); // 사용자가 없을 때 초기화
        }
      }
    } catch (err) {
      // 에러 발생 시에만 상태 업데이트
      if (user !== null) {
        setUser(null);
        setDisplayNameValue(null);
        setInitialSignUpStep(null); // 에러 시에도 초기화
      }
    }
  };

  const timelineRef = useRef<{ scrollToDate: (date: Date) => void }>(null);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (!user) {
      setBoards([]); // 또는 아무것도 하지 않기
      return;
    }
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
        const tags = await getCurrentUserTags();
        // Tag 타입을 NodeTag 타입으로 변환
        const nodeTags: NodeTag[] = tags.map((tag) => ({
          name: tag.tag_name,
          color: tag.tag_color,
        }));
        setTags(nodeTags);
      } catch (error) {
        console.error("Failed to load tags:", error);
        setTags([]);
      }
    };
    loadTags();
  }, [user]);

  const handleLogin = () => {
    checkUser();
  };

  const handleLogout = async () => {
    setIsLoggingOut(true); // 로딩 시작
    try {
      await signOut();
      setUser(null);
      setDisplayNameValue(null);
      setInitialSignUpStep(null); // 회원가입 단계 초기화
    } catch (err: any) {
      console.error(err.message || "로그아웃 실패");
    } finally {
      setIsLoggingOut(false); // 로딩 종료
    }
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

  const handleSaveArchive = async (date: Date | null) => {
    // 저장 후 데이터 다시 불러오기
    if (user) {
      try {
        const updatedBoards = await readBoardsWithTags();
        setBoards(updatedBoards);
      } catch (error) {
        console.error("Failed to reload boards:", error);
      }
    }

    // Scroll to date if provided
    if (date && timelineRef.current) {
      timelineRef.current.scrollToDate(date);
    }

    handleCloseEditModal();
  };

  const handleDeleteArchive = async () => {
    // 삭제 후 데이터 다시 불러오기
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
      // Search by tag name
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
      // 이미 선택된 태그인지 확인
      const isSelected = prev.some(
        (t) => t.name === tag.name && t.color === tag.color
      );

      let newSelectedTags;
      if (isSelected) {
        // 이미 선택된 태그면 제거
        newSelectedTags = prev.filter(
          (t) => !(t.name === tag.name && t.color === tag.color)
        );
      } else {
        // 선택되지 않은 태그면 추가
        newSelectedTags = [...prev, tag];
      }

      // 필터링 업데이트
      if (newSelectedTags.length === 0) {
        setMatchedNodeIds(new Set());
        setSearchQuery("");
      } else {
        const matches = new Set<string>();
        Object.values(nodeDataMap).forEach((node) => {
          // 선택된 태그 중 하나라도 가지고 있으면 매칭
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

  // URL 쿼리 파라미터 확인
  useEffect(() => {
    const { signup_step } = router.query;

    // 새 창에서 열린 경우 부모 창으로 리다이렉트
    if (window.opener && signup_step === "success") {
      const currentUrl = window.location.href;
      window.opener.location.href = currentUrl;
      window.close();
      return;
    }

    // 이메일 인증 완료 후 success 단계로 이동
    if (signup_step === "success") {
      setInitialSignUpStep("success");
      // 쿼리 파라미터 제거 (URL 정리)
      router.replace("/", undefined, { shallow: true });
    }
  }, [router.query, router]);

  return (
    <>
      {/* Login Modal */}
      <LoginModal
        isOpen={!user}
        onLogin={handleLogin}
        initialStep={initialSignUpStep}
        onSignUpModeChange={setIsSignUpMode}
      />

      {/* Logout Loading Overlay */}
      <FullScreenLoadingOverlay visible={isLoggingOut}>
        <LoadingIcon spin fontSize={48} />
      </FullScreenLoadingOverlay>

      {user && (
        <AnalysisPanel
          isOpen={isAnalysisPanelOpen}
          onToggle={handleToggleAnalysisPanel}
          boards={boards}
        />
      )}

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

        {/* Linear Archive Title - 회원가입 모드일 때 숨김 */}
        {!isSignUpMode && (
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
        )}

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

        {/* Generate Tags Button (Dev Only/Temporary) */}
        {user && (
          <div className="absolute top-4 right-4 z-[200]">
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
              Generate Tags (Server)
            </button>
          </div>
        )}

        {/* Generate Boards Button (Dev Only/Temporary) */}
        {user && (
          <div className="absolute top-16 right-4 z-[200]">
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
                             image: null
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

        {/* Tags List - Below Search Bar */}
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
                    fontFamily: "SF Mono, Menlo, Monaco, Consolas, monospace",
                    fontSize: "14px",
                  }}
                >
                  {tag.name}
                </span>
              </button>
            );
          })}
        </div>

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

        {/* Archive Modal */}
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
      </div>
    </>
  );
}
