import { supabase } from "./client";

export interface UploadPostImageParams {
  file: File;
  postUuid: string;
  userId: string;
}

/**
 * 게시글 이미지 업로드/수정
 * 경로: boards/{userId}/{postUuid}/{imageName}.{ext}
 */
export async function uploadPostImage({
  file,
  postUuid,
  userId,
}: UploadPostImageParams) {
  // 원본 파일 이름과 확장자 추출
  const fileName = file.name.split(".").slice(0, -1).join(".") || "image";
  const extension = file.name.split(".").pop() || "jpg";

  // 경로: boards/{userId}/{postUuid}/{fileName}.{ext}
  const path = `boards/${userId}/${postUuid}/${fileName}.${extension}`;

  // 기존 이미지 삭제 (폴더 내 모든 파일)
  await deletePostImage(postUuid, userId);

  // 새 이미지 업로드
  const { data, error } = await supabase.storage
    .from("images")
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // 공개 URL 가져오기
  const { data: urlData } = supabase.storage
    .from("images")
    .getPublicUrl(data.path);

  return {
    path: data.path,
    publicUrl: urlData.publicUrl,
    postUuid,
  };
}

/**
 * 게시글 이미지 URL 가져오기
 * boards/{userId}/{postUuid}/ 폴더 내의 첫 번째 이미지 반환
 */
export async function getPostImageUrl(
  postUuid: string,
  userId: string
): Promise<string | null> {
  // boards/{userId}/{postUuid}/ 폴더 내의 파일 목록 가져오기
  const { data, error } = await supabase.storage
    .from("images")
    .list(`boards/${userId}/${postUuid}`, {
      limit: 1,
      sortBy: { column: "created_at", order: "asc" },
    });

  if (error) {
    // 폴더가 없거나 에러 발생 시 null 반환
    return null;
  }

  if (!data || data.length === 0) {
    return null;
  }

  // 첫 번째 이미지의 URL 반환
  const imageFile = data[0];
  const path = `boards/${userId}/${postUuid}/${imageFile.name}`;

  const { data: urlData } = supabase.storage.from("images").getPublicUrl(path);

  return urlData.publicUrl;
}

/**
 * 게시글 이미지 삭제
 * boards/{userId}/{postUuid}/ 폴더 내의 모든 파일 삭제
 */
export async function deletePostImage(postUuid: string, userId: string) {
  // boards/{userId}/{postUuid}/ 폴더 내의 모든 파일 가져오기
  const { data, error } = await supabase.storage
    .from("images")
    .list(`boards/${userId}/${postUuid}`);

  if (error) {
    // 폴더가 없으면 그냥 반환 (에러 아님)
    return;
  }

  if (!data || data.length === 0) {
    return;
  }

  // 폴더 내 모든 파일 삭제
  const filesToDelete = data.map(
    (file) => `boards/${userId}/${postUuid}/${file.name}`
  );

  const { error: deleteError } = await supabase.storage
    .from("images")
    .remove(filesToDelete);

  if (deleteError) {
    throw new Error(`Failed to delete image: ${deleteError.message}`);
  }
}
