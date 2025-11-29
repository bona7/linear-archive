import { supabase } from "./client";
import { uploadPostImage, getPostImageUrl } from "./storage";

// 타입 정의
export interface Board {
  board_id: string;
  user_id: string;
  description: string | null;
  date: string | null;
}

export interface Tag {
  tag_id: string;
  tag_name: string;
  tag_color: string;
}

export interface BoardTagJointable {
  board_id: string;
  tag_id: string;
}

export interface BoardWithTags extends Board {
  tags: Tag[];
  image_url?: string | null;
}

// Create 함수 파라미터
export interface CreateBoardParams {
  description?: string;
  date?: string;
  tags: Array<{
    tag_name: string;
    tag_color: string;
  }>;
  image?: File;
}

/**
 * CREATE - board, tags, board_tag_jointable, 이미지 모두 생성
 * 한 번의 함수 호출로 모든 것을 처리
 * 스키마: N:1 관계이므로 사용자는 여러 board 생성 가능
 */
export async function createBoard(params: CreateBoardParams) {
  // 1. 현재 사용자 ID 가져오기
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("User not authenticated");
  }
  const userId = user.id;

  // 2. board_id 미리 생성 (이미지 업로드에 사용)
  const boardId = crypto.randomUUID();

  try {
    // 3. 이미지 업로드 (이미지가 있는 경우)
    let imageUrl: string | null = null;
    if (params.image) {
      console.log("--- [DEBUG] 이미지 업로드 시작 ---");
      console.log("File:", params.image);
      console.log("Board ID:", boardId);
      console.log("User ID:", userId);
      try {
        const { publicUrl } = await uploadPostImage({
          file: params.image,
          postUuid: boardId,
          userId: userId,
        });
        imageUrl = publicUrl;
        console.log("--- [DEBUG] 이미지 업로드 성공 ---");
        console.log("Public URL:", imageUrl);
      } catch (uploadError: any) {
        console.error("--- [DEBUG] 이미지 업로드 실패 ---", uploadError);
        throw new Error(`Image upload failed: ${uploadError.message}`);
      }
    }

    // 4. board 테이블에 삽입
    const { data: boardData, error: boardError } = await supabase
      .from("board")
      .insert([
        {
          board_id: boardId,
          user_id: userId,
          description: params.description || null,
          date: params.date || null,
        },
      ])
      .select()
      .maybeSingle();

    if (boardError) {
      // 이미지가 업로드되었다면 롤백
      if (imageUrl) {
        const { deletePostImage } = await import("./storage");
        await deletePostImage(boardId, userId);
      }
      throw new Error(`Failed to create board: ${boardError.message}`);
    }

    // 5. tags 처리 및 board_tag_jointable에 연결
    const tagIds: string[] = [];

    for (const tag of params.tags) {
      // 기존 태그 확인 (tag_name으로)
      let tagId: string;

      const { data: existingTag } = await supabase
        .from("tags")
        .select("tag_id")
        .eq("tag_name", tag.tag_name)
        .maybeSingle();

      if (existingTag) {
        // 기존 태그 사용
        tagId = existingTag.tag_id;
      } else {
        // 새 태그 생성
        const { data: newTag, error: tagError } = await supabase
          .from("tags")
          .insert([
            {
              tag_name: tag.tag_name,
              tag_color: tag.tag_color,
            },
          ])
          .select()
          .single();

        if (tagError) {
          throw new Error(`Failed to create tag: ${tagError.message}`);
        }
        tagId = newTag.tag_id;
      }

      tagIds.push(tagId);
    }

    // 6. board_tag_jointable에 연결 삽입
    if (tagIds.length > 0) {
      const jointableData = tagIds.map((tagId) => ({
        board_id: boardId,
        tag_id: tagId,
      }));

      const { error: jointError } = await supabase
        .from("board_tag_jointable")
        .insert(jointableData);

      if (jointError) {
        throw new Error(
          `Failed to create board-tag connections: ${jointError.message}`
        );
      }
    }

    // 7. 결과 반환 (tags 포함)
    const { data: tagsData } = await supabase
      .from("tags")
      .select("*")
      .in("tag_id", tagIds);

    return {
      ...boardData,
      tags: tagsData || [],
      image_url: imageUrl,
    } as BoardWithTags;
  } catch (error: any) {
    // 에러 발생 시 롤백 처리
    // board 삭제
    await supabase.from("board").delete().eq("board_id", boardId);

    // board_tag_jointable 삭제
    await supabase.from("board_tag_jointable").delete().eq("board_id", boardId);

    // 이미지 삭제
    try {
      const { deletePostImage } = await import("./storage");
      await deletePostImage(boardId, userId);
    } catch (imgError) {
      // 이미지 삭제 실패는 무시
    }

    throw error;
  }
}

/**
 * READ1 - 전체 게시글 조회하되, boards와 tags만 가져오기 (이미지 제외)
 * 현재 인증된 사용자의 board만 반환 (RLS가 자동 필터링)
 */
export async function readBoardsWithTags(): Promise<BoardWithTags[]> {
  // 현재 사용자 인증 확인
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("board")
    .select(
      `
      *,
      board_tag_jointable (
        tag_id,
        tags (
          tag_id,
          tag_name,
          tag_color
        )
      )
    `
    )
    .order("date", { ascending: false });

  if (error) {
    throw new Error(`Failed to read boards: ${error.message}`);
  }

  // 데이터 변환
  const result: BoardWithTags[] = (data || []).map((board: any) => {
    const tags = (board.board_tag_jointable || [])
      .map((joint: any) => joint.tags)
      .filter((tag: any) => tag !== null);

    return {
      board_id: board.board_id,
      user_id: board.user_id,
      description: board.description,
      date: board.date,
      tags: tags,
    };
  });

  return result;
}

