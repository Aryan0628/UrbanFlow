import httpx
import asyncio

async def test_auth():
    scenarios = [
        ("No Auth Header", {}),
        ("Empty Bearer", {"Authorization": "Bearer "}),
        ("Bearer null (string)", {"Authorization": "Bearer null"}),
        ("Bearer undefined (string)", {"Authorization": "Bearer undefined"}),
        ("Bearer None (string)", {"Authorization": "Bearer None"})
    ]
    
    async with httpx.AsyncClient() as client:
        for name, headers in scenarios:
            print(f"\n--- Testing: {name} ---")
            try:
                res = await client.post("http://localhost:3000/api/command/process", json={"text": "hi"}, headers=headers)
                print(f"Status: {res.status_code}")
                # print the first 100 chars of response
                print(f"Body: {res.text[:100]}")
            except Exception as e:
                print(f"Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_auth())
