import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
        baseURL: 'https://api.deepseek.com/v1',
        apiKey: process.env.DEEPSEEK_API_KEY
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { availableTags } = req.body;
    const tagListString = Array.isArray(availableTags) ? availableTags.join(', ') : '';

    const key = process.env.DEEPSEEK_API_KEY || "";
    console.log(`[DEBUG] Key loaded: ${key.slice(0, 5)}...${key.slice(-4)}`);
    console.log(`Asking AI to generate boards using tags: ${tagListString.slice(0, 50)}...`);

    const completion = await openai.chat.completions.create({
      model: "deepseek-chat", 
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `
            당신은 생산성 앱을 위한 데이터 생성기입니다.
            1. 반드시 유효한 JSON 형식으로 출력하세요.
            2. 최상위 루트는 "items"라는 배열 키를 가진 객체여야 합니다.
            3. 각 항목은 다음을 포함해야 합니다:
               - description: string (자세한 작업 내용이나 추억, 한국어로 작성)
               - date: string (YYYY-MM-DD 형식, 2025-11-01 에서 2025-12-09 사이)
               - tags: string 배열 (반드시 제공된 'Available Tags'의 부분집합이어야 합니다. 새로운 태그를 만들지 마세요.)
            4. 프로젝트 관리 및 일상 생활과 관련된 10개의 현실적이고 다양한 항목을 생성하세요.
            5. 날짜는 지정된 범위(2025년 11월 - 2025년 12월 9일) 내에서 무작위로 분포되어야 합니다.
            6. 모든 콘텐츠는 한국어로 출력하세요.
          `,
        },
        {
          role: "user",
          content: `Available Tags: [${tagListString}].\nGenerate 10 entries using these tags.`,
        },
      ],
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("Empty response from AI");

    const parsedData = JSON.parse(content);
    const items = parsedData.items;

    console.log(`AI generated ${items.length} items. Returning to client...`);
    
    return res.status(200).json({ success: true, count: items.length, items: items });

  } catch (err: any) {
    console.error("Fatal Error in generate-boards API:");
    console.error(err);
    return res.status(500).json({ error: err?.message || "Unknown error", details: JSON.stringify(err) });
  }
}
