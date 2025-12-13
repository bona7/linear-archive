
import { createClient } from "@supabase/supabase-js";
import { getPostImageUrl } from "../commons/libs/supabase/storage";
import { supabase } from "../commons/libs/supabase/client";
import { readBoardsWithTags } from "../commons/libs/supabase/db";

// This script needs to be run in a context where Supabase client is initialized.
// Since this is a utility script that might be run manually or imported, we'll expose a function.

export const backfillHasImage = async () => {
    console.log("Starting backfill for has_image column...");

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error("User not authenticated. Please login first.");
            return;
        }

        // Fetch all boards
        const { data: boards, error } = await supabase
            .from("board")
            .select("board_id, user_id, has_image");

        if (error) {
            console.error("Failed to fetch boards:", error);
            return;
        }

        console.log(`Checking ${boards.length} boards...`);
        let updatedCount = 0;

        for (const board of boards) {
            // Check if image exists in storage
            const imageUrl = await getPostImageUrl(board.board_id, board.user_id);
            const hasImage = !!imageUrl;

            // Only update if the value is different (or currently null/false but basically we just force sync)
            if (hasImage !== board.has_image) {
                const { error: updateError } = await supabase
                    .from("board")
                    .update({ has_image: hasImage })
                    .eq("board_id", board.board_id);

                if (updateError) {
                    console.error(`Failed to update board ${board.board_id}:`, updateError);
                } else {
                    console.log(`Updated board ${board.board_id}: has_image = ${hasImage}`);
                    updatedCount++;
                }
            }
        }

        console.log(`Backfill complete. Updated ${updatedCount} boards.`);

    } catch (e) {
        console.error("Backfill failed:", e);
    }
};

// If running directly in a suitable environment (e.g. node script with polyfills), you'd call it here.
// But mostly this will be imported or run via a UI button for safety.
