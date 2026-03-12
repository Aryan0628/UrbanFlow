import React from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import JobCard from './JobCard';

export default function JobList({ jobs, onSelect, selectedJobId, isLoading }) {
  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
        <ActivityIndicator size="small" color="#71717a" />
        <Text style={{ color: '#71717a', fontSize: 12, marginTop: 8 }}>Finding opportunities...</Text>
      </View>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 }}>
        <Text style={{ color: '#71717a', fontSize: 14, textAlign: 'center' }}>
          No jobs found in this area yet.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          isSelected={selectedJobId === job.id}
          onClick={() => onSelect(job)}
        />
      ))}
    </ScrollView>
  );
}
