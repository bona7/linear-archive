import { createBoard, getCurrentUserTags } from "../commons/libs/supabase/db";

export interface SequentialResult {
  success: number;
  failed: number;
  errors: string[];
}

/**
 * 날짜를 하루씩 증가시키며 노드를 생성하는 매크로
 * @param startDate 시작 날짜 (YYYY-MM-DD), 기본값 2025-01-01
 * @param days 생성할 일수 (= 노드 개수), 기본값 100
 * @param delayMs 요청 간 딜레이(ms), 기본값 100
 */
export const createSequentialNodes = async (
  startDate = "2025-01-01",
  days = 100,
  delayMs = 100
): Promise<SequentialResult> => {
  const tags = await getCurrentUserTags();
  if (tags.length === 0) {
    throw new Error("태그가 없습니다. 먼저 태그를 하나 이상 생성하세요.");
  }

  const [y, m, d] = startDate.split("-").map(Number);
  if (!y || !m || !d) {
    throw new Error("startDate는 YYYY-MM-DD 형식이어야 합니다.");
  }
  const start = new Date(y, m - 1, d);

  const results: SequentialResult = { success: 0, failed: 0, errors: [] };

  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    try {
      await createBoard({
        description: `Seq Node ${i + 1} - ${dateStr}`,
        date: dateStr,
        time: "00:00:00",
        tags: [{ tag_name: tags[0].tag_name, tag_color: tags[0].tag_color }],
      });
      results.success++;
      console.log(`✓ ${dateStr} 생성 (${i + 1}/${days})`);
      if (i < days - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (e: any) {
      results.failed++;
      const msg = e?.message || "Unknown error";
      results.errors.push(`${dateStr}: ${msg}`);
      console.error(`✗ ${dateStr} 실패:`, msg);
    }
  }

  console.log("완료:", results);
  return results;
};
