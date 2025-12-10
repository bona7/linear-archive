import { getSession } from "../libs/supabase/auth";
import { supabase } from "@/commons/libs/supabase/client";
import {
  BoardWithTags,
  readBoardsWithTags,
} from "../libs/supabase/db";

export const fetchAnalysis = async (boards: BoardWithTags[]) => {
  try {
    const session = await getSession();

    if (!session?.access_token) {
      throw new Error("No session available for analysis call");
    }

    // const boards = await readBoardsWithTags();

    if (boards.length === 0) {
      console.log("No boards to analyze");
      return null;
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
          boards: boards,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Analysis API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Analysis API response (raw):", data);

    // Parse the body if it's a string
    const parsedData =
      typeof data.body === "string" ? JSON.parse(data.body) : data;
    console.log("Analysis API response (parsed):", parsedData);
    console.log("Analysis details:", parsedData.analysis);

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

    // deepseek_test is the lambda that handles embedding + vector search
    // We now use task='search_only' to get just the boards
    const response = await fetch(
      "https://4iy42lphh8.execute-api.ap-northeast-2.amazonaws.com/dev/deepseek/embedding",
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
    
    console.log("Vector Search Results:", parsed);

    if (parsed.boards) {
        // Return descriptions or IDs? The current logic searches in Supabase and returns 'description', 'date', 'tags'
        // But we need to match them back to client-side boards.
        // The lambda currently DOES NOT return board_id. We need to fix that or fuzzy match.
        // It's safer to rely on content, BUT let's assume we map by (date + description).
        // For now, let's just return descriptors to debug.
        // WAIT: The best way is to update 'match_boards_updated.sql' to return board_id, 
        // AND update lambda to return it.
        // Note: The 'match_boards' function ALREADY returns board_id!
        // The lambda just needs to include it in the response.
        
        // Assuming I fixed the lambda to return full objects including IDs?
        // Actually, looking at my previous lambda edit, I only returned date/desc/tags in 'relevant_boards'.
        // The 'relevant_boards' variable in lambda comes from 'similarity_response.data'.
        // If 'match_boards' returns board_id, then similarity_response.data has it.
        // So I just need to make sure the lambda passes it through.
        
        // In the lambda:
        // boards_dict = { ... } (used for LLM context)
        // But for 'search_only' I returned 'relevant_boards' directly.
        // 'relevant_boards' is the raw list from supabase.rpc.
        // Supabase RPC 'match_boards' returns table (board_id uuid, ...).
        // So yes, board_id IS in the response!
        
        return parsed.boards.map((b: any) => b.board_id);
    }
    return [];

  } catch (error) {
      console.error("Semantic search failed:", error);
      return null;
  }
}

export const triggerDataCompression = async (boards: any[]): Promise<any> => {
  try {
    const session = await getSession();

    if (!session?.access_token) {
      throw new Error("No session available for compression");
    }

    const response = await fetch(
      "https://tuhvcir4psw7qm7o5utqjasjky0uxgyr.lambda-url.ap-northeast-2.on.aws/",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
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
    console.log("Data Compression Triggered:", data);
    return data;

  } catch (error) {
      console.error("Compression trigger failed:", error);
      return null;
  }
}
