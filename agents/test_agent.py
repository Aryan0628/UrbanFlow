import asyncio
from httpx import AsyncClient

async def test_agent():
    async with AsyncClient() as client:
        payload = {
            "text": "Are there any donation requests?",
            "sessionId": "test-session"
        }
        res = await client.post(
            "http://localhost:8000/assistant-chat",
            json=payload,
            headers={"Authorization": "Bearer fake_token"}
        )
        print(f"Status: {res.status_code}")
        print("Response:")
        print(res.json())

if __name__ == "__main__":
    asyncio.run(test_agent())
