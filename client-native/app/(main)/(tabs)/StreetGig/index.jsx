import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, SafeAreaView, Platform, Alert, ScrollView } from 'react-native';
import { ArrowLeft, Briefcase, Map as MapIcon, List, MessageSquare, MapPin, AlertCircle } from 'lucide-react-native';
import { ref as dbRef, set, serverTimestamp } from 'firebase/database';
import { api } from '../../../../lib/api';
import { db } from '../../../../lib/firebase';
import { useAuthStore } from '../../../../store/useAuthStore';
import { useAuth0 } from 'react-native-auth0';
import { router } from 'expo-router';
import * as Location from 'expo-location';

import JobCreate from './JobCreate';
import JobList from './JobList';
import MyJobs from './MyJobs';
import JobChat from './JobChat';
import JobsMap from './JobsMap';

export default function StreetGigIndex() {
  const { user } = useAuthStore();
  const { getCredentials } = useAuth0();

  const [activeTab, setActiveTab] = useState('ALL');
  const [mobileTab, setMobileTab] = useState('map');

  const [userProfile, setUserProfile] = useState(null);
  const [showWorkerPrompt, setShowWorkerPrompt] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [selectedWorkerCategory, setSelectedWorkerCategory] = useState('');

  const CATEGORIES = ['Movers', 'Carpenter', 'Plumber', 'Electrician', 'Masonry', 'Cleaners'];

  const [jobs, setJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  /* ------------ LOCATION ------------ */
  const requestLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is required to view nearby jobs.');
        setIsLoadingLocation(false);
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setUserLocation({ lat: location.coords.latitude, lng: location.coords.longitude });
    } catch (err) {
      console.error('Location denied', err);
      Alert.alert('Error', 'Could not fetch location.');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleSkip = () => router.back();

  /* ------------ DATA FETCHING ------------ */
  const fetchJobs = async () => {
    if (!userLocation) return;
    try {
      const res = await api.get('/api/jobs/nearby', { params: { lat: userLocation.lat, lng: userLocation.lng } });
      setJobs(res.data.jobs || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    }
  };

  const fetchMyJobs = async () => {
    if (!user) return;
    try {
      const credentials = await getCredentials();
      if (!credentials) return;
      const res = await api.get('/api/jobs/my', { headers: { Authorization: `Bearer ${credentials.accessToken}` } });
      setMyJobs(res.data.jobs || []);
    } catch (err) {
      console.error('Error fetching my jobs:', err);
    }
  };

  useEffect(() => { if (userLocation) fetchJobs(); }, [userLocation]);
  useEffect(() => { 
    if (user?.sub) {
      fetchMyJobs();
      fetchUserProfile();
    } else {
      setIsLoadingProfile(false);
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const res = await api.get('/api/user/profile');
      const data = res.data.profile;
      setUserProfile(data);
      if (data.hasSeenWorkerPrompt === false) {
        setShowWorkerPrompt(true);
      }
    } catch (err) {
      console.error('Error fetching user profile', err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const setWorkerInterest = async (isInterested) => {
    if (isInterested && !selectedWorkerCategory) {
      Alert.alert('Select Category', 'Please choose your work category before signing up.');
      return;
    }
    setShowWorkerPrompt(false);
    try {
      const payload = { interestedToWork: isInterested };
      if (isInterested && selectedWorkerCategory) {
        payload.workerCategory = selectedWorkerCategory;
      }
      await api.patch('/api/user/worker-interest', payload);
      setUserProfile(prev => ({
        ...prev,
        interestedToWork: isInterested,
        hasSeenWorkerPrompt: true,
        ...(isInterested && selectedWorkerCategory ? { workerCategory: selectedWorkerCategory } : {})
      }));
      if (isInterested) {
        Alert.alert('Worker Profile Active', `You will now see ${selectedWorkerCategory} job listings.`);
      }
    } catch (error) {
      console.error('Error updating worker status:', error);
      Alert.alert('Error', 'Failed to update your preference.');
    }
  };

  /* ------------ ACTIONS ------------ */
  const selectJobAndJoin = async (job, selectedWorker = null) => {
    let employerId = job.employerId;
    // fallback if employerId missing, or use user.sub if it's the current user creating job
    if (!employerId) employerId = user?.sub; 
    
    const workerId = selectedWorker ? selectedWorker.id : user?.sub;
    
    // Sort to handle both poster->worker and worker->poster creating the same room name
    const participants = [String(employerId), String(workerId)].sort();
    const chatRoomSuffix = `${participants[0]}_${participants[1]}`;
    const chatRoomId = `${job.id}_chat_${chatRoomSuffix}`;

    setSelectedJob({ ...job, chatRoomId });
    setMobileTab('chat');
    
    if (!user) return;
    try {
      await set(dbRef(db, `jobs/rooms/${chatRoomId}/members/${user.sub}`), {
        joinedAt: serverTimestamp(), userName: user.name || 'Anonymous', userImage: user.picture || '',
      });
    } catch (err) {
      console.error('Failed to join job room:', err);
    }
  };

  /* ------------ LOCATION GATE ------------ */
  if (!userLocation) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#050510', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{ width: '100%', maxWidth: 400, backgroundColor: 'rgba(255,255,255,0.03)', padding: 32, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center' }}>
          <View style={{ height: 80, width: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <MapPin size={40} color="#fff" />
          </View>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 24 }}>Enable Location</Text>

          <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 16, flexDirection: 'row', gap: 12, marginBottom: 32, width: '100%' }}>
            <AlertCircle size={20} color="#4ade80" style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Local Jobs</Text>
              <Text style={{ color: '#d4d4d8', fontSize: 12, marginTop: 4, lineHeight: 18 }}>
                We need your location to show verified gigs and opportunities near you.
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={requestLocation} disabled={isLoadingLocation}
            style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginBottom: 16 }}>
            {isLoadingLocation ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Allow Access</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSkip} style={{ paddingVertical: 8 }}>
            <Text style={{ color: '#a1a1aa', fontSize: 14, fontWeight: '500' }}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /* ------------ MAIN UI ------------ */
  return (
    <View style={{ flex: 1, backgroundColor: '#050510' }}>

      {/* HEADER */}
      <View style={{ paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(5,5,16,0.95)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', zIndex: 50 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ height: 40, width: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={20} color="#a1a1aa" />
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 }}>
            Urban<Text style={{ color: '#818cf8' }}>Flow</Text>
          </Text>
        </View>

        <TouchableOpacity 
          onPress={() => setWorkerInterest(!userProfile?.interestedToWork)}
          style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: userProfile?.interestedToWork ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: userProfile?.interestedToWork ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.1)' }}
        >
          <Text style={{ color: userProfile?.interestedToWork ? '#60a5fa' : '#a1a1aa', fontSize: 12, fontWeight: 'bold' }}>
            {userProfile?.interestedToWork ? 'Worker On' : 'Worker Off'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* WORKER PROMPT MODAL */}
      {showWorkerPrompt && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 999, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ width: '100%', maxWidth: 400, backgroundColor: '#18181b', borderRadius: 24, padding: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center' }}>
            <View style={{ height: 64, width: 64, borderRadius: 32, backgroundColor: 'rgba(59,130,246,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <Briefcase size={32} color="#60a5fa" />
            </View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 12, textAlign: 'center' }}>Welcome to StreetGig!</Text>
            <Text style={{ fontSize: 15, color: '#a1a1aa', textAlign: 'center', marginBottom: 20, lineHeight: 22 }}>
              Choose your work category and sign up as a worker, or just post jobs.
            </Text>

            <Text style={{ color: '#d4d4d8', fontSize: 13, fontWeight: '600', alignSelf: 'flex-start', marginBottom: 10 }}>Select your skill:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24, width: '100%' }}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity key={cat} onPress={() => setSelectedWorkerCategory(cat)}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
                    backgroundColor: selectedWorkerCategory === cat ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.05)',
                    borderWidth: 1, borderColor: selectedWorkerCategory === cat ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.1)',
                  }}>
                  <Text style={{ color: selectedWorkerCategory === cat ? '#93c5fd' : '#a1a1aa', fontWeight: selectedWorkerCategory === cat ? 'bold' : '500', fontSize: 13 }}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ width: '100%', gap: 12 }}>
              <TouchableOpacity onPress={() => setWorkerInterest(true)} style={{ width: '100%', backgroundColor: selectedWorkerCategory ? '#2563eb' : 'rgba(37,99,235,0.3)', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Yes, Sign Me Up as Worker</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setWorkerInterest(false)} style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>No, Only Posting Jobs</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <View style={{ flex: 1 }}>

        {/* LIST VIEW */}
        {mobileTab === 'list' && (
          <View style={{ flex: 1, padding: 20 }}>
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 }}>StreetGig</Text>
              <Text style={{ fontSize: 14, color: '#a1a1aa' }}>Find verified local job opportunities.</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', paddingBottom: 16 }}>
              {['ALL', 'MY', 'CREATE'].map((tab) => (
                <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}
                  style={{
                    flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1, alignItems: 'center',
                    borderColor: activeTab === tab ? 'rgba(255,255,255,0.15)' : 'transparent',
                    backgroundColor: activeTab === tab ? 'rgba(255,255,255,0.06)' : 'transparent',
                  }}>
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: activeTab === tab ? '#fff' : '#71717a' }}>{tab}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flex: 1 }}>
              {activeTab === 'CREATE' && <JobCreate onCreated={fetchJobs} location={userLocation} />}
              {activeTab === 'ALL' && (
                userProfile?.interestedToWork ? (
                  <JobList
                    jobs={userProfile?.workerCategory
                      ? jobs.filter(j => j.category === userProfile.workerCategory)
                      : jobs}
                    onSelect={selectJobAndJoin}
                  />
                ) : (
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
                    <Briefcase size={48} color="rgba(255,255,255,0.1)" style={{ marginBottom: 16 }} />
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Worker Profile Inactive</Text>
                    <Text style={{ color: '#a1a1aa', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>You must register as a worker to browse local gig opportunities.</Text>
                    <TouchableOpacity onPress={() => setShowWorkerPrompt(true)} style={{ backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 }}>
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Become a Worker</Text>
                    </TouchableOpacity>
                  </View>
                )
              )}
              {activeTab === 'MY' && <MyJobs jobs={myJobs} onSelect={selectJobAndJoin} onUpdate={fetchMyJobs} />}
            </View>
          </View>
        )}

        {/* MAP VIEW */}
        {mobileTab === 'map' && (
          <View style={{ flex: 1 }}>
            <JobsMap jobs={jobs} selectedJob={selectedJob} onSelect={selectJobAndJoin} userLocation={userLocation} />
          </View>
        )}

        {/* CHAT VIEW */}
        {mobileTab === 'chat' && (
          <View style={{ flex: 1, paddingBottom: 80 }}>
            {selectedJob ? (
              <JobChat job={selectedJob} />
            ) : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
                <View style={{ height: 64, width: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                  <Briefcase size={32} color="#71717a" />
                </View>
                <Text style={{ color: '#a1a1aa', fontSize: 14, fontWeight: '500', marginBottom: 24 }}>Select a job to view details & chat</Text>
                <TouchableOpacity onPress={() => setMobileTab('map')}
                  style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>Browse Jobs on Map</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* FLOATING PILL NAV */}
        <View style={{ position: 'absolute', bottom: 32, left: 0, right: 0, alignItems: 'center', zIndex: 100 }}>
          <View style={{ flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.8)', padding: 6, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}>
            <TouchableOpacity onPress={() => setMobileTab('list')}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24,
                backgroundColor: mobileTab === 'list' ? 'rgba(168,85,247,0.2)' : 'transparent',
                borderWidth: 1, borderColor: mobileTab === 'list' ? 'rgba(168,85,247,0.3)' : 'transparent',
              }}>
              <List size={16} color={mobileTab === 'list' ? '#e9d5ff' : '#a1a1aa'} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setMobileTab('map')}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24,
                backgroundColor: mobileTab === 'map' ? 'rgba(255,255,255,0.12)' : 'transparent',
                borderWidth: 1, borderColor: mobileTab === 'map' ? 'rgba(255,255,255,0.2)' : 'transparent',
              }}>
              <MapIcon size={16} color={mobileTab === 'map' ? '#fff' : '#a1a1aa'} />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setMobileTab('chat')}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24,
                backgroundColor: mobileTab === 'chat' ? 'rgba(59,130,246,0.2)' : 'transparent',
                borderWidth: 1, borderColor: mobileTab === 'chat' ? 'rgba(59,130,246,0.3)' : 'transparent',
              }}>
              <MessageSquare size={16} color={mobileTab === 'chat' ? '#dbeafe' : '#a1a1aa'} />
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </View>
  );
}
