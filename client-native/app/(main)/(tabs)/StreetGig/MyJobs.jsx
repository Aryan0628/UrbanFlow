import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Image } from 'react-native';
import { api } from '../../../../lib/api';
import { useAuth0 } from 'react-native-auth0';
import { Star, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react-native';

export default function MyJobs({ jobs, onSelect, onUpdate }) {
  const { getCredentials } = useAuth0();
  const [loadingId, setLoadingId] = useState(null);
  
  const [expandedJobId, setExpandedJobId] = useState(null);
  const [interestedWorkers, setInterestedWorkers] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);

  const closeJob = async (jobId) => {
    setLoadingId(jobId);
    try {
      const credentials = await getCredentials();
      if (!credentials) throw new Error('No credentials');
      const token = credentials.accessToken;
      await api.patch(`/api/jobs/${jobId}/close`, {}, { headers: { Authorization: `Bearer ${token}` } });
      if (onUpdate) onUpdate();
      Alert.alert('Success', 'Deal closed successfully.');
    } catch (error) {
      console.error('Failed to close job', error);
      Alert.alert('Error', 'Failed to close job.');
    } finally {
      setLoadingId(null);
    }
  };

  const toggleWorkersList = async (job) => {
    if (expandedJobId === job.id) {
      setExpandedJobId(null);
      return;
    }
    setExpandedJobId(job.id);
    setLoadingWorkers(true);
    try {
      const res = await api.get('/api/user/workers');
      setInterestedWorkers(res.data.workers || []);
    } catch(error) {
      console.error("Error loading workers:", error);
    } finally {
      setLoadingWorkers(false);
    }
  };

  if (!jobs || !jobs.length) {
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <Text style={{ color: '#71717a', fontSize: 14 }}>No jobs posted yet.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      {jobs.map((job) => (
        <TouchableOpacity
          key={job.id} activeOpacity={0.8} onPress={() => onSelect(job)}
          style={{
            backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.08)', padding: 16, borderRadius: 16, marginBottom: 12, gap: 12,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Text style={{ fontWeight: '600', color: '#fff', fontSize: 16, flex: 1, marginRight: 8 }}>{job.title}</Text>
            <View style={{
              paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1,
              backgroundColor: job.status === 'OPEN' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
              borderColor: job.status === 'OPEN' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
            }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: job.status === 'OPEN' ? '#4ade80' : '#f87171' }}>{job.status}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 14, color: '#a1a1aa' }}>₹{job.amount}</Text>
            <Text style={{ fontSize: 14, color: '#a1a1aa' }}>{job.time}</Text>
          </View>

          {job.status === 'OPEN' && (
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <TouchableOpacity
                onPress={() => toggleWorkersList(job)}
                style={{
                  flex: 1, paddingVertical: 12, backgroundColor: 'rgba(59,130,246,0.1)',
                  borderColor: 'rgba(59,130,246,0.2)', borderWidth: 1, borderRadius: 8,
                  alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6
                }}
              >
                <Text style={{ color: '#60a5fa', fontSize: 12, fontWeight: 'bold' }}>
                  {expandedJobId === job.id ? 'Hide Workers' : 'Find Workers'}
                </Text>
                {expandedJobId === job.id ? <ChevronUp size={14} color="#60a5fa" /> : <ChevronDown size={14} color="#60a5fa" />}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => closeJob(job.id)} disabled={loadingId === job.id}
                style={{
                  flex: 1, paddingVertical: 12, backgroundColor: 'rgba(239,68,68,0.08)',
                  borderColor: 'rgba(239,68,68,0.2)', borderWidth: 1, borderRadius: 8,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                {loadingId === job.id ? <ActivityIndicator size="small" color="#f87171" /> : <Text style={{ color: '#f87171', fontSize: 12, fontWeight: 'bold' }}>Close Deal</Text>}
              </TouchableOpacity>
            </View>
          )}

          {expandedJobId === job.id && (
            <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 16 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', marginBottom: 12 }}>Interested Workers</Text>
              {loadingWorkers ? <ActivityIndicator color="#60a5fa" style={{ padding: 10 }} /> : (
                 interestedWorkers.length === 0 ? <Text style={{ color: '#a1a1aa', fontSize: 13, textAlign: 'center', padding: 10 }}>No workers found.</Text> : (
                   interestedWorkers.map(w => (
                     <View key={w.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' }}>
                       {w.picture ? (
                         <Image source={{ uri: w.picture }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
                       ) : (
                         <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', marginRight: 12 }} />
                       )}
                       <View style={{ flex: 1 }}>
                          <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>{w.name}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                              <Star size={12} color="#fbbf24" fill="#fbbf24" />
                              <Text style={{ color: '#d4d4d8', fontSize: 12, fontWeight: 'bold' }}>{w.rating || 3}</Text>
                            </View>
                            <Text style={{ color: '#52525b', fontSize: 12 }}>•</Text>
                            <Text style={{ color: '#a1a1aa', fontSize: 12 }}>{w.completedJobs || 0} jobs</Text>
                          </View>
                       </View>
                       <TouchableOpacity onPress={() => onSelect(job, w)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(59,130,246,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                          <MessageSquare size={18} color="#60a5fa" />
                       </TouchableOpacity>
                     </View>
                   ))
                 )
              )}
            </View>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
