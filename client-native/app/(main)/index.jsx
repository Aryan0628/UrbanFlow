import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
  StatusBar,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useAuth0 } from 'react-native-auth0';
import { ref, onValue, off, update, get } from 'firebase/database';
import { db } from '../../lib/firebase';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../lib/api';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import {
  Shield, Megaphone, Briefcase, Heart,
  LogOut, Bell, X, Flame, Siren,
  CheckCircle2, MapPin, Sun, Cloud,
  CloudRain, Snowflake,
} from 'lucide-react-native';

// ─── Distance helper ──────────────────────────────────────────────
const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// ─── Feature Cards Data ───────────────────────────────────────────
const FEATURES = [
  {
    id: 'women-safety',
    title: 'SisterHood',
    description: 'Navigate with confidence using AI-driven safe routes, real-time tracking, and instant SOS alerts.',
    route: '/(main)/(tabs)/SisterHood',
    Icon: Shield,
  },
  {
    id: 'reports',
    title: 'CivicConnect',
    description: 'Submit grievances related to infrastructure, electricity, water, and waste management.',
    route: '/(main)/(tabs)/CivicConnect',
    Icon: Megaphone,
  },
  {
    id: 'jobs',
    title: 'StreetGig',
    description: 'Empower your livelihood by finding verified local job opportunities matched to your skills.',
    route: '/(main)/(tabs)/StreetGig',
    Icon: Briefcase,
  },
  {
    id: 'ngo',
    title: 'KindShare',
    description: 'Bridge the gap between communities and NGOs for faster, more effective social impact.',
    route: '/(main)/(tabs)/KindShare',
    Icon: Heart,
  },
];

// ─── Weather icon helper ──────────────────────────────────────────
const WeatherIcon = ({ code }) => {
  if (code <= 3) return <Sun size={16} color="#facc15" />;
  if (code <= 48) return <Cloud size={16} color="#9ca3af" />;
  if (code <= 82) return <CloudRain size={16} color="#60a5fa" />;
  if (code <= 99) return <Snowflake size={16} color="#a5f3fc" />;
  return <Sun size={16} color="#facc15" />;
};

// ─── Notification Banner ──────────────────────────────────────────
function NotificationBanner({ type, data, onAcknowledge, onConfirm }) {
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const isRed = type === 'arrival';
  const accent = isRed ? '#ef4444' : '#10b981';
  const accentDim = isRed ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)';
  const accentBorder = isRed ? 'rgba(239,68,68,0.4)' : 'rgba(16,185,129,0.4)';

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, []);

  return (
    <Animated.View
      style={{
        transform: [{ translateY: slideAnim }],
        position: 'absolute',
        top: Platform.OS === 'ios' ? 110 : 90,
        right: 16,
        left: 16,
        zIndex: 100,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: 'rgba(10,10,20,0.97)',
        borderWidth: 1,
        borderColor: accentBorder,
        shadowColor: accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 20,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.05)',
          backgroundColor: 'rgba(255,255,255,0.04)',
        }}
      >
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: accent }} />
        <Text style={{ color: accent, fontSize: 10, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' }}>
          {isRed ? 'Action Required' : 'Mission Update'}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 }}>
        <View style={{ backgroundColor: accentDim, borderRadius: 12, borderWidth: 1, borderColor: accentBorder, padding: 10 }}>
          {isRed ? <Siren size={22} color="#ef4444" /> : <CheckCircle2 size={22} color="#10b981" />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
            {isRed ? 'Unit Has Arrived' : 'Incident Resolved?'}
          </Text>
          <Text style={{ color: '#9ca3af', fontSize: 11, marginTop: 2 }}>
            {isRed
              ? <Text><MapPin size={10} color="#ef4444" /> {data?.unitName} is here · {data?.distance}m away</Text>
              : 'Confirm to close this report.'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={isRed ? onAcknowledge : onConfirm}
        style={{ backgroundColor: accent, paddingVertical: 12, alignItems: 'center' }}
        activeOpacity={0.8}
      >
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase' }}>
          {isRed ? 'Acknowledge' : 'Confirm & Close'}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────
function FeatureCard({ feature, onPress }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const IconComp = feature.Icon;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], flex: 1 }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()}
        activeOpacity={1}
        style={{
          backgroundColor: 'rgba(255,255,255,0.03)',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
          padding: 20,
          height: 200,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
            width: 56,
            height: 56,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <IconComp size={28} color="#fff" />
        </View>

        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18, marginBottom: 6, letterSpacing: -0.3, textAlign: 'center' }}>
            {feature.title}
          </Text>
          <Text numberOfLines={3} style={{ color: '#a1a1aa', fontSize: 11, lineHeight: 16, textAlign: 'center', fontWeight: '500' }}>
            {feature.description}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── SOS Button ───────────────────────────────────────────────────
