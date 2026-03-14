// client-native/app/(main)/reports/index.jsx
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Platform, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, ArrowRight, List, MapPinOff, MapPin, AlertCircle } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from 'expo-location';

import { GRIEVANCE_CONFIG } from "../../../../components/features/Reports/config"; 
import ReportSidebar from "../../../../components/features/Reports/ReportSidebar";
import ReportMap from "../../../../components/features/Reports/ReportMap";

export default function ComplaintsPage() {
  const router = useRouter();
  
  // Location States
  const [userLocation, setUserLocation] = useState(null); 
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);
  
  // View States
  const [viewMode, setViewMode] = useState("form");
  const [mapRefreshTrigger, setMapRefreshTrigger] = useState(0);

  const handleReportSubmitted = () => setMapRefreshTrigger(prev => prev + 1);

  // Fetch Location Function
  const fetchLocation = async () => {
    setIsLocating(true);
    setLocationError(null);
    try {
      // 1. Request Permission
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError("Permission to access location was denied. We need this to tag your report.");
        setIsLocating(false);
        return;
      }

      // 2. Get Coordinates
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      // Save as {lat, lng} to match your web/backend payload structure
      setUserLocation({
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });
    } catch (error) {
      console.error("Location fetch error:", error);
      setLocationError("Could not determine your location. Please ensure GPS is enabled.");
    } finally {
      setIsLocating(false);
    }
  };

  // Run on mount (removed auto-fetch for gate)
  useEffect(() => {
    // fetchLocation(); 
  }, []);

  // --- UI: Location Gate ---
  if (!userLocation) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#050510', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{ width: '100%', maxWidth: 400, backgroundColor: 'rgba(255,255,255,0.03)', padding: 32, borderRadius: 24, alignItems: 'center' }}>
          <View style={{ height: 80, width: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <MapPin size={40} color="#818cf8" />
          </View>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 24 }}>Enable Location</Text>

          <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, flexDirection: 'row', gap: 12, marginBottom: 32, width: '100%' }}>
            <AlertCircle size={20} color={locationError ? "#ef4444" : "#818cf8"} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: locationError ? "#ef4444" : '#fff', fontSize: 14, fontWeight: '600' }}>
                {locationError ? "Access Required" : "Civic Awareness"}
              </Text>
              <Text style={{ color: '#d4d4d8', fontSize: 12, marginTop: 4, lineHeight: 18 }}>
                {locationError || "We need your location to accurately tag and route your reports to the correct municipal departments."}
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={fetchLocation} disabled={isLocating}
            style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', paddingVertical: 18, borderRadius: 16, alignItems: 'center', marginBottom: 16 }}>
            {isLocating ? <ActivityIndicator color="#818cf8" /> : <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Allow Access</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={{ paddingVertical: 8 }}>
            <Text style={{ color: '#a1a1aa', fontSize: 14, fontWeight: '500' }}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- UI: Main Content ---
  return (
    <SafeAreaView className="flex-1 bg-[#050510]">
      <LinearGradient
        colors={['#050510', '#0a0a14', '#000000']} 
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />

      {/* Header */}
      <View style={{ paddingTop: Platform.OS === 'ios' ? 10 : 0, height: 64, px: 4, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', zIndex: 50 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16, height: 40, width: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft size={20} color="#a1a1aa" />
        </TouchableOpacity>
        <Text style={{ marginLeft: 12, fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 }}>
          Urban<Text style={{ color: '#818cf8' }}>Flow</Text>
        </Text>
      </View>

      {/* Main Content Area */}
      <View className="flex-1">
        {viewMode === "form" ? (
          <View className="flex-1 w-full">
            <ReportSidebar 
              userLocation={userLocation} 
              onReportSubmitGlobal={handleReportSubmitted} 
            />
            
            {/* Map Toggle Button */}
            <View className="p-4 bg-[#050510]">
              <TouchableOpacity 
                onPress={() => setViewMode("map")}
                className="w-full bg-white/5 p-4 rounded-xl flex-row justify-center items-center"
              >
                <Text className="text-zinc-300 font-bold mr-2">View Issue Heatmap</Text>
                <ArrowRight size={16} color="#d4d4d8" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="flex-1 relative">
            <ReportMap userLocation={userLocation} refreshTrigger={mapRefreshTrigger} />
            
            {/* Back to Form Toggle */}
            <TouchableOpacity 
              onPress={() => setViewMode("form")}
              className="absolute bottom-8 self-center bg-white px-8 py-4 rounded-full shadow-lg flex-row items-center"
            >
              <List size={16} color="black" className="mr-2" />
              <Text className="text-black font-bold">Back to Report</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}