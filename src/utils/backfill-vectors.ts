import { supabase } from "@/commons/libs/supabase/client";
import { CallEmbedding } from "@/commons/libs/voyage/embeddingClient";
import { getPostImageUrl } from "@/commons/libs/supabase/storage";

/**
 * Diagnostic: Find all boards missing vectors
 */
export async function findBoardsWithoutVectors() {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const { data: boards, error } = await supabase
    .from("board")
    .select(`
      board_id,
      description,
      date,
      vector,
      board_tag_jointable (
        tags (tag_name)
      )
    `)
    .eq("user_id", user.user.id)
    .order("date", { ascending: false });

  if (error) throw error;

  const boardsWithoutVectors = boards?.filter(b => !b.vector) || [];
  
  console.log(`Total boards: ${boards?.length || 0}`);
  console.log(`Boards WITHOUT vectors: ${boardsWithoutVectors.length}`);
  console.log(`Boards WITH vectors: ${(boards?.length || 0) - boardsWithoutVectors.length}`);

  return boardsWithoutVectors;
}

/**
 * Backfill vectors for boards that are missing them
 */
export async function backfillMissingVectors(batchSize = 5, delayMs = 2000) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");

  const boardsWithoutVectors = await findBoardsWithoutVectors();
  
  if (boardsWithoutVectors.length === 0) {
    console.log("✅ All boards have vectors!");
    return { success: true, processed: 0, failed: 0 };
  }

  console.log(`\n🔄 Starting backfill for ${boardsWithoutVectors.length} boards...`);
  console.log(`Processing in batches of ${batchSize} with ${delayMs}ms delay\n`);

  let processed = 0;
  let failed = 0;

  for (let i = 0; i < boardsWithoutVectors.length; i += batchSize) {
    const batch = boardsWithoutVectors.slice(i, i + batchSize);
    
    console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(boardsWithoutVectors.length / batchSize)}`);

    const promises = batch.map(async (board: any) => {
      try {
        const tags = board.board_tag_jointable
          ?.map((bt: any) => bt.tags?.tag_name)
          .filter(Boolean)
          .join(", ") || "";

        // Get image URL if exists
        const imageUrl = await getPostImageUrl(board.board_id, user.user!.id);

        console.log(`  ⏳ Processing board ${board.board_id.substring(0, 8)}...`);

        await CallEmbedding({
          user_id: user.user!.id,
          board_id: board.board_id,
          image: imageUrl,
          description: board.description || "",
          tags: tags,
          date: board.date || new Date().toISOString(),
        });

        console.log(`  ✅ Success: ${board.board_id.substring(0, 8)}`);
        processed++;
      } catch (error: any) {
        console.error(`  ❌ Failed: ${board.board_id.substring(0, 8)} - ${error.message}`);
        failed++;
      }
    });

    await Promise.allSettled(promises);

    // Delay between batches to avoid rate limiting
    if (i + batchSize < boardsWithoutVectors.length) {
      console.log(`  ⏸️  Waiting ${delayMs}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  console.log(`\n✨ Backfill complete!`);
  console.log(`   Processed: ${processed}`);
  console.log(`   Failed: ${failed}`);

  return { success: true, processed, failed };
}
