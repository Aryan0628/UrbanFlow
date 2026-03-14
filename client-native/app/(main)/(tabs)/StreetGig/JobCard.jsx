import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MapPin, Clock, IndianRupee, Sparkles, MessageSquare } from 'lucide-react-native';

export default function JobCard({ job, isSelected, onClick, onChat }) {
  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
        backgroundColor: isSelected ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.03)',
        borderColor: isSelected ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)',
        overflow: 'hidden'
      }}
    >
      <TouchableOpacity
        onPress={onClick}
        activeOpacity={0.8}
        style={{ padding: 16 }}
      >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={{
              fontWeight: 'bold',
              fontSize: 16,
              color: isSelected ? '#60a5fa' : '#e4e4e7',
              marginBottom: 4,
            }}
          >
            {job.category || job.title}
          </Text>

          {/* AI Recommendation Chip */}
          {job.recommendation && (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245,158,11,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginBottom: 8, alignSelf: 'flex-start' }}>
              <Sparkles size={12} color="#fbbf24" style={{ marginRight: 4 }} />
              <Text style={{ color: '#fcd34d', fontSize: 11, fontWeight: '600' }}>AI Match</Text>
            </View>
          )}

          <Text
            numberOfLines={2}
            style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 18 }}
          >
            {job.description || "No description provided."}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
            {job.time && (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                backgroundColor: 'rgba(255,255,255,0.04)', paddingHorizontal: 8, paddingVertical: 4,
                borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
              }}>
                <Clock size={12} color="#a1a1aa" />
                <Text style={{ fontSize: 12, color: '#a1a1aa' }}>{job.time}</Text>
              </View>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <MapPin size={12} color="#a1a1aa" />
              <Text style={{ fontSize: 12, color: '#a1a1aa' }}>
                {job.distance ? `${job.distance.toFixed(1)} km` : 'Nearby'}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 2,
            paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1,
            backgroundColor: isSelected ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.08)',
            borderColor: isSelected ? 'rgba(59,130,246,0.25)' : 'rgba(16,185,129,0.15)',
          }}>
            <IndianRupee size={12} color={isSelected ? '#93c5fd' : '#34d399'} />
            <Text style={{ fontWeight: 'bold', fontSize: 14, color: isSelected ? '#93c5fd' : '#34d399' }}>
              {job.amount || 'N/A'}
            </Text>
          </View>
        </View>
        </View>
      </TouchableOpacity>

      {/* Action Footer: Chat With Employer */}
      <View style={{
         flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.01)'
      }}>
         <TouchableOpacity 
           onPress={() => onChat(job)}
           style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 12, gap: 8 }}
         >
            <MessageSquare size={16} color="#a855f7" />
            <Text style={{ color: '#c084fc', fontWeight: 'bold', fontSize: 13 }}>Message Employer</Text>
         </TouchableOpacity>
      </View>
    </View>
  );
}
