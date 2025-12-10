import json
import os
import requests
from supabase import create_client, Client

def lambda_handler(event, context):
    # CORS headers
    cors_headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers, 'body': ''}

    try:
        print("=== Data Compression Lambda Started ===")
        
        # 1. Environment Variables
        SUPABASE_URL = os.environ.get("SUPABASE_URL")
        SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
        DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY")

        if not all([SUPABASE_URL, SUPABASE_KEY, DEEPSEEK_API_KEY]):
            return {
                'statusCode': 500,
                'headers': cors_headers,
                'body': json.dumps({'error': 'Missing environment variables'})
            }

        # 2. Parse Input and Verify Auth
        body = event
        if "body" in event and isinstance(event["body"], str):
             body = json.loads(event["body"])
        
        access_token = body.get("access_token")
        refresh_token = body.get("refresh_token")
        new_boards = body.get("boards")

        if not access_token or not refresh_token or not new_boards:
            return {
                'statusCode': 400,
                'headers': cors_headers,
                'body': json.dumps({'error': 'Missing access_token, refresh_token, or boards'})
            }

        # 3. Initialize Supabase and Auth
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        try:
            print("Verifying Supabase Session...")
            supabase.auth.set_session(access_token, refresh_token)
            user_response = supabase.auth.get_user()
            user_id = user_response.user.id
            print(f"Authenticated User ID: {user_id}")
        except Exception as auth_error:
            print(f"Auth Error: {str(auth_error)}")
            return {
                'statusCode': 401,
                'headers': cors_headers,
                'body': json.dumps({'error': 'Unauthorized'})
            }

        print(f"Compressing data for user: {user_id}, Boards count: {len(new_boards)}")


        # 4. Fetch Previous Compressed Data
        # Assuming table 'user_analysis' has columns 'user_id' and 'compressed_data'
        print("Fetching previous summary...")
        response = supabase.from("user_analysis").select("compressed_data").eq("user_id", user_id).maybe_single()
        
        prev_summary = ""
        if response.data and response.data.get("compressed_data"):
            prev_summary = response.data["compressed_data"]
            print("Found previous summary.")
        else:
            print("No previous summary found (first compression).")

        # 5. Call DeepSeek to Compress/Merge
        print("Calling DeepSeek LLM...")
        
        system_prompt = """You are a meticulous biographer and data archivist.
Your task is to maintain a running "Compressed History" of a user's life based on their activity boards.

You will be given:
1. The CURRENT Compressed History (a summary of their past).
2. A NEW BATCH of activity boards (recent events).

Your Goal:
Create an UPDATED Compressed History that seamlessly integrates the new events into the narrative.

Rules:
- Preserve important long-term facts from the Current History.
- Summarize the New Batch specific details (dates, key achievements) into the narrative.
- Maintain a chronological flow.
- Keep the tone professional but personal (like a life log).
- The total output should be dense and information-rich, suitable for future analysis.
- Do NOT lose key milestones.
"""

        user_content = f"""
=== CURRENT COMPRESSED HISTORY ===
{prev_summary if prev_summary else "(Empty - This is the start of the archive)"}

=== NEW BATCH OF BOARDS (Top is most recent usually, but treat as a set) ===
{json.dumps(new_boards, indent=2)}

=== INSTRUCTION ===
Generate the UPDATED Compressed History now. Return ONLY the text of the history.
"""

        llm_payload = {
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content}
            ],
            "model": "deepseek-chat", # or deepseek-reasoner depending on availability
            "max_tokens": 4000, # Allow large context output
            "temperature": 0.5
        }

        llm_headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {DEEPSEEK_API_KEY}'
        }

        llm_res = requests.post("https://api.deepseek.com/chat/completions", headers=llm_headers, json=llm_payload)
        
        if not llm_res.ok:
            raise Exception(f"DeepSeek API Error: {llm_res.text}")

        new_summary = llm_res.json()['choices'][0]['message']['content']
        print("Compression successful.")

        # 6. Update/Insert into Supabase
        print("Updating user_analysis table...")
        
        # Check if row exists specifically to decide insert vs update (though upsert is better)
        # Using upsert with user_id as conflict key
        upsert_data = {
            "user_id": user_id,
            "compressed_data": new_summary,
            "last_updated": "now()" # Optional, if column exists
        }
        
        # To avoid error if last_updated doesn't exist, I'll just upsert the two known columns
        # If the user only made 'compressed_data' column.
        # But usually Supabase requires all non-nullable columns.
        # I'll try upserting just these.
        
        # Note: If 'user_analysis' has other columns, this might need adjustment.
        # I'll assume standard upsert works.
        
        update_res = supabase.from("user_analysis").upsert(
            {"user_id": user_id, "compressed_data": new_summary}, 
            on_conflict="user_id"
        ).execute()

        print("Database updated.")

        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({
                'message': 'Compression successful',
                'new_summary_length': len(new_summary),
                'preview': new_summary[:100] + "..."
            })
        }

    except Exception as e:
        print(f"ERROR: {str(e)}")
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({'error': str(e)})
        }
