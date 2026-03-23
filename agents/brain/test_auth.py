import httpx
import asyncio
import os

TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImFZSUR6dWR2S08zMm8wcmFSZS1lVCJ9.eyJodHRwczovL3VyYmFuZmxvdy9yb2xlcyI6W10sImlzcyI6Imh0dHBzOi8vZGV2LXFtZHdncG9vdGI2Z3BiMWgudXMuYXV0aDAuY29tLyIsInN1YiI6Imdvb2dsZS1vYXV0aDJ8MTE4MjMzMzA1Njk5MjM2NDI1OTk1IiwiYXVkIjpbImh0dHBzOi8vQ2l0eU9TL2FwaSIsImh0dHBzOi8vZGV2LXFtZHdncG9vdGI2Z3BiMWgudXMuYXV0aDAuY29tL3VzZXJpbmZvIl0sImlhdCI6MTc3NDIxMzEwNywiZXhwIjoxNzc0Mjk5NTA3LCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIiwiYXpwIjoiYzlsWHpDeFZRa0hqSDhSdGJQTGh2djRUbnIwNVJWQ0giLCJwZXJtaXNzaW9ucyI6W119.BfDyVaeiJFyNqg9WcLdaB4rbUHpEm6GBPda6eovGg8WPiucTWFk_DmKoIGZvSOpBL8F4EUVixBmgF-iky6KZWScd3rDFDcvJE54TIlozFEQSHG2cQudiLEyxepZNsswxuJlddtfx2Wg9CPX77vTVem0xz3S3af4uYoP2QH4S2pIDAHqJWRRU2y4YxCeOIEzRqaZeHjnWwFyL2GBlXVMBHJHesC-L9DVnF4F7PUQqOk8g8jbovg89j03dgV0h3UAmHRdzcwU_0gmEyqrfKBDqDm-urATTyPtgCaXY-qRV2BE7aEp_UK8VVc_OqeRryjjbUoQI0o8f0RiJI_oIlYimIg"

async def main():
    headers = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}
    body = {"text": "show my reports", "pendingIntent": None, "collectedData": {}, "conversationHistory": []}
    
    async with httpx.AsyncClient() as client:
        try:
            res = await client.post("http://localhost:3000/api/command/process", json=body, headers=headers)
            print("STATUS:", res.status_code)
            print("RESPONSE:", res.text)
        except Exception as e:
            print("ERROR", str(e))

if __name__ == "__main__":
    asyncio.run(main())
