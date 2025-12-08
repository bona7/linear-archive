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
    console.log(`Asking AI to generate tags...`);

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
               - tag_name: string (it should be short and concise)
               - tag_color: string (hex code)
            4. Generate realistic, varied data.
          `,
        },
        {
          role: "user",
          content: `Make a mock personality and Generate 15tags related to your personality. It can be related to your work, hobbies, or personal life. ex) basketball, reading, study etc.`,
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
