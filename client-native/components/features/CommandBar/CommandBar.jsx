import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import {
  MessageCircle,
  X,
  Send,
  Mic,
  Bot,
  User,
  ChevronRight,
  Sparkles,
} from "lucide-react-native";
import { useCommandStore } from "../../../store/useCommandStore";
import { performAction } from "../../../lib/commandExecutor";

const { height: SCREEN_H } = Dimensions.get("window");

// ── Quick Actions (shown when chat is empty) ──────
const QUICK_ACTIONS = [
  { label: "Track my report", icon: "📋" },
  { label: "Post a job", icon: "💼" },
  { label: "My jobs", icon: "📂" },
  { label: "File a complaint", icon: "📢" },
  { label: "Show notifications", icon: "🔔" },
  { label: "My profile", icon: "👤" },
];

// ── Message Bubble ────────────────────────────────
function MessageBubble({ message, onOptionPress, onActionPress }) {
  const isUser = message.role === "user";

  return (
    <View
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        maxWidth: "82%",
        marginBottom: 12,
      }}
    >
      {/* Avatar + bubble */}
      <View
        style={{
          flexDirection: isUser ? "row-reverse" : "row",
          alignItems: "flex-end",
          gap: 8,
        }}
      >
        {/* Avatar */}
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

        {/* Bubble */}
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

      {/* Option chips (for multi-turn flows) */}
      {message.options && message.options.length > 0 && (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 6,
            marginTop: 8,
            marginLeft: 36,
          }}
        >
          {message.options.map((opt) => (
            <TouchableOpacity
              key={opt}
              onPress={() => onOptionPress(opt)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 14,
                backgroundColor: "rgba(129,140,248,0.1)",
                borderWidth: 1,
                borderColor: "rgba(129,140,248,0.25)",
              }}
            >
              <Text style={{ color: "#a5b4fc", fontSize: 12, fontWeight: "600" }}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Action button (e.g. "Open StreetGig") */}
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

  const [inputText, setInputText] = useState("");
  const scrollRef = useRef(null);
  const fabScale = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Pulse animation for the FAB
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

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current && messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || isProcessing) return;
    setInputText("");
    sendMessage(text);
  };

  const handleOptionPress = (option) => {
    if (isProcessing) return;
    sendMessage(option);
  };

  const handleActionPress = (action) => {
    close();
    setTimeout(() => performAction(action), 300);
  };

  const handleQuickAction = (label) => {
    sendMessage(label);
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
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
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
                    UrbanFlow AI
                  </Text>
                  <Text
                    style={{ color: "#71717a", fontSize: 11, fontWeight: "500" }}
                  >
                    Ask me anything
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
                paddingBottom: 8,
              }}
              showsVerticalScrollIndicator={false}
            >
              {messages.length === 0 ? (
                // Empty state: Quick actions
                <View>
                  <View style={{ alignItems: "center", marginBottom: 20, marginTop: 8 }}>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: "rgba(129,140,248,0.1)",
                        justifyContent: "center",
                        alignItems: "center",
                        marginBottom: 12,
                      }}
                    >
                      <Bot size={24} color="#818cf8" />
                    </View>
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 16,
                        fontWeight: "700",
                        marginBottom: 4,
                      }}
                    >
                      How can I help?
                    </Text>
                    <Text
                      style={{
                        color: "#71717a",
                        fontSize: 12,
                        textAlign: "center",
                      }}
                    >
                      Ask me to track reports, post jobs, or navigate the app.
                    </Text>
                  </View>

                  <View style={{ gap: 8 }}>
                    {QUICK_ACTIONS.map((qa) => (
                      <TouchableOpacity
                        key={qa.label}
                        onPress={() => handleQuickAction(qa.label)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 12,
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          borderRadius: 14,
                          backgroundColor: "rgba(255,255,255,0.04)",
                          borderWidth: 1,
                          borderColor: "rgba(255,255,255,0.07)",
                        }}
                      >
                        <Text style={{ fontSize: 18 }}>{qa.icon}</Text>
                        <Text
                          style={{
                            color: "#d4d4d8",
                            fontSize: 14,
                            fontWeight: "500",
                            flex: 1,
                          }}
                        >
                          {qa.label}
                        </Text>
                        <ChevronRight size={14} color="#52525b" />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : (
                // Message list
                messages.map((msg, index) => (
                  <MessageBubble
                    key={index}
                    message={msg}
                    onOptionPress={handleOptionPress}
                    onActionPress={handleActionPress}
                  />
                ))
              )}

              {/* Typing indicator */}
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

            {/* Input Bar */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
                paddingBottom: Platform.OS === "ios" ? 28 : 16,
                borderTopWidth: 1,
                borderTopColor: "rgba(255,255,255,0.06)",
                gap: 8,
              }}
            >
              <View
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.1)",
                  paddingHorizontal: 16,
                  paddingVertical: Platform.OS === "ios" ? 10 : 4,
                }}
              >
                <TextInput
                  style={{
                    flex: 1,
                    color: "#fff",
                    fontSize: 14,
                    maxHeight: 80,
                  }}
                  placeholder="Type a command..."
                  placeholderTextColor="#52525b"
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={handleSend}
                  returnKeyType="send"
                  multiline
                  editable={!isProcessing}
                />
              </View>

              {/* Send button */}
              <TouchableOpacity
                onPress={handleSend}
                disabled={!inputText.trim() || isProcessing}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor:
                    inputText.trim() && !isProcessing
                      ? "#818cf8"
                      : "rgba(255,255,255,0.05)",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Send
                  size={18}
                  color={
                    inputText.trim() && !isProcessing ? "#fff" : "#52525b"
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
