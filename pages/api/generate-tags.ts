import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const key = process.env.DEEPSEEK_API_KEY;
    console.log(`[DEBUG-TAGS] Key loaded: ${key ? "Yes" : "No"}`);
    
    if (!key) {
        throw new Error("Missing DEEPSEEK_API_KEY environment variable");
    }

    console.log(`Asking AI to generate tags (using OpenAI SDK)...`);

    const client = new OpenAI({
        apiKey: key,
        baseURL: 'https://api.deepseek.com',
        timeout: 60000, // 60s timeout
    });

    const completion = await client.chat.completions.create({
        model: "deepseek-chat",
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
        response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    
    if (!content) throw new Error("Empty response from AI");

    const parsedData = JSON.parse(content);
    const items = parsedData.items;

    console.log(`AI generated ${items ? items.length : 0} items. Returning to client...`);
    
    return res.status(200).json({ success: true, count: items ? items.length : 0, items: items || [] });

  } catch (err: any) {
    console.error("Fatal Error in tagFill API:", err);

    let errorMessage = err.message || "Unknown error";
    let errorDetails = err;

    // Handle specific network errors
    if (errorMessage.includes("ECONNRESET") || errorMessage.includes("fetch failed")) {
        errorMessage = "Network connection to DeepSeek API failed (ECONNRESET). This is likely a local network or firewall issue.";
    }

    return res.status(500).json({ 
        error: errorMessage, 
        details: JSON.stringify(errorDetails, Object.getOwnPropertyNames(errorDetails))
    });
  }
}