function FireSOSButton({ userCoords, storedUser }) {
  const [loading, setLoading] = useState(false);

  const handleSOS = () => {
    Alert.alert('Fire SOS', 'Are you sure you want to send an emergency fire alert?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send SOS',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await api.post('/api/sos/fire', {
              coords: userCoords,
              userId: storedUser?.sub,
              userEmail: storedUser?.email,
            });
            Alert.alert('SOS Sent', 'Emergency services have been notified.');
          } catch (e) {
            Alert.alert('Error', 'Failed to send SOS. Please call emergency services directly.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <TouchableOpacity
      onPress={handleSOS}
      style={{
        backgroundColor: 'rgba(239,68,68,0.1)',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.25)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      }}
      activeOpacity={0.8}
    >
      <Flame size={14} color="#ef4444" />
      <Text style={{ color: '#ef4444', fontWeight: '800', fontSize: 12, letterSpacing: 0.5 }}>
        {loading ? 'Sending…' : 'SOS'}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Notification Panel ───────────────────────────────────────────
function NotificationPanel({ visible, onClose }) {
  const NOTIFICATION_ICONS = [Shield, Megaphone, Briefcase, Heart, Flame];
  const MOCK_NOTIFICATIONS = [
    { id: 1, iconIdx: 0, text: 'SisterHood alert resolved in your area.', time: '2m ago' },
    { id: 2, iconIdx: 1, text: 'Your CivicConnect report was updated.', time: '15m ago' },
    { id: 3, iconIdx: 2, text: 'New StreetGig job match in your area.', time: '1h ago' },
    { id: 4, iconIdx: 3, text: 'KindShare donation drive nearby.', time: '3h ago' },
    { id: 5, iconIdx: 4, text: 'Fire alert near Sector 4 resolved.', time: '5h ago' },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#0a0a14' }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(255,255,255,0.07)',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Bell size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>Notifications</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: 'rgba(255,255,255,0.08)',
              borderRadius: 20,
              width: 32,
              height: 32,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <X size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
          {MOCK_NOTIFICATIONS.map((n) => {
            const NIcon = NOTIFICATION_ICONS[n.iconIdx];
            return (
              <View
                key={n.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 12,
                  paddingVertical: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: 'rgba(255,255,255,0.05)',
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <NIcon size={18} color="#9ca3af" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#e5e7eb', fontSize: 13, lineHeight: 19 }}>{n.text}</Text>
                  <Text style={{ color: '#6b7280', fontSize: 11, marginTop: 3 }}>{n.time}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────
export default function Dashboard() {
  const { logout } = useAuth0();
  const { user: storedUser } = useAuthStore();

  const [weather, setWeather] = useState(null);
  const [userCoords, setUserCoords] = useState(null);
  const [arrivalNotification, setArrivalNotification] = useState(null);
  const [resolvedNotification, setResolvedNotification] = useState(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const resolvedSessionIds = useRef(new Set());
  const acknowledgedIds = useRef(new Set());

  // ── Weather via expo-location ──
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.error('Location permission denied');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = loc.coords;
        setUserCoords({ lat: latitude, lng: longitude });

        try {
          // Wrapped fetch in its own try/catch to gracefully handle network failures on Emulators
          const resp = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`
          );
          if (resp.ok) {
            const data = await resp.json();
            setWeather(data.current);
          }
        } catch (networkErr) {
          console.warn('Weather network fetch failed (ignoring for Emulator):', networkErr.message);
        }

      } catch (e) {
        console.error('Weather/Location error:', e);
      }
    })();
  }, []);

  // ── Firebase fire alert listener ──
  useEffect(() => {
    if (!storedUser) return;
    const userEmail = storedUser.email;
    const alertsRef = ref(db, 'fireAlerts');

    const unsubscribe = onValue(alertsRef, (snapshot) => {
      const allGeohashes = snapshot.val();
      if (!allGeohashes) return;

      let foundReport = null;
      let reportGeohash = null;

      Object.keys(allGeohashes).forEach((ghKey) => {
        const reports = allGeohashes[ghKey];
        Object.keys(reports).forEach((reportId) => {
          const r = reports[reportId];
          if (r.userEmail === userEmail) {
            foundReport = { ...r, id: reportId };
            reportGeohash = ghKey;
          }
        });
      });

      if (!foundReport) return;

      if (foundReport.status === 'RESOLVED') {
        setResolvedNotification({
          id: foundReport.id,
          geohash: reportGeohash,
          assignedTo: foundReport.assignedTo,
          userId: foundReport.userId,
          fullReportData: foundReport,
        });
        setArrivalNotification(null);
        return;
      }

      if (
        (foundReport.status === 'ASSIGNED' || foundReport.status === 'EN_ROUTE') &&
        foundReport.assignedTo
      ) {
        const truckId = foundReport.assignedTo.replace(/[^a-zA-Z0-9]/g, '_');
        const truckRef = ref(db, `staff/fire/${reportGeohash}/${truckId}/coords`);

        onValue(truckRef, (truckSnap) => {
          const tc = truckSnap.val();
          if (tc && foundReport.coords) {
            const dist = getDistanceInMeters(
              parseFloat(tc.lat), parseFloat(tc.lng),
              parseFloat(foundReport.coords.lat), parseFloat(foundReport.coords.lng)
            );
            const isAck = acknowledgedIds.current.has(foundReport.id);
            if (dist <= 50 && !isAck) {
              setArrivalNotification({
                id: foundReport.id,
                unitName: foundReport.assignedToName || 'Rescue Unit',
                distance: Math.round(dist),
              });
            } else if (dist > 100 || isAck) {
              setArrivalNotification(null);
            }
          }
        });
        return () => off(truckRef);
      }
    });

    return () => unsubscribe();
  }, [storedUser]);

  // ── Handlers ──
  const handleAcknowledgeArrival = () => {
    if (arrivalNotification?.id) {
      acknowledgedIds.current.add(arrivalNotification.id);
      setArrivalNotification(null);
    }
  };

  const handleResolutionConfirm = async () => {
    if (!resolvedNotification) return;
    const { id, geohash, assignedTo, userId } = resolvedNotification;
    try {
      const reportRef = ref(db, `fireAlerts/${geohash}/${id}`);
      const snapshot = await get(reportRef);
      resolvedSessionIds.current.add(id);

      if (snapshot.exists()) {
        try {
          await api.post('/api/reports/saveFireReport', snapshot.val(), {});
        } catch {
          Alert.alert('Error', 'Failed to archive report. Please try again.');
          return;
        }
      }

      const updates = {};
      updates[`fireAlerts/${geohash}/${id}`] = null;
      if (assignedTo) {
        const sanitized = assignedTo.replace(/[^a-zA-Z0-9]/g, '_');
        updates[`staff/fire/${geohash}/${sanitized}`] = null;
      }
      updates[`userActiveAlerts/${userId}`] = null;
      await update(ref(db), updates);

      setResolvedNotification(null);
      setArrivalNotification(null);
    } catch (e) {
      console.error('Resolution failed:', e);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#050510' }}>
      <StatusBar barStyle="light-content" backgroundColor="#050510" />

      {/* ── Notification Banners ── */}
      {arrivalNotification && !resolvedNotification && (
        <NotificationBanner
          type="arrival"
          data={arrivalNotification}
          onAcknowledge={handleAcknowledgeArrival}
        />
      )}
      {resolvedNotification && (
        <NotificationBanner
          type="resolved"
          data={resolvedNotification}
          onConfirm={handleResolutionConfirm}
        />
      )}

      {/* ── Notification Modal ── */}
      <NotificationPanel
        visible={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />

      {/* ── HEADER ── */}
      <View
        style={{
          paddingTop: Platform.OS === 'ios' ? 54 : 40,
          paddingHorizontal: 16,
          paddingBottom: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(5,5,16,0.95)',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <View style={{ flexShrink: 1, marginRight: 8 }}>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 }} numberOfLines={1}>
            Urban<Text style={{ color: '#818cf8' }}>Flow</Text>
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {weather && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderRadius: 20,
                paddingHorizontal: 8,
                paddingVertical: 6,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.08)',
              }}
            >
              <WeatherIcon code={weather.weather_code} />
              <Text style={{ color: '#e5e7eb', fontWeight: '700', fontSize: 13 }}>
                {Math.round(weather.temperature_2m)}°C
              </Text>
            </View>
          )}

          <FireSOSButton userCoords={userCoords} storedUser={storedUser} />

          <TouchableOpacity
            onPress={() => setIsNotificationOpen(true)}
            style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              borderRadius: 18,
              width: 36,
              height: 36,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <Bell size={18} color="#d4d4d8" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogout}
            style={{
              backgroundColor: 'rgba(239,68,68,0.1)',
              borderRadius: 18,
              width: 36,
              height: 36,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(239,68,68,0.25)',
            }}
          >
            <LogOut size={18} color="#f87171" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── MAIN CONTENT ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: '#fff', fontSize: 30, fontWeight: '900', letterSpacing: -1, lineHeight: 36, marginBottom: 8 }}>
            Explore<Text style={{ color: '#818cf8' }}> Features</Text>
          </Text>
          <Text style={{ color: '#6b7280', fontSize: 13, lineHeight: 20, maxWidth: 280 }}>
            AI-powered tools designed to improve urban living, safety, and community connection.
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <FeatureCard feature={FEATURES[0]} onPress={() => router.push(FEATURES[0].route)} />
            <FeatureCard feature={FEATURES[1]} onPress={() => router.push(FEATURES[1].route)} />
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <FeatureCard feature={FEATURES[2]} onPress={() => router.push(FEATURES[2].route)} />
            <FeatureCard feature={FEATURES[3]} onPress={() => router.push(FEATURES[3].route)} />
          </View>
        </View>

        {storedUser && (
          <View
            style={{
              marginTop: 24,
              backgroundColor: 'rgba(255,255,255,0.03)',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.06)',
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            {storedUser.picture ? (
              <Image
                source={{ uri: storedUser.picture }}
                style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}
              />
            ) : (
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#6b7280', fontWeight: '700', fontSize: 16 }}>
                  {storedUser.name?.charAt(0)?.toUpperCase()}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#e5e7eb', fontSize: 14, fontWeight: '600' }}>
                {storedUser.name}
              </Text>
              <Text style={{ color: '#6b7280', fontSize: 11, marginTop: 1 }}>
                {storedUser.email}
              </Text>
            </View>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' }} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}