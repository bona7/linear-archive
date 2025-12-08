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
    const key = process.env.DEEPSEEK_API_KEY || "";
    console.log(`[DEBUG-TAGS] Key loaded: ${key.slice(0, 5)}...${key.slice(-4)}`);
    
    console.log(`Asking AI to generate tags...`);

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
               - tag_name: string (짧고 간결한 한국어 태그 이름)
               - tag_color: string (hex 코드)
            4. 현실적이고 다양한 데이터를 생성하세요.
            5. 모든 텍스트는 한국어로 출력하세요.
          `,
        },
        {
          role: "user",
          content: `가상의 페르소나를 만들고 그 성격과 관련된 15개의 태그를 생성하세요. 직업, 취미, 또는 개인적인 삶과 관련될 수 있습니다. 예) 농구, 독서, 공부 등.`,
        },
      ],
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("Empty response from AI");

    const parsedData = JSON.parse(content);
    const items = parsedData.items;

    console.log(`AI generated ${items.length} items. Returning to client...`);
    
    // Return items to frontend for insertion
    return res.status(200).json({ success: true, count: items.length, items: items });

  } catch (err: any) {
    console.error("Fatal Error in tagFill API:");
    console.error(err);
    return res.status(500).json({ error: err?.message || "Unknown error", details: JSON.stringify(err) });
  }
}
