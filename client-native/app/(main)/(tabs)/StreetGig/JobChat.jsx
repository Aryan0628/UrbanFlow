import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image, Alert } from 'react-native';
import { Send, User } from 'lucide-react-native';
import { ref, push, onValue, serverTimestamp, update } from 'firebase/database';
import { db } from '../../../../lib/firebase';
import { useAuthStore } from '../../../../store/useAuthStore';

export default function JobChat({ job }) {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isDealClosed, setIsDealClosed] = useState(job?.status === 'closed');
  const scrollViewRef = useRef();

  useEffect(() => {
    const roomId = job?.chatRoomId || job?.id;
    if (!roomId) return;

    const messagesRef = ref(db, `jobs/rooms/${roomId}/messages`);
    const unsubscribeMessages = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loaded = Object.entries(data).map(([key, val]) => ({ id: key, ...val }));
        setMessages(loaded.sort((a, b) => a.timestamp - b.timestamp));
      } else {
        setMessages([]);
      }
    });

    const statusRef = ref(db, `jobs/rooms/${job?.chatRoomId || job?.id}/status`);
    const unsubscribeStatus = onValue(statusRef, (snapshot) => {
      if (snapshot.exists() && snapshot.val() === 'closed') setIsDealClosed(true);
    });

    return () => { unsubscribeMessages(); unsubscribeStatus(); };
  }, [job?.id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    if (!user) {
      Alert.alert('Error', 'You must be logged in to send messages.');
      return;
    }
    try {
      const userId = user.sub || user.id;
      const roomId = job?.chatRoomId || job?.id;
      const messagesRef = ref(db, `jobs/rooms/${roomId}/messages`);
      await push(messagesRef, {
        text: newMessage.trim(),
        userId,
        userName: user.name || 'Anonymous',
        userAvatar: user.picture || '',
        timestamp: serverTimestamp(),
      });
      setNewMessage('');
    } catch (err) {
      console.error('Send message error:', err);
      Alert.alert('Error', 'Failed to send message. Check your connection.');
    }
  };

  const userId = user?.sub || user?.id;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.02)' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
        <Text style={{ fontWeight: 'bold', color: '#fff', fontSize: 16 }}>{job?.title}</Text>
        <Text style={{ fontSize: 12, color: '#a1a1aa', marginTop: 2 }}>Posted by {job?.userName || 'Unknown'}</Text>
      </View>

      {/* Messages */}
      <ScrollView
        style={{ flex: 1, padding: 16 }}
        contentContainerStyle={{ gap: 16, paddingBottom: 20 }}
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg) => {
          const isMe = msg.userId === userId;
          return (
            <View key={msg.id} style={{ flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8 }}>
              <View style={{ height: 24, width: 24, borderRadius: 12, backgroundColor: '#18181b', overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                {msg.userAvatar ? <Image source={{ uri: msg.userAvatar }} style={{ height: '100%', width: '100%' }} /> : <User size={14} color="#71717a" />}
              </View>
              <View style={{
                maxWidth: '75%', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
                backgroundColor: isMe ? '#2563eb' : 'rgba(255,255,255,0.05)',
                borderBottomRightRadius: isMe ? 4 : 20, borderBottomLeftRadius: isMe ? 20 : 4,
                borderWidth: isMe ? 0 : 1, borderColor: 'rgba(255,255,255,0.06)',
              }}>
                <Text style={{ color: isMe ? '#fff' : '#e4e4e7', fontSize: 14 }}>{msg.text}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Input */}
      {isDealClosed ? (
        <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', alignItems: 'center' }}>
          <Text style={{ color: '#71717a', fontSize: 14 }}>This conversation is closed.</Text>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', gap: 8 }}>
          <TextInput
            value={newMessage} onChangeText={setNewMessage} placeholder="Type a message..."
            placeholderTextColor="#52525b"
            onSubmitEditing={handleSendMessage}
            returnKeyType="send"
            style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontSize: 14 }}
          />
          <TouchableOpacity
            onPress={handleSendMessage} disabled={!newMessage.trim()}
            style={{ backgroundColor: newMessage.trim() ? '#2563eb' : 'rgba(37,99,235,0.3)', height: 40, width: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
          >
            <Send size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
