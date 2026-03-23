import { GoogleAuth } from "google-auth-library";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";

const auth = new GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

async function testTTS() {
  try {
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();

    const payload = {
      input: { text: "Testing." },
      voice: {
        languageCode: "en-US",
        name: "en-US-Neural2-F",
        ssmlGender: "FEMALE",
      },
      audioConfig: {
        audioEncoding: "MP3",
      },
    };

    console.log("Sending to TTS API...");
    const response = await axios.post(TTS_URL, payload, {
      headers: {
        Authorization: `Bearer ${tokenResponse.token}`,
        "Content-Type": "application/json",
      },
      validateStatus: () => true
    });

    console.log("STATUS:", response.status);
    console.log("DATA:", JSON.stringify(response.data, null, 2));

  } catch (err) {
    console.error("Error:", err.message);
  }
}

testTTS();
