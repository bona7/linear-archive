import { getSession } from "../libs/supabase/auth";
import { supabase } from "@/commons/libs/supabase/client";
import {
  BoardWithTags,
  readBoardsWithTags,
  getUserAnalysis,
} from "../libs/supabase/db";
import { Statistics, StatHighlight } from "./calculate";

export const fetchAnalysis = async (
  boards: BoardWithTags[], 
  statistics: Statistics,
  randomMetrics: StatHighlight[],
  isUserQuery: boolean = false // NEW: flag to indicate if this is a user query
) => {
  try {
    const session = await getSession();

    if (!session?.access_token) {
      throw new Error("No session available for analysis call");
    }

    // Fetch history (compressed_data) and board counter
    const analysisData = await getUserAnalysis();
    const history = analysisData?.compressed_data || "";
    const boardsSinceCompression = analysisData?.boards_since_last_compression ?? 0;

    // For GENERAL ANALYSIS (분석/재분석): Only send boards since last compression
    // For USER QUERY: boards are already filtered by RAG logic in AnalysisPanel
    let boardsToSend = boards;

    if (!isUserQuery) {
      if (boardsSinceCompression > 0) {
        // Send only the most recent N boards where N = boards_since_last_compression
        // Boards are already sorted by date descending in readBoardsWithTags
        boardsToSend = boards.slice(0, boardsSinceCompression);
      } else {
        // Counter is 0: Either first-time analysis or all boards already compressed
        // For first-time analysis, analyze all boards
        // For subsequent analyses after compression, there are no new boards
        if (boards.length > 0 && !history) {
          // First-time analysis: no history exists, analyze all boards
          boardsToSend = boards;
        } else {
          // All boards already compressed, no new boards to analyze
          return null;
        }
      }
    }

    if (boardsToSend.length === 0) {
      return null;
    }

    // Build payload conditionally
    // For USER QUERY RAG: Only send boards and history (no stats/metrics)
    // For GENERAL ANALYSIS: Send boards, stats, metrics, and history
    const payload: any = {
      boards: boardsToSend,
      history: history || ""
    };

    if (!isUserQuery) {
      // Only include stats and metrics for general analysis
      payload.statistics = statistics;
      payload.metrics = randomMetrics;
    }

    const response = await fetch(
      "https://4iy42lphh8.execute-api.ap-northeast-2.amazonaws.com/dev/deepseek/analysis",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(`Analysis API error: ${response.status}`);
    }

    const data = await response.json();

    // Parse the body if it's a string
    const parsedData =
      typeof data.body === "string" ? JSON.parse(data.body) : data;

    // Return the analysis data
    return parsedData.analysis;
  } catch (error) {
    console.error("Analysis call failed:", error);
    throw error; // Re-throw the error for the caller to handle
  }
};

export interface QueryFilters {
  startDate: string | null;
  endDate: string | null;
  tags: string[];
  keywords: string[];
  daysOfWeek: number[] | null;
  hasImage: boolean | null;
  sort: "newest" | "oldest" | "random" | null;
  limit: number | null;
}

export const fetchQueryParsing = async (query: string): Promise<QueryFilters | null> => {
  try {
    const session = await getSession();

    if (!session?.access_token) {
      throw new Error("No session available for query parsing");
    }

    const response = await fetch(
      "https://4iy42lphh8.execute-api.ap-northeast-2.amazonaws.com/dev/deepseek/analysis",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: "query_parser",
          query: query,
          current_date: new Date().toISOString().split('T')[0]
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Query Parser API error: ${response.status}`);
    }

    const data = await response.json();
    const parsedData = typeof data.body === "string" ? JSON.parse(data.body) : data;
    
    return parsedData.filters;
  } catch (error) {
    console.error("Query parsing failed:", error);
    return null;
  }
};

export const fetchSemanticSearchBoards = async (query: string): Promise<string[] | null> => {
  try {
    const session = await getSession();

    if (!session?.access_token) {
      throw new Error("No session available for semantic search");
    }

    // Similarity search Lambda endpoint
    const response = await fetch(
      "https://4iy42lphh8.execute-api.ap-northeast-2.amazonaws.com/dev/deepseek/similarity-search",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: "search_only",
          query: query,
          user_id: session.user.id,
          access_token: session.access_token,
          refresh_token: session.refresh_token, 
        }),
      }
    );

    if (!response.ok) {
        throw new Error(`Semantic Search API error: ${response.status}`);
    }

    const data = await response.json();
    // Lambda wrapper might return 'body' as string
    const parsed = typeof data.body === "string" ? JSON.parse(data.body) : data;

    if (parsed.boards) {
        return parsed.boards.map((b: any) => b.board_id);
    }
    return [];

  } catch (error) {
      console.error("Semantic search failed:", error);
      return null;
  }
}

export const triggerDataCompression = async (boards: any[], userId: string): Promise<any> => {
  try {
    const session = await getSession();

    if (!session?.access_token) {
      throw new Error("No session available for compression");
    }

    const response = await fetch(
      "/api/proxy-compression",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          access_token: session.access_token,
          user_id: userId,
          boards: boards
        }),
      }
    );

    if (!response.ok) {
        // Log but don't fail the app?
        console.error(`Compression API error: ${response.status}`);
        return null;
    }

    const data = await response.json();
    return data;

  } catch (error) {
      console.error("Compression trigger failed:", error);
      return null;
  }
}

export const fetchQuickInsight = async (
  boards: BoardWithTags[],
  statistics: Statistics,
  action: "create" | "update" | "delete" = "create",
  targetBoardId?: string,
  explicitTargetBoard?: BoardWithTags
): Promise<string | null> => {
  try {
    const session = await getSession();
    if (!session?.access_token) {
      return null;
    }

    // Determine target board: use explicit if provided, otherwise find by ID
    let targetBoard = explicitTargetBoard || boards.find(b => b.board_id === targetBoardId) || boards[0];

    if (!targetBoard) {
      console.error("No target board available");
      return null;
    }

    // Fetch user's compressed history
    const analysisData = await getUserAnalysis();
    const history = analysisData?.compressed_data || "";

    // Extract simple stats
    const stats = {
      mostActiveDay: statistics.habits?.mostActiveDay || "N/A",
      currentStreak: statistics.habits?.currentStreak || 0,
      totalBoards: statistics.counts?.totalBoards || 0,
    };

    // RAG: Find similar boards for pattern detection
    let relatedBoards: BoardWithTags[] = [];
    if (targetBoard.description || targetBoard.tags.length > 0) {
      const searchQuery = [
        targetBoard.description,
        ...targetBoard.tags.map(t => t.tag_name)
      ].filter(Boolean).join(" ");

      if (searchQuery.trim()) {
        const similarBoardIds = await fetchSemanticSearchBoards(searchQuery);
        if (similarBoardIds && similarBoardIds.length > 0) {
          relatedBoards = boards
            .filter(b => similarBoardIds.includes(b.board_id) && b.board_id !== targetBoard?.board_id)
            .slice(0, 5);
        }
      }
    }

    const payload = {
      task: "quick_insight",
      target_board: targetBoard,
      related_boards: relatedBoards,
      stats: stats,
      history: history,
      action: action,
    };

    const response = await fetch(
      "https://4iy42lphh8.execute-api.ap-northeast-2.amazonaws.com/dev/deepseek/analysis",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      console.error(`Quick Insight API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const parsedData = typeof data.body === "string" ? JSON.parse(data.body) : data;

    return parsedData.insight || null;
  } catch (error) {
    console.error("Quick insight failed:", error);
    return null;
  }
}
