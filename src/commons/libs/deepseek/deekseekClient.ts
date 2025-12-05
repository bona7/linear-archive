export const callDeepseek = async (
  access_token: string,
  refresh_token: string,
  user_id: string,
  userQuery: string,
  maxTokens: number = 256
): Promise<unknown> => {
  try {
    const response = await fetch(
      "https://1ouj3zep02.execute-api.ap-northeast-2.amazonaws.com/dev/similarity-return",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          access_token: access_token,
          refresh_token: refresh_token,
          user_id: user_id,
          query: userQuery,
          maxTokens: maxTokens,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Deepseek API error: ${response.status}`);
    }
    const completion = await response.json();
    return completion;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown error has occured";
    console.error(message);
    throw error;
  }
};
