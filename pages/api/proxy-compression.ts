import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // API Gateway endpoint for data compression (Root resource)
    const TARGET_URL = "https://bl88v69126.execute-api.ap-northeast-2.amazonaws.com/dev/";

    console.log("Proxying compression request to API Gateway...");

    // Extract access token from request body to pass as Authorization header
    const { access_token, ...bodyData } = req.body;

    console.log("Access Token present:", !!access_token);
    if (access_token) console.log("Access Token length:", access_token.length);

    const headers = {
        "Content-Type": "application/json",
        ...(access_token && { "Authorization": `Bearer ${access_token}` })
    };
    
    console.log("Sending Headers:", JSON.stringify(headers, null, 2));

    const response = await fetch(TARGET_URL, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(req.body) 
    });

    const contentType = response.headers.get("content-type");
    let data;
    let rawText = "";

    try {
        rawText = await response.text();
        if (contentType && contentType.toLowerCase().includes("application/json")) {
            data = JSON.parse(rawText);
        } else {
            data = rawText;
        }
    } catch (parseError) {
        console.warn("Failed to parse Lambda response:", parseError);
        data = rawText; // Fallback to text
    }

    if (!response.ok) {
        console.error("Lambda returned error:", response.status, data);
        console.error("Full Lambda response:", JSON.stringify(data, null, 2));
        // Forward the status code from Lambda (e.g. 500, 401, etc.)
        return res.status(response.status).json({ 
            error: `Lambda Error ${response.status}`, 
            details: data,
            message: data?.error || "The remote AWS Lambda function returned an error."
        });
    }

    console.log("Lambda success:", data);
    return res.status(200).json(data);

  } catch (err: any) {
    console.error("Proxy Logic Error:", err);
    return res.status(502).json({ 
        error: "Proxy Connection Failed", 
        details: err.message || "Unknown error calling Lambda",
        hint: "This may be a network connectivity issue or the Lambda URL is unreachable."
    });
  }
}
