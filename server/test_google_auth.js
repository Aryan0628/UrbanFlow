import { GoogleAuth } from "google-auth-library";
import dotenv from "dotenv";
dotenv.config();

console.log("Creds:", process.env.GOOGLE_APPLICATION_CREDENTIALS);

async function testAuth() {
  try {
    const auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    console.log("Getting client...");
    const client = await auth.getClient();
    console.log("Getting token...");
    const tokenResponse = await client.getAccessToken();
    console.log("Token Success!", !!tokenResponse.token);
  } catch (err) {
    console.error("Auth Error:", err);
  }
}

testAuth();
