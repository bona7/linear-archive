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
            You are a data generator for a productivity app.
            1. Output strictly valid JSON.
            2. The root MUST be an object containing a single key "items" which is an array.
            3. Each item must have:
               - description: string (detailed task or memory)
               - date: string (YYYY-MM-DD, between 2025-11-01 and 2025-12-09)
               - tags: array of strings (Must be a subset of the provided Available Tags. Do not create new tags.)
            4. Generate 10 realistic, varied entries related to project management and daily life.
            5. Ensure dates are randomly distributed within the specified range (Nov 2025 - Dec 9 2025).
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
