import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  Animated,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import {
  X,
  Mic,
  Bot,
  User,
  ChevronRight,
  Sparkles,
} from "lucide-react-native";
import { Audio } from "expo-av";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { useCommandStore } from "../../../store/useCommandStore";
import { performAction } from "../../../lib/commandExecutor";
import { api } from "../../../lib/api";

const { height: SCREEN_H } = Dimensions.get("window");

// ── Message Bubble ────────────────────────────────
function MessageBubble({ message, onActionPress }) {
  const isUser = message.role === "user";

  return (
    <View
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        maxWidth: "82%",
        marginBottom: 12,
      }}
    >
      <View
        style={{
          flexDirection: isUser ? "row-reverse" : "row",
          alignItems: "flex-end",
          gap: 8,
        }}
      >
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: isUser
              ? "rgba(59,130,246,0.2)"
              : "rgba(129,140,248,0.2)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isUser ? (
            <User size={14} color="#60a5fa" />
          ) : (
            <Bot size={14} color="#818cf8" />
          )}
        </View>

        <View
          style={{
            backgroundColor: isUser
              ? "rgba(59,130,246,0.15)"
              : "rgba(255,255,255,0.06)",
            borderRadius: 16,
            borderTopRightRadius: isUser ? 4 : 16,
            borderTopLeftRadius: isUser ? 16 : 4,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderWidth: 1,
            borderColor: isUser
              ? "rgba(59,130,246,0.2)"
              : "rgba(255,255,255,0.08)",
          }}
        >
          <Text
            style={{
              color: isUser ? "#93c5fd" : "#e4e4e7",
              fontSize: 14,
              lineHeight: 20,
            }}
          >
            {message.text}
          </Text>
        </View>
      </View>

      {message.action && message.action.type === "navigate" && (
        <TouchableOpacity
          onPress={() => onActionPress(message.action)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            marginTop: 8,
            marginLeft: 36,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 12,
            backgroundColor: "rgba(16,185,129,0.1)",
            borderWidth: 1,
            borderColor: "rgba(16,185,129,0.25)",
            alignSelf: "flex-start",
          }}
        >
          <Text style={{ color: "#34d399", fontSize: 12, fontWeight: "700" }}>
            Open
          </Text>
          <ChevronRight size={12} color="#34d399" />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Main CommandBar Component ─────────────────────
export default function CommandBar() {
  const {
    isOpen,
    messages,
    isProcessing,
    open,
    close,
    sendMessage,
    reset,
  } = useCommandStore();

  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  
  const scrollRef = useRef(null);
  const fabScale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const micPulseAnim = useRef(new Animated.Value(1)).current;

  const hasGreeted = useRef(false);
  const lastSpokenMessageIndex = useRef(-1);
  const currentSound = useRef(null);

  // ── Google Cloud TTS Playback ──
  const stopTTS = async () => {
    if (currentSound.current) {
      try {
        await currentSound.current.stopAsync();
        await currentSound.current.unloadAsync();
      } catch (_) {}
      currentSound.current = null;
    }
  };

  const playTTS = async (text) => {
    await stopTTS();
    try {
      const res = await api.post("/api/command/tts", { text });
      const base64 = res.data.audioBase64;
      const { sound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mp3;base64,${base64}` },
        { shouldPlay: true }
      );
      currentSound.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
          currentSound.current = null;
        }
      });
    } catch (err) {
      console.warn("[TTS] Playback failed, falling back silent:", err.message);
    }
  };

  // FAB Pulse
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Mic Pulse
  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(micPulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(micPulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      micPulseAnim.setValue(1);
      Animated.timing(micPulseAnim).stop();
    }
  }, [isListening]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current && (messages.length > 0 || interimText)) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length, interimText]);

  // Greeting & Stop Voice on Close
  useEffect(() => {
    if (isOpen) {
      if (!hasGreeted.current && messages.length === 0) {
        hasGreeted.current = true;
        playTTS("Hi! I can help you track reports, post jobs, check notifications, and more. What would you like to do?");
      }
    } else {
      stopTTS();
      if (isListening) {
        ExpoSpeechRecognitionModule.stop();
        setIsListening(false);
      }
      setInterimText("");
    }
  }, [isOpen]);

  // Speak Assistant Messages
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === "assistant" && messages.length - 1 > lastSpokenMessageIndex.current) {
        lastSpokenMessageIndex.current = messages.length - 1;
        playTTS(lastMsg.text);
      } else if (lastMsg.role === "user") {
        lastSpokenMessageIndex.current = messages.length - 1;
      }
    }
  }, [messages, isOpen]);

  // ── Speech Recognition Events ──
  useSpeechRecognitionEvent("result", (e) => {
    if (!e.results || e.results.length === 0) return;
    const transcriptions = e.results.flatMap((result) => {
      if (typeof result === "string") return [result];
      if (result.transcript) return [result.transcript];
      if (result.alternatives) return result.alternatives.map((a) => a.transcript);
      return [];
    });
    if (transcriptions.length > 0) {
      setInterimText(transcriptions[0]);
    }
  });

  useSpeechRecognitionEvent("end", () => {
    setIsListening(false);
    if (interimText.trim() && !isProcessing) {
      const textToSend = interimText.trim();
      setInterimText("");
      sendMessage(textToSend);
    } else {
      setInterimText("");
    }
  });

  useSpeechRecognitionEvent("error", (e) => {
    if (!e.error?.includes("no-match") && !e.error?.includes("no-speech")) {
        console.warn("Speech recognition error:", e);
    }
    setIsListening(false);
    setInterimText("");
  });

  // Toggle Listening
  const toggleListening = async () => {
    if (isListening) {
      ExpoSpeechRecognitionModule.stop();
      setIsListening(false);
    } else {
      stopTTS(); // Stop ongoing assistant speech
      setInterimText("");
      try {
        const perms = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (perms.status === "granted") {
          setIsListening(true);
          await ExpoSpeechRecognitionModule.start({
            lang: "en-US",
            interimResults: true,
            continuous: false,
          });
        }
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
        setIsListening(false);
      }
    }
  };

  const handleActionPress = (action) => {
    close();
    setTimeout(() => performAction(action), 300);
  };

  const fabPulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  return (
    <>
      {/* ── FAB Button ── */}
      {!isOpen && (
        <Animated.View
          style={{
            position: "absolute",
            bottom: 100,
            right: 20,
            zIndex: 999,
            transform: [{ scale: fabPulseScale }],
          }}
        >
          <TouchableOpacity
            onPress={open}
            onPressIn={() =>
              Animated.spring(fabScale, {
                toValue: 0.9,
                useNativeDriver: true,
              }).start()
            }
            onPressOut={() =>
              Animated.spring(fabScale, {
                toValue: 1,
                useNativeDriver: true,
              }).start()
            }
            activeOpacity={0.9}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: "#818cf8",
              justifyContent: "center",
              alignItems: "center",
              shadowColor: "#818cf8",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 10,
            }}
          >
            <Sparkles size={24} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* ── Chat Modal ── */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent
        onRequestClose={close}
      >
        {/* Backdrop */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={close}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        />

        {/* Sheet */}
        <View
          style={{
            backgroundColor: "#0a0a14",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: SCREEN_H * 0.75,
            minHeight: SCREEN_H * 0.5,
            borderTopWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: "rgba(255,255,255,0.06)",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "rgba(129,140,248,0.15)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Sparkles size={16} color="#818cf8" />
              </View>
              <View>
                <Text
                  style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}
                >
                  UrbanFlow Voice
                </Text>
                <Text
                  style={{ color: "#71717a", fontSize: 11, fontWeight: "500" }}
                >
                  Talk to me
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 8 }}>
              {messages.length > 0 && (
                <TouchableOpacity
                  onPress={reset}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 12,
                    backgroundColor: "rgba(255,255,255,0.05)",
                  }}
                >
                  <Text
                    style={{
                      color: "#71717a",
                      fontSize: 11,
                      fontWeight: "700",
                    }}
                  >
                    Clear
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={close}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "rgba(255,255,255,0.06)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <X size={16} color="#a1a1aa" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={{
              padding: 16,
              paddingBottom: 32,
            }}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? (
              <View style={{ alignItems: "center", marginTop: 40 }}>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: "rgba(129,140,248,0.1)",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <Bot size={32} color="#818cf8" />
                </View>
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 18,
                    fontWeight: "700",
                    marginBottom: 8,
                  }}
                >
                  I'm listening...
                </Text>
                <Text
                  style={{
                    color: "#71717a",
                    fontSize: 14,
                    textAlign: "center",
                    paddingHorizontal: 20,
                  }}
                >
                  Tap the microphone below and tell me what you need.
                </Text>
              </View>
            ) : (
              messages.map((msg, index) => (
                <MessageBubble
                  key={index}
                  message={msg}
                  onActionPress={handleActionPress}
                />
              ))
            )}

            {/* Interim Text (what user is currently saying) */}
            {interimText ? (
              <View
                style={{
                  alignSelf: "flex-end",
                  maxWidth: "82%",
                  marginBottom: 12,
                  opacity: 0.7,
                }}
              >
                <View
                  style={{
                    backgroundColor: "rgba(59,130,246,0.1)",
                    borderRadius: 16,
                    borderTopRightRadius: 4,
                    borderTopLeftRadius: 16,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderWidth: 1,
                    borderColor: "rgba(59,130,246,0.2)",
                  }}
                >
                  <Text
                    style={{
                      color: "#93c5fd",
                      fontSize: 14,
                      lineHeight: 20,
                      fontStyle: "italic",
                    }}
                  >
                    {interimText}...
                  </Text>
                </View>
              </View>
            ) : null}

            {isProcessing && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 4,
                  marginLeft: 36,
                }}
              >
                <ActivityIndicator size="small" color="#818cf8" />
                <Text
                  style={{
                    color: "#71717a",
                    fontSize: 12,
                    fontWeight: "500",
                  }}
                >
                  Thinking...
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Voice Command Area (No Text Input) */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: Platform.OS === "ios" ? 40 : 24,
              borderTopWidth: 1,
              borderTopColor: "rgba(255,255,255,0.06)",
              alignItems: "center",
              backgroundColor: "rgba(255,255,255,0.02)",
            }}
          >
            <TouchableOpacity
              onPress={toggleListening}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              <Animated.View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: isListening
                    ? "rgba(239,68,68,0.15)"
                    : isProcessing
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(129,140,248,0.15)",
                  borderWidth: 2,
                  borderColor: isListening
                    ? "#ef4444"
                    : isProcessing
                    ? "rgba(255,255,255,0.1)"
                    : "#818cf8",
                  justifyContent: "center",
                  alignItems: "center",
                  transform: [{ scale: micPulseAnim }],
                  shadowColor: isListening ? "#ef4444" : "#818cf8",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: isListening ? 0.6 : 0,
                  shadowRadius: 15,
                  elevation: isListening ? 10 : 0,
                }}
              >
                {isProcessing ? (
                  <ActivityIndicator size="large" color="#a1a1aa" />
                ) : (
                  <Mic size={32} color={isListening ? "#ef4444" : "#818cf8"} />
                )}
              </Animated.View>
            </TouchableOpacity>

            <Text
              style={{
                color: isListening ? "#ef4444" : "#71717a",
                fontSize: 12,
                fontWeight: "600",
                marginTop: 12,
                letterSpacing: 0.5,
                textTransform: "uppercase",
              }}
            >
              {isListening
                ? "Tap to Stop"
                : isProcessing
                ? "Processing..."
                : "Tap to Speak"}
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}
