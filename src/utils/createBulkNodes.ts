import { createBoard, getCurrentUserTags } from "../commons/libs/supabase/db";

export interface BulkNodeCreationResult {
  success: number;
  failed: number;
  errors: string[];
}

/**
 * 같은 날짜에 여러 노드를 대량 생성하는 매크로 함수
 *
 * @param count 생성할 노드 개수
 * @param date 날짜 (YYYY-MM-DD 형식, 생략 시 오늘 날짜)
 * @param delayMs 요청 간 딜레이 (밀리초, 기본값 100ms)
 * @returns 생성 결과 통계
 *
 * @example
 * // 오늘 날짜에 100개 노드 생성
 * await window.createBulkNodes(100);
 *
 * // 특정 날짜에 50개 노드 생성
 * await window.createBulkNodes(50, '2025-01-15');
 *
 * // 특정 날짜에 200개 노드 생성, 요청 간 50ms 딜레이
 * await window.createBulkNodes(200, '2025-01-15', 50);
 */
export const createBulkNodes = async (
  count: number,
  date?: string,
  delayMs: number = 100
): Promise<BulkNodeCreationResult> => {
  try {
    // Get user tags
    const tags = await getCurrentUserTags();
    if (tags.length === 0) {
      throw new Error("No tags found. Please create at least one tag first.");
    }

    // Use provided date or today's date
    const targetDate = date || new Date().toISOString().split("T")[0];
    const targetTime = "00:00:00";

    console.log(`Creating ${count} nodes for date: ${targetDate}`);
    console.log(`Using tag: ${tags[0].tag_name} (${tags[0].tag_color})`);
    console.log(`Delay between requests: ${delayMs}ms`);

    const results: BulkNodeCreationResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < count; i++) {
      try {
        await createBoard({
          description: `Test Node ${
            i + 1
          } - ${new Date().toLocaleTimeString()}`,
          date: targetDate,
          time: targetTime,
          tags: [
            {
              tag_name: tags[0].tag_name,
              tag_color: tags[0].tag_color,
            },
          ],
        });

        results.success++;
        console.log(`✓ Created node ${i + 1}/${count}`);

        // Delay between requests to avoid overwhelming the server
        if (i < count - 1) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      } catch (error: any) {
        results.failed++;
        const errorMsg = error.message || "Unknown error";
        results.errors.push(`Node ${i + 1}: ${errorMsg}`);
        console.error(`✗ Failed to create node ${i + 1}:`, errorMsg);
      }
    }

    console.log("\n=== Bulk Creation Complete ===");
    console.log(`Success: ${results.success}`);
    console.log(`Failed: ${results.failed}`);
    if (results.errors.length > 0) {
      console.log("Errors:", results.errors);
    }

    return results;
  } catch (error: any) {
    console.error("Bulk creation failed:", error);
    throw error;
  }
};