/**
 * READ2 - 전체 게시글을 조회하되, boards, tags, 그리고 이미지까지 가져오기
 * 현재 인증된 사용자의 board만 반환 (RLS가 자동 필터링)
 * 이건 쓸 일 없음
 */
export async function readBoardsWithTagsAndImages(): Promise<BoardWithTags[]> {
  // 1. boards와 tags 가져오기
  const boards = await readBoardsWithTags();

  // 2. 각 board에 대해 이미지 URL 가져오기
  const boardsWithImages = await Promise.all(
    boards.map(async (board) => {
      const imageUrl = await getPostImageUrl(board.board_id, board.user_id);
      return {
        ...board,
        image_url: imageUrl,
      };
    })
  );

  return boardsWithImages;
}

/**
 * READ3 - 단일 board 조회 (tags, 이미지 모두 포함)
 * 현재 인증된 사용자의 board만 조회 가능 (RLS가 자동 필터링)
 */
export async function readBoardById(
  boardId: string,
  includeImage: boolean = false
): Promise<BoardWithTags | null> {
  // 현재 사용자 인증 확인
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("board")
    .select(
      `
      *,
      board_tag_jointable (
        tag_id,
        tags (
          tag_id,
          tag_name,
          tag_color
        )
      )
    `
    )
    .eq("board_id", boardId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // 게시글이 없거나 RLS 정책에 의해 접근 불가능한 경우
      return null;
    }
    throw new Error(`Failed to get board: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const tags = (data.board_tag_jointable || [])
    .map((joint: any) => joint.tags)
    .filter((tag: any) => tag !== null);

  const result: BoardWithTags = {
    board_id: data.board_id,
    user_id: data.user_id,
    description: data.description,
    date: data.date,
    tags: tags,
  };

  // 이미지 포함 여부
  if (includeImage) {
    result.image_url = await getPostImageUrl(boardId, data.user_id);
  }

  return result;
}

/**
 * 현재 사용자가 사용한 모든 태그 조회
 * 태그 자동완성 등에 사용
 */
export async function getCurrentUserTags(): Promise<Tag[]> {
  // 현재 사용자 인증 확인
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  // tags 테이블에서 직접 조회 (RLS가 자동으로 현재 사용자의 태그만 필터링)
  const { data, error } = await supabase
    .from("tags")
    .select("tag_id, tag_name, tag_color")
    .order("tag_name", { ascending: true });

  if (error) {
    throw new Error(`Failed to get tags: ${error.message}`);
  }

  return (data || []) as Tag[];
}

/**
 * UPDATE - board 수정
 * 현재 인증된 사용자의 board만 수정 가능 (RLS가 자동 필터링)
 */
export async function updateBoard(
  boardId: string,
  updates: {
    description?: string;
    date?: string;
    tags?: Array<{ tag_name: string; tag_color: string }>;
    image?: File;
  }
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  // board 업데이트 (현재 사용자의 board만 수정 가능)
  const boardUpdates: any = {};
  if (updates.description !== undefined)
    boardUpdates.description = updates.description;
  if (updates.date !== undefined) boardUpdates.date = updates.date;

  if (Object.keys(boardUpdates).length > 0) {
    const { error: boardError } = await supabase
      .from("board")
      .update(boardUpdates)
      .eq("board_id", boardId);

    if (boardError) {
      throw new Error(`Failed to update board: ${boardError.message}`);
    }
  }

  // tags 업데이트
  if (updates.tags) {
    // 기존 연결 삭제
    await supabase.from("board_tag_jointable").delete().eq("board_id", boardId);

    // 새 tags 처리 (create와 동일한 로직)
    const tagIds: string[] = [];
    for (const tag of updates.tags) {
      const { data: existingTag } = await supabase
        .from("tags")
        .select("tag_id")
        .eq("tag_name", tag.tag_name)
        .single();

      let tagId: string;
      if (existingTag) {
        tagId = existingTag.tag_id;
      } else {
        const { data: newTag } = await supabase
          .from("tags")
          .insert([{ tag_name: tag.tag_name, tag_color: tag.tag_color }])
          .select()
          .single();
        tagId = newTag!.tag_id;
      }
      tagIds.push(tagId);
    }

    // 새 연결 생성
    if (tagIds.length > 0) {
      const jointableData = tagIds.map((tagId) => ({
        board_id: boardId,
        tag_id: tagId,
      }));

      await supabase.from("board_tag_jointable").insert(jointableData);
    }
  }

  // 이미지 업데이트
  if (updates.image) {
    await uploadPostImage({
      file: updates.image,
      postUuid: boardId,
      userId: user.id,
    });
  }
}

/**
 * DELETE - board 삭제
 * 현재 인증된 사용자의 board만 삭제 가능 (RLS가 자동 필터링)
 */
export async function deleteBoard(boardId: string) {
  // 현재 사용자 인증 확인
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  // board 정보 가져오기 (이미지 삭제를 위해 user_id 필요)
  const { data: boardData } = await supabase
    .from("board")
    .select("user_id")
    .eq("board_id", boardId)
    .single();

  if (!boardData) {
    throw new Error("Board not found");
  }

  // 1. board_tag_jointable 삭제
  await supabase.from("board_tag_jointable").delete().eq("board_id", boardId);

  // 2. 이미지 삭제
  const { deletePostImage } = await import("./storage");
  await deletePostImage(boardId, boardData.user_id);

  // 3. board 삭제 (RLS가 자동으로 현재 사용자의 board만 삭제 허용)
  const { error } = await supabase
    .from("board")
    .delete()
    .eq("board_id", boardId);

  if (error) {
    throw new Error(`Failed to delete board: ${error.message}`);
  }
}
