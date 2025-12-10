import json
import os
import requests

def lambda_handler(event, context):
    # CORS headers for all responses
    cors_headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
    }

    # Handle OPTIONS preflight request
    if event.get('httpMethod') == 'OPTIONS' or event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
        print("Handling OPTIONS preflight request")
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': ''
        }

    try:
        print("=== Deepseek Analysis Lambda started ===")
        print(f"Received event: {json.dumps(event)}")

        # Get environment variable
        DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY")

        if not DEEPSEEK_API_KEY:
            print("ERROR: Missing DEEPSEEK_API_KEY")
            return {
                'statusCode': 500,
                'headers': cors_headers,
                'body': json.dumps({'error': 'Missing DEEPSEEK_API_KEY'})
            }

        if not DEEPSEEK_API_KEY:
            print("ERROR: Missing DEEPSEEK_API_KEY")
            return {
                'statusCode': 500,
                'headers': cors_headers,
                'body': json.dumps({'error': 'Missing DEEPSEEK_API_KEY'})
            }

        task = event.get("task", "analysis")

        if task == "query_parser":
            print("=== Performing Query Parsing ===")
            user_query = event.get("query", "")
            current_date = event.get("current_date", "")
            
            payload = {
                "messages": [
                    {
                        "role": "system",
                        "content": f"""You are a precise query parser. Your job is to extract search filters from the user's natural language query.
Current Date: {current_date}

Return a JSON object with these fields:
{{
  "startDate": "YYYY-MM-DD" or null,
  "endDate": "YYYY-MM-DD" or null,
  "tags": ["tag1", "tag2"] (empty array if none),
  "keywords": ["word1", "word2"] (empty array if none),
  "daysOfWeek": [0, 1, ...] (integers 0=Sun to 6=Sat, empty if none),
  "hasImage": boolean or null (true/false if explicitly requested, else null),
  "sort": "newest" | "oldest" | "random" | null,
  "limit": integer or null
}}

Rules:
1. Handle date ranges: "from Jan 1 to Feb 1" -> startDate: "2024-01-01", endDate: "2024-02-01".
2. Handle relative dates: "last week" -> calculate range based on Current Date. "yesterday" -> specific date.
3. Handle tags: If user mentions "work tag" or "#work", extract "work".
4. Handle specific text: "boards about coding" -> keywords: ["coding"].
5. Days: "What do I do on Mondays?" -> daysOfWeek: [1]. "Weekends" -> [0, 6].
6. Images: "Show me photos/pictures" -> hasImage: true.
7. Sort/Limit: "Last 5 boards" -> sort: "newest", limit: 5. "Random 2 memories" -> sort: "random", limit: 2.
8. If the user asks for "what i did", "summary", "analysis" without specific constraints, return null for all fields.
9. Return format must be valid JSON."""
                    },
                    {
                        "role": "user",
                        "content": user_query
                    }
                ],
                "model": "deepseek-chat",
                "response_format": {
                    "type": "json_object"
                },
                "temperature": 0.1
            }
            
        else:
            # Existing Analysis Mode
            boards = event.get("boards", [])
    
            if not boards:
                print("ERROR: No boards data provided")
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'No boards data provided'})
                }
    
            print(f"Received {len(boards)} boards for analysis")
    
        if task == "query_parser":
             # ... (existing query parsing logic) ...
             pass
        
        else:
            # === ANALYSIS TASK (Default) ===
            print("Mode: Analysis")
            
            # Extract History
            history = event.get("history", "")
            history_context = ""
            if history:
                 history_context = f"\n\n=== USER'S LONG-TERM HISTORY (Context only) ===\n{history}\n\n(Use this history to understand their long-term growth, but focus your specific feedback on the NEW ACTIVITY BOARDS below.)"

            # Prepare Deepseek API request for Analysis
            payload = {
                "messages": [
                    {
                        "content": f"""You are an enthusiastic personal life coach analyzing someone's activity boards. Your job is to make them feel proud of what they've accomplished and excited about their progress.
    {history_context}
    
    Respond with a JSON object in this format:
    {{
      "fact1": "An exciting discovery about their recent activities (with specific numbers)",
      "fact2": "Another interesting pattern or achievement (with specific numbers)",
      "analysis": "A warm, encouraging 2-3 sentence message directly to them"
    }}
    
    Guidelines:
    - Write in second person ("you", "your") - never third person
    - Be enthusiastic and positive about their activities
    - Point out interesting patterns or themes in what they're documenting
    - Make specific references to their actual data (dates, tags, descriptions)
    - Sound like a supportive friend, not a robot
    - If History is provided, mention how their recent work connects to their larger journey (e.g., "You're continuing your streak in...")
    
    CRITICAL ANTI-HALLUCINATION RULES:
    1. Do NOT invent concepts, projects, or activities that are not explicitly in the provided JSON data.
    2. If the data is too sparse (tags only, no descriptions) or empty to form a patterned insight, generally admit "I see you were active, but I need more details to give specific praise" in the analysis.
    3. If there are no distinctive facts for "fact1" or "fact2", return "Not enough data" for those fields. Do NOT fake a statistic.
    4. Only reference specific dates or tags if they actually exist in the input.""",
                        "role": "system"
                    },
                    {
                        "content": f"""Look at what this person has been documenting on their boards and give them some exciting insights:
    
    {json.dumps(boards, indent=2)}
    
    Make them feel good about their activities! Focus on:
    - What they've been working on or experiencing
    - Any cool patterns or themes you notice
    - How active they've been
    - Specific accomplishments or moments they've captured
    
    Be warm, personal, and enthusiastic. Use "you" and "your" throughout.
    Return ONLY valid JSON, no markdown or extra text.""",
                        "role": "user"
                    }
                ],
                "model": "deepseek-chat",
                "response_format": {
                    "type": "json_object"
                },
                "thinking": {
                    "type": "disabled"
                },
                "max_tokens": 1024,
                "temperature": 1,
                "top_p": 1
            }

        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': f'Bearer {DEEPSEEK_API_KEY}'
        }

        print(f"Calling Deepseek API for {task}...")
        response = requests.post(
            "https://api.deepseek.com/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )

        print(f"Deepseek API responded with status: {response.status_code}")

        if not response.ok:
            error_text = response.text
            print(f"ERROR: Deepseek API error: {error_text}")
            raise Exception(f"Deepseek API error {response.status_code}: {error_text}")

        completion = response.json()
        print(f"Deepseek response: {json.dumps(completion)}")

        # Extract the analysis from the response
        content = completion['choices'][0]['message']['content']
        print(f"Content (raw): {content}")

        # Parse the JSON string to an object
        try:
            parsed_json = json.loads(content)
            print(f"Content (parsed): {json.dumps(parsed_json)}")
            
            # Return appropriate key based on task
            result_key = 'filters' if task == 'query_parser' else 'analysis'
            
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                    result_key: parsed_json,
                    'raw_response': completion
                })
            }
            
        except json.JSONDecodeError as e:
            print(f"ERROR: Failed to parse JSON: {str(e)}")
            # Fallback for analysis, error for parser
            if task == 'query_parser':
                 return {
                    'statusCode': 422,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Failed to parse extracted filters'})
                }
            
            analysis_json = {
                "fact1": "Unable to parse analysis",
                "fact2": "Unable to parse analysis",
                "analysis": content
            }
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                    'analysis': analysis_json,
                    'raw_response': completion
                })
            }

    except Exception as error:
        print(f"Analysis error: {str(error)}")
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({
                'error': f'Analysis failed: {str(error)}'
            })
        }
