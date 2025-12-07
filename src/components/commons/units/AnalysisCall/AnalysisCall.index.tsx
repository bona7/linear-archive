import { getSession } from "../../../../commons/libs/supabase/auth";
import {
  BoardWithTags,
  readBoardsWithTags,
} from "../../../../commons/libs/supabase/db";

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
