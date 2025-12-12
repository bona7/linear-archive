import { getSession } from "../supabase/auth";
export interface EmbeddingInput {
  user_id: string;
  board_id: string;
  image: string | null;
  description: string;
  tags: string;
  date: string;
}

export async function CallEmbedding(input: EmbeddingInput) {
  const session = await getSession();
  if (!session) throw new Error("No session available");

  const payload = {
    user_id: input.user_id,
    board_id: input.board_id,
    image: input.image,
    description: input.description,
    tags: input.tags,
    date: input.date,
  };

  const res = await fetch(
    "https://6igi7vf3u9.execute-api.ap-northeast-2.amazonaws.com/dev/getEmbeddings",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );
  console.log("Embedding API response status:", res.status);

  if (!res.ok) {
    throw new Error(`Embedding API error: ${res.status}`);
  }

  return res.json();
}
