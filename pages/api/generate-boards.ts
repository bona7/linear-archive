import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const key = process.env.DEEPSEEK_API_KEY || "";
    const { availableTags } = req.body; // e.g., ["운동", "독서", ...]

    console.log(`Asking AI to generate 30 boards using tags: ${JSON.stringify(availableTags)}`);

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages: [
                {
                  role: "system",
                  content: `
                    당신은 생산성 앱을 위한 데이터 생성기입니다.
                    사용자가 제공한 태그 목록을 사용하여 30개의 게시글 데이터를 생성하세요.
                    
                    1. JSON 형식으로 출력하세요.
                    2. 최상위 루트는 "items" 배열이어야 합니다.
                    3. 각 item은 다음을 포함:
                       - description: string (게시글 내용, 1~2문장, 한국어)
                       - date: string (YYYY-MM-DD 형식, 2025-11-01 ~ 2025-11-30 사이 무작위)
                       - tags: string[] (제공된 태그 목록 중 0~2개를 무작위 선택)
                    4. 활동적이고 긍정적인 라이프스타일을 보여주는 내용을 만드세요.
                  `,
                },
                {
                  role: "user",
                  content: `사용 가능한 태그 목록: ${JSON.stringify(availableTags || [])}. 이 태그들을 활용하여(혹은 활용하지 않고) 30개의 다양한 일상 기록을 생성해주세요.`,
                },
            ],
            response_format: { type: "json_object" }
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`DeepSeek API Error ${response.status}: ${errText}`);
    }

    const completion = await response.json();
    const content = completion.choices[0].message.content;
    
    if (!content) throw new Error("Empty response from AI");

    const parsedData = JSON.parse(content);
    const items = parsedData.items;

    console.log(`AI generated ${items.length} boards.`);
    
    return res.status(200).json({ success: true, count: items.length, items: items });

  } catch (err: any) {
    console.error("Fatal Error in board-gen API:", err);
    return res.status(500).json({ error: err?.message || "Unknown error", details: JSON.stringify(err) });
  }
}
