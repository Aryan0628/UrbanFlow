import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, ActivityIndicator, Alert, StyleSheet, ScrollView } from 'react-native';
import { api } from '../../../../lib/api';
import { useAuth0 } from 'react-native-auth0';

export default function JobCreate({ onCreated, location }) {
  const { getCredentials } = useAuth0();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState('');

  const CATEGORIES = ['Movers', 'Carpenter', 'Plumber', 'Electrician', 'Masonry', 'Cleaners'];

  const submit = async () => {
    if (!title || !description || !amount || !time || !category) {
      Alert.alert('Missing Fields', 'Please fill in Title, Description, Amount, Time, and Category.');
      return;
    }
    const parsedAmount = Number(amount);
    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Amount must be a positive whole number (no decimals).');
      return;
    }
    setLoading(true);

    try {
      const credentials = await getCredentials();
      if (!credentials) throw new Error('No credentials');
      const token = credentials.accessToken;

      await api.post(
        '/api/jobs',
        {
          title, description, amount, time, category,
          location: { lat: Number(location.lat), lng: Number(location.lng) },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTitle(''); setDescription(''); setAmount(''); setTime(''); setCategory('');
      if (onCreated) onCreated();
      Alert.alert('Success', 'Job posted successfully!');
    } catch (error) {
      console.error('Failed to post job', error);
      Alert.alert('Error', 'Failed to post job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputGroup}>
        <TextInput style={styles.input} placeholderTextColor="#52525b" placeholder="Job Title (e.g. Electrician)" value={title} onChangeText={setTitle} />
        
        <View>
          <Text style={{ color: '#a1a1aa', fontSize: 13, marginBottom: 8, marginLeft: 4 }}>Job Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategory(cat)}
                style={[
                  styles.categoryChip,
                  category === cat && styles.categoryChipSelected
                ]}
              >
                <Text style={[styles.categoryText, category === cat && styles.categoryTextSelected]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TextInput style={[styles.input, styles.textArea]} placeholderTextColor="#52525b" placeholder="Describe the job..." multiline numberOfLines={4} value={description} onChangeText={setDescription} />
        <View style={styles.row}>
          <TextInput style={[styles.input, { flex: 1 }]} placeholderTextColor="#52525b" placeholder="Amount (₹)" keyboardType="number-pad" value={amount} onChangeText={(text) => setAmount(text.replace(/[^0-9]/g, ''))} />
          <TextInput style={[styles.input, { flex: 1, marginLeft: 12 }]} placeholderTextColor="#52525b" placeholder="Time (e.g. 2 hrs)" value={time} onChangeText={setTime} />
        </View>
      </View>

      <TouchableOpacity onPress={submit} disabled={loading} activeOpacity={0.8} style={[styles.button, loading && styles.buttonDisabled]}>
        {loading ? <ActivityIndicator color="#4ade80" /> : <Text style={styles.buttonText}>Post Job</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 8 },
  inputGroup: { gap: 12, marginBottom: 16 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, padding: 16, color: '#fff', fontSize: 15,
  },
  textArea: { minHeight: 120, textAlignVertical: 'top' },
  row: { flexDirection: 'row', width: '100%' },
  button: {
    width: '100%', backgroundColor: 'rgba(34,197,94,0.1)',
    borderColor: 'rgba(34,197,94,0.2)', borderWidth: 1,
    paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#4ade80', fontWeight: 'bold', fontSize: 16 },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  categoryChipSelected: {
    backgroundColor: 'rgba(59,130,246,0.2)',
    borderColor: 'rgba(59,130,246,0.5)',
  },
  categoryText: {
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: '500',
  },
  categoryTextSelected: {
    color: '#60a5fa',
    fontWeight: 'bold',
  },
});
