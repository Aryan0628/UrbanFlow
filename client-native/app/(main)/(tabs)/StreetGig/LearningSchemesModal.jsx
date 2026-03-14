import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated as RNAnimated, Easing } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { X, GraduationCap, ArrowUpRight, Award, Zap } from 'lucide-react-native';
import { api } from '../../../../lib/api';

export default function LearningSchemesModal({ visible, onClose }) {
  const [isLoading, setIsLoading] = useState(true);
  const [schemesData, setSchemesData] = useState({ upgradationCourses: [], improvementCourses: [] });
  // Used for basic pulsing animation if lottie isn't guaranteed
  const [pulseAnim] = useState(new RNAnimated.Value(0.5));

  useEffect(() => {
    if (visible) {
      setIsLoading(true);
      fetchSchemes();
      startPulse();
    }
  }, [visible]);

  const startPulse = () => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        RNAnimated.timing(pulseAnim, {
          toValue: 0.5,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();
  };

  const fetchSchemes = async () => {
    try {
      const res = await api.get('/api/user/learning-schemes');
      if (res.data?.success) {
         setSchemesData({
           upgradationCourses: res.data.upgradationCourses || [],
           improvementCourses: res.data.improvementCourses || []
         });
      }
    } catch (err) {
      console.error('Error fetching learning schemes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.overlay}>
      <Animated.View entering={SlideInDown.springify().damping(20)} exiting={SlideOutDown} style={styles.modalContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={styles.iconBox}>
              <GraduationCap size={24} color="#facc15" />
            </View>
            <View>
              <Text style={styles.title}>AI Career Growth</Text>
              <Text style={styles.subtitle}>Recommended Govt. Schemes</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={20} color="#a1a1aa" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <RNAnimated.View style={[styles.aiCore, { opacity: pulseAnim, transform: [{ scale: pulseAnim }] }]}>
               <Zap size={40} color="#60a5fa" />
            </RNAnimated.View>
            <Text style={styles.loadingText}>AI is analyzing your profile...</Text>
            <Text style={styles.loadingSub}>Scanning over 150+ govt skill initiatives.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            
            {/* Upgrade Courses */}
            <View style={styles.sectionContainer}>
               <View style={styles.sectionHeader}>
                  <ArrowUpRight size={20} color="#4ade80" />
                  <Text style={styles.sectionTitle}>Upgradation Courses</Text>
               </View>
               <Text style={styles.sectionDesc}>Courses matching your current skills (Master Profile) to help you certify and charge more.</Text>
               
               {schemesData.upgradationCourses.length === 0 ? (
                 <Text style={styles.emptyText}>No matching upgrade courses found yet.</Text>
               ) : (
                 schemesData.upgradationCourses.map((scheme, idx) => (
                    <SchemeCard key={`up-${scheme.id}-${idx}`} scheme={scheme} type="UPGRADE" />
                 ))
               )}
            </View>

            {/* Improvement Courses */}
            <View style={styles.sectionContainer}>
               <View style={styles.sectionHeader}>
                  <Award size={20} color="#facc15" />
                  <Text style={styles.sectionTitle}>Improvement Courses</Text>
               </View>
               <Text style={styles.sectionDesc}>Courses recommended based on AI feedback from your recent job completions.</Text>
               
               {schemesData.improvementCourses.length === 0 ? (
                 <View style={styles.emptyImprovementBox}>
                    <Text style={styles.emptyTitle}>Complete more jobs on StreetGig!</Text>
                    <Text style={styles.emptyText}>Our AI will analyze employer feedback and recommend courses exactly where you need improvement.</Text>
                 </View>
               ) : (
                 schemesData.improvementCourses.map((scheme, idx) => (
                    <SchemeCard key={`imp-${scheme.id}-${idx}`} scheme={scheme} type="IMPROVE" />
                 ))
               )}
            </View>

          </ScrollView>
        )}
      </Animated.View>
    </Animated.View>
  );
}

const SchemeCard = ({ scheme, type }) => {
  const isUpgrade = type === 'UPGRADE';
  const themeColor = isUpgrade ? '#4ade80' : '#facc15';
  const bgColor = isUpgrade ? 'rgba(74, 222, 128, 0.05)' : 'rgba(250, 204, 21, 0.05)';
  const borderColor = isUpgrade ? 'rgba(74, 222, 128, 0.2)' : 'rgba(250, 204, 21, 0.2)';

  return (
    <View style={[styles.card, { backgroundColor: bgColor, borderColor: borderColor }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
         <Text style={styles.schemeTitle} numberOfLines={2}>{scheme.title}</Text>
         <View style={[styles.badge, { backgroundColor: `${themeColor}20`, borderColor: `${themeColor}40` }]}>
            <Text style={[styles.badgeText, { color: themeColor }]}>{(scheme.similarityScore * 100).toFixed(0)}% Match</Text>
         </View>
      </View>
      <Text style={styles.providerText}>{scheme.provider}</Text>
      
      <View style={styles.tagsRow}>
         <View style={styles.tag}>
            <Text style={styles.tagText}>{scheme.duration}</Text>
         </View>
         <View style={styles.tag}>
            <Text style={styles.tagText}>{scheme.eligibility}</Text>
         </View>
      </View>
      
      <Text style={styles.schemeDesc} numberOfLines={3}>{scheme.description}</Text>
      
      <View style={styles.benefitsBox}>
         <Text style={styles.benefitsTitle}>Benefits:</Text>
         <Text style={styles.benefitsText}>{scheme.stipend_or_benefits}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 999,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#18181b', borderTopLeftRadius: 32, borderTopRightRadius: 32,
    height: '90%', borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)'
  },
  iconBox: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(250, 204, 21, 0.1)',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.2)'
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 13, color: '#a1a1aa', marginTop: 2 },
  closeBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20 },
  
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  aiCore: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(96, 165, 250, 0.15)', borderWidth: 2, borderColor: '#60a5fa', alignItems: 'center', justifyContent: 'center', marginBottom: 24, shadowColor: '#60a5fa', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 20 },
  loadingText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  loadingSub: { color: '#a1a1aa', fontSize: 14, textAlign: 'center' },
  
  scrollContainer: { padding: 20, paddingBottom: 40 },
  
  sectionContainer: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  sectionDesc: { fontSize: 13, color: '#a1a1aa', marginBottom: 16, lineHeight: 20 },
  
  emptyText: { color: '#71717a', fontSize: 14, fontStyle: 'italic', paddingVertical: 12 },
  emptyImprovementBox: { borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)', backgroundColor: 'rgba(59, 130, 246, 0.05)', padding: 16, borderRadius: 16, borderStyle: 'dashed' },
  emptyTitle: { color: '#60a5fa', fontSize: 15, fontWeight: 'bold', marginBottom: 6 },
  
  card: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  schemeTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', flex: 1, marginRight: 12, lineHeight: 22 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  providerText: { fontSize: 13, color: '#a1a1aa', marginBottom: 12 },
  
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tag: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  tagText: { color: '#d4d4d8', fontSize: 11, fontWeight: '600' },
  
  schemeDesc: { fontSize: 13, color: '#c0caf5', lineHeight: 20, marginBottom: 12 },
  
  benefitsBox: { backgroundColor: 'rgba(0,0,0,0.2)', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  benefitsTitle: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginBottom: 4 },
  benefitsText: { color: '#a1a1aa', fontSize: 13, fontStyle: 'italic' },
});
