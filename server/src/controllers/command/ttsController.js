import { GoogleAuth } from "google-auth-library";
import axios from "axios";

const TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";

// Re-use a single GoogleAuth instance for token caching
const auth = new GoogleAuth({
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

/**
 * POST /api/command/tts
 * Body: { text: string }
 * Returns: { audioBase64: string }  (MP3, base64-encoded)
 */
export const synthesizeSpeech = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({ message: "Text is required" });
    }

    // Clean markdown artifacts for natural speech
    const cleanText = text
      .replace(/[*•#_~`]/g, "")
      .replace(/\n+/g, ". ")
      .replace(/\s{2,}/g, " ")
      .trim();

    // Get access token from service account
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();

    const payload = {
      input: { text: cleanText },
      voice: {
        languageCode: "en-US",
        name: "en-US-Neural2-F",   // Natural female voice
        ssmlGender: "FEMALE",
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: 1.15,        // Slightly faster for snappy feel
        pitch: 0.0,               // Neutral pitch
        effectsProfileId: ["handset-class-device"], // Optimised for phone speakers
      },
    };

    const response = await axios.post(TTS_URL, payload, {
      headers: {
        Authorization: `Bearer ${tokenResponse.token}`,
        "Content-Type": "application/json",
      },
    });

    return res.json({ audioBase64: response.data.audioContent });
  } catch (err) {
    console.error("[TTS] Synthesis failed:", err.response?.data || err.message);
    return res.status(500).json({ message: "Text-to-speech synthesis failed" });
  }
};
