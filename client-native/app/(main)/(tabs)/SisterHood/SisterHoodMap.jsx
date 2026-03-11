import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, Image, TouchableOpacity, StyleSheet, Platform, Animated, AppState, DeviceEventEmitter } from 'react-native';
import MapView, { PROVIDER_GOOGLE, AnimatedRegion, MarkerAnimated, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Shield, AlertTriangle, ArrowLeft, Compass } from 'lucide-react-native';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { router } from 'expo-router';
import ngeohash from 'ngeohash';
import { ref, update, onValue, off, set, remove, runTransaction } from 'firebase/database';

import { useAuthStore } from '../../../../store/useAuthStore';
import { db } from '../../../../lib/firebase';
import { calculateDistance, calculateBearing } from './_utils/locationMath';
import { getInitialStationaryBlocks } from './_utils/stationaryManager';
import { getForwardBlocks, evaluateSlidingWindow } from './_utils/windowManager';
import { addToRTDB } from './_utils/Rtdbadd';
import { removeFromRTDB } from './_utils/Rtdbdel';
import useCompass from './_utils/useCompass';
import { useGracefulExit } from './_utils/useGracefulExit';
import SOSBottomBar from './_components/SOSBottomBar';
import { startBackgroundService, stopBackgroundService, persistTrackingState, requestBackgroundLocationPermissions, getPersistedState } from './_utils/backgroundService';
import { setupNotificationCategory, setupNotificationResponseListener, showPersistentNotification, dismissPersistentNotification } from './_utils/notificationActions';
import { startVolumeListener, stopVolumeListener } from './_utils/volumeTrigger';

const DISTANCE_THRESHOLD = 15;
export default function SisterHoodMap() {
    const user = useAuthStore(state => state.user);
    const mapRef = useRef(null)
    const [currentLocation, setCurrentLocation] = useState(null)
    const [trackingMode, setTrackingMode] = useState('STATIONARY')
    const [sosActive, setSosActive] = useState(false)
    const [isRecording, setIsRecording] = useState(false);
    const [nearbyThreats, setNearbyThreats] = useState([]);
    const [markerLoaded, setMarkerLoaded] = useState(false);

    // Hardware Accelerated Compass FOV indicator
    const { headingAnim } = useCompass(100, 2);
    const spin = headingAnim.interpolate({
        inputRange: [-3600, 3600], // Extraneous range to prevent clamping wraparound
        outputRange: ['-3600deg', '3600deg']
    });

    // Smooth Marker Animation State
    const animatedLocRef = useRef(new AnimatedRegion({
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0,
        longitudeDelta: 0,
    }));

    const modeRef = useRef('STATIONARY')
    const blocksRef = useRef([])
    const anchorRef = useRef(null)
    const lastCoordRef = useRef(null)
    const bearingRef = useRef(0)
    const lastGeo8Ref = useRef(null);
    const lastGeo6Ref = useRef(null);

    const isMounted = useRef(true);
    const isProcessingRef = useRef(false);
    const locationSubRef = useRef(null);
    const appStateRef = useRef(AppState.currentState);
    const isInBackground = useRef(false);
    const isTransitioningRef = useRef(false);
    const sosActiveRef = useRef(sosActive);

    // Keep ref in sync
    useEffect(() => {
        sosActiveRef.current = sosActive;
    }, [sosActive]);

    const { handleBackPress } = useGracefulExit({
        user,
        blocksRef,
        lastGeo6Ref,
        sosActive,
        onExit: async () => {
            console.log("⏹️ Stopping services from in-app exit.");
            await stopBackgroundService();
            await dismissPersistentNotification();
        }
    });

    useEffect(() => {
        isMounted.current = true;
        let locationSubscription;

        const startTracking = async () => {
            if (!user) return;

            // Request background permissions
            const hasBgPerms = await requestBackgroundLocationPermissions();
            if (!hasBgPerms) {
                Alert.alert(
                    "Background Access Required",
                    "Sisterhood Shield needs 'Allow all the time' location access to protect you when the app is minimized.",
                    [{ text: "OK" }]
                );
                // Continue with foreground only if denied
            }

            try {
                const initialLoc = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced
                });

                if (!isMounted.current) return; // Prevent state update if unmounted during await

                const { latitude, longitude } = initialLoc.coords;

                setCurrentLocation(initialLoc.coords);

                animatedLocRef.current.setValue({
                    latitude: initialLoc.coords.latitude,
                    longitude: initialLoc.coords.longitude,
                });

                lastCoordRef.current = initialLoc.coords;
                anchorRef.current = initialLoc.coords;

                const startingBlocks = getInitialStationaryBlocks(latitude, longitude, 50);
                blocksRef.current = startingBlocks;
                console.log(`Initial Load: Monitoring ${startingBlocks.length} stationary blocks.`);
                await addToRTDB(startingBlocks, user.id);

                if (!isMounted.current) return;
                const sub = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.High,
                        timeInterval: 2000,
                        distanceInterval: 1,
                    },
                    (newLocation) => {
                        if (isMounted.current && !isProcessingRef.current) {
                            handleLocationWorker(newLocation.coords);
                        }
                    }
                );
                locationSubRef.current = sub;

                // Robust Startup: Start the background service while in foreground to avoid Android background restrictions
                // Before overwriting, let's sync local UI in case background was already running (e.g. app killed but service alive)
                try {
                    const state = await getPersistedState();
                    if (state.sosActive !== sosActiveRef.current) setSosActive(state.sosActive);
                    if (state.isRecording) setIsRecording(true);
                } catch (e) {
                    console.error("Initial state sync failed:", e);
                }

                await persistTrackingState({
                    userId: user.id,
                    sosActive: sosActiveRef.current,
                    lastGeo6: lastGeo6Ref.current,
                    lastGeo8: lastGeo8Ref.current,
                    blocks: blocksRef.current,
                });
                await startBackgroundService();
                await showPersistentNotification(sosActiveRef.current);
            } catch (error) {
                console.error("Error starting location tracking:", error);
            }
        }

        // Setup notification infrastructure (listener handled globally in root layout)
        startTracking();

        // Listen for real-time updates from notification actions while app is active
        const sosListener = DeviceEventEmitter.addListener('SOS_STATE_CHANGED', (newState) => {
            if (isMounted.current && sosActiveRef.current !== newState) {
                console.log(`📡 Real-time sync: SOS changed to ${newState}`);
                setSosActive(newState);
            }
        });

        const recordListener = DeviceEventEmitter.addListener('RECORDING_STATE_CHANGED', (newState) => {
            if (isMounted.current) {
                console.log(`📡 Real-time sync: Recording changed to ${newState}`);
                setIsRecording(newState);
            }
        });

        // Start listening to Hardware Volume Buttons for SOS Trigger
        startVolumeListener(async () => {
            if (isMounted.current && !sosActiveRef.current) {
                console.log("🔊 Volume SOS Triggered! Activating Shield...");
                setSosActive(true);

                // If user is available, force an immediate RTDB update just like the UI button does
                if (user?.id) {
                    try {
                        await update(ref(db, `users/${user.id}`), { sos_triggered: true });
                        if (lastGeo6Ref.current) {
                            await set(ref(db, `active_sos/${lastGeo6Ref.current}/${user.id}`), {
                                lat: lastCoordRef.current?.latitude || 0,
                                lng: lastCoordRef.current?.longitude || 0,
                                picture: user.picture || user.photoURL || 'https://i.pravatar.cc/100',
                                timestamp: Date.now(),
                            });
                        }
                    } catch (e) {
                        console.error("Failed to broadcast Volume SOS to RTDB:", e);
                    }
                }
            }
        });

        return () => {
            isMounted.current = false;
            if (locationSubRef.current) {
                locationSubRef.current.remove();
            }
            sosListener.remove();
            recordListener.remove();
            stopVolumeListener();
        };
    }, []);

    // AppState listener: foreground ↔ background transitions
    useEffect(() => {
        const handleAppStateChange = async (nextAppState) => {
            if (!user || isTransitioningRef.current) return;

            const prevState = appStateRef.current;
            appStateRef.current = nextAppState; // Update immediately

            // App going to BACKGROUND
            if (prevState === 'active' && nextAppState.match(/inactive|background/)) {
                isTransitioningRef.current = true;
                console.log('📱 Transitioning to background tray');
                isInBackground.current = true;

                // We keep the background service running (it was started in foreground)
                // Just ensure notification is synced
                await showPersistentNotification(sosActiveRef.current);
                isTransitioningRef.current = false;
            }

            // App coming back to FOREGROUND
            if (prevState.match(/inactive|background/) && nextAppState === 'active') {
                isTransitioningRef.current = true;
                console.log('📱 App returning to foreground');
                isInBackground.current = false;

                // Sync states that might have changed in background notification
                try {
                    const state = await getPersistedState();
                    if (sosActiveRef.current !== state.sosActive) {
                        setSosActive(state.sosActive);
                    }
                    setIsRecording(state.isRecording);
                } catch (e) {
                    console.error("Failed to sync background state on foreground return:", e);
                }

                // We keep the background service running, but we might want to refresh the foreground watcher 
                // if it was killed by the OS (though watchPositionAsync usually persists)
                isTransitioningRef.current = false;
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription.remove();
    }, [user]); // Removed sosActive from dependencies to prevent listener re-registration
    // 2. Main Logic Loop (Runs on every step)
    const handleLocationWorker = async (newCoords) => {
        isProcessingRef.current = true;
        let currentGeohash6 = null;
        let currentGeohash8 = null;

        try {
            setCurrentLocation(newCoords);
            if (Platform.OS === 'android') {
                if (animatedLocRef.current) {
                    animatedLocRef.current.timing({
                        latitude: newCoords.latitude,
                        longitude: newCoords.longitude,
                        duration: 1500,
                        useNativeDriver: false
                    }).start();
                }
            }

            if (mapRef.current) {
                mapRef.current.animateCamera({
                    center: {
                        latitude: newCoords.latitude,
                        longitude: newCoords.longitude,
                    },
                    zoom: 17,
                    pitch: 50, // Angled 3D downward view (Navigation layout)
                }, { duration: 1500 });
            }
            const { latitude: lat, longitude: lng } = newCoords;
            currentGeohash6 = ngeohash.encode(lat, lng, 6);
            currentGeohash8 = ngeohash.encode(lat, lng, 8);
            if (user?.id) {
                update(ref(db, `users/${user.id}`), {
                    current_lat: lat,
                    current_lng: lng,
                    current_geohash_6: currentGeohash6,
                    current_geohash_8: currentGeohash8,
                    sos_triggered: sosActive,
                }).catch(e => console.error("Error updating users geo footprint", e));
            }

            // B. STATIONARY TO MOVING HANDOFF
            if (modeRef.current === 'STATIONARY') {
                // Safety: ensure anchor is set
                if (!anchorRef.current) {
                    anchorRef.current = newCoords;
                }
                const distanceWalked = calculateDistance(
                    anchorRef.current.latitude, anchorRef.current.longitude,
                    lat, lng
                );

                if (distanceWalked >= DISTANCE_THRESHOLD) {
                    // We broke the 15m threshold! Calculate starting bearing.
                    const startBearing = calculateBearing(
                        anchorRef.current.latitude, anchorRef.current.longitude,
                        lat, lng
                    );
                    bearingRef.current = startBearing;

                    // Fetch the forward path 
                    const newPath = getForwardBlocks(lat, lng, startBearing, 5);

                    console.log(`Switching to MOVING. Dropping 50m radius, tracking forward.`, newPath);

                    // Unload the old massive grid, load the 5 specific path blocks
                    removeFromRTDB(blocksRef.current, user.id);
                    addToRTDB(newPath, user.id);

                    blocksRef.current = newPath;
                    setTrackingMode('MOVING');
                    modeRef.current = 'MOVING';
                }
            }
            // C. MOVING SLIDING WINDOW
            else if (modeRef.current === 'MOVING') {
                // Safety: ensure lastCoord is set
                if (!lastCoordRef.current) {
                    lastCoordRef.current = newCoords;
                }
                const stepDistance = calculateDistance(
                    lastCoordRef.current.latitude, lastCoordRef.current.longitude,
                    lat, lng
                );

                // Only update our bearing heavily if we've taken a distinct step to prevent jitter
                if (stepDistance > 2) {
                    bearingRef.current = calculateBearing(
                        lastCoordRef.current.latitude, lastCoordRef.current.longitude,
                        lat, lng
                    );
                }
                const evalResult = evaluateSlidingWindow(
                    currentGeohash8,
                    blocksRef.current,
                    lat,
                    lng,
                    bearingRef.current
                );

                if (evalResult.status !== 'ON_TRACK') {
                    console.log(`Window Action Triggered: ${evalResult.status}`);
                    if (evalResult.toRemove.length > 0) {
                        removeFromRTDB(evalResult.toRemove, user.id);
                    }
                    if (evalResult.toAdd.length > 0) {
                        addToRTDB(evalResult.toAdd, user.id);
                    }

                    // Sync local state
                    blocksRef.current = evalResult.newWindow;
                }
            }

            // D. SOS STATE TRACKING EDGE CASES
            if (sosActive) {
                // Case 1 & 2: Geo8 Block Changes (Increment sos_count for new block)
                if (currentGeohash8 !== lastGeo8Ref.current) {
                    const blockRef = ref(db, `blocks/${currentGeohash8}`);
                    runTransaction(blockRef, (currentBlock) => {
                        // Only safely increment if the block actually exists
                        if (currentBlock && currentBlock.block_state) {
                            currentBlock.block_state.sos_count = (currentBlock.block_state.sos_count || 0) + 1;
                        }
                        return currentBlock;
                    }).catch(e => console.error("Failed to increment SOS count for block", e));
                }

                // Case 3: Geo6 Broadcasting Updates (Update active_sos)
                if (currentGeohash6 !== lastGeo6Ref.current) {
                    if (lastGeo6Ref.current) {
                        // Remove from old geo6
                        remove(ref(db, `active_sos/${lastGeo6Ref.current}/${user.id}`))
                            .catch(e => console.error("Failed to remove old SOS broadast", e));
                    }

                    // Add to new geo6
                    set(ref(db, `active_sos/${currentGeohash6}/${user.id}`), {
                        lat: lat,
                        lng: lng,
                        picture: user.picture || user.photoURL || 'https://i.pravatar.cc/100',
                        timestamp: Date.now()
                    }).catch(e => console.error("Failed to add new SOS broadcast", e));
                }
            }

        } catch (error) {
            console.error("Error in location loop worker:", error);
        } finally {
            isProcessingRef.current = false;
        }

        if (currentGeohash8) lastGeo8Ref.current = currentGeohash8;
        if (currentGeohash6) lastGeo6Ref.current = currentGeohash6;
        lastCoordRef.current = newCoords;

        // Sync with background task state
        if (user?.id) {
            persistTrackingState({
                userId: user.id,
                sosActive: sosActiveRef.current,
                lastGeo6: lastGeo6Ref.current,
                lastGeo8: lastGeo8Ref.current,
                blocks: blocksRef.current,
            });
        }
    };
    useEffect(() => {
        if (!user || !lastGeo6Ref.current) return;

        if (sosActive) {
            // 1. Immediately update user document
            update(ref(db, `users/${user.id}`), {
                sos_triggered: true
            }).catch(e => console.error("Failed to set user sos true", e));

            // 2. Immediately increment the current block's SOS count
            if (lastGeo8Ref.current) {
                const blockRef = ref(db, `blocks/${lastGeo8Ref.current}`);
                runTransaction(blockRef, (currentBlock) => {
                    if (currentBlock && currentBlock.block_state) {
                        currentBlock.block_state.sos_count = (currentBlock.block_state.sos_count || 0) + 1;
                    }
                    return currentBlock;
                }).catch(e => console.error("Failed to increment SOS count for block immediately", e));
            }

            // 3. Immediately broadcast to nearby threats channel
            if (currentLocation) {
                set(ref(db, `active_sos/${lastGeo6Ref.current}/${user.id}`), {
                    lat: currentLocation.latitude,
                    lng: currentLocation.longitude,
                    picture: user.picture || user.photoURL || 'https://i.pravatar.cc/100',
                    timestamp: Date.now()
                }).catch(e => console.error("Failed to start SOS broadcast", e));
            }
        } else {
            // 1. IMMEDIATELY erase our broadcast if SOS turns OFF
            remove(ref(db, `active_sos/${lastGeo6Ref.current}/${user.id}`))
                .catch(e => console.error("Failed to clean up SOS broadcast", e));

            // 2. Immediately update user document to clear sos
            update(ref(db, `users/${user.id}`), {
                sos_triggered: false
            }).catch(e => console.error("Failed to set user sos false", e));
        }
        // Note: We DO NOT decrement the geo8 block's sos_count. 
        // Threat metrics are historical and leave a permanent heatmap footprint.

        // Sync with background task
        persistTrackingState({
            userId: user.id,
            sosActive: sosActive,
            lastGeo6: lastGeo6Ref.current,
            lastGeo8: lastGeo8Ref.current,
            blocks: blocksRef.current,
        });
        showPersistentNotification(sosActive);
    }, [sosActive]);

    // 3. LISTEN FOR NEARBY THREATS / SOS GHOSTS
    useEffect(() => {
        if (!currentLocation || !user) return;
        const currentGeo6 = ngeohash.encode(currentLocation.latitude, currentLocation.longitude, 6);

        // Listen to active_sos inside the current geo6 region
        const nearbySosRef = ref(db, `active_sos/${currentGeo6}`);

        const listener = onValue(nearbySosRef, (snapshot) => {
            if (!snapshot.exists()) {
                setNearbyThreats([]);
                return;
            }

            const threats = [];
            snapshot.forEach((child) => {
                const threatData = child.val();
                const threatUserId = child.key;

                // Don't show ourselves as a threat
                if (threatUserId === user.id) return;

                const dist = calculateDistance(
                    currentLocation.latitude, currentLocation.longitude,
                    threatData.lat, threatData.lng
                );

                // Show women triggering SOS within a 2.5km vicinity locally
                if (dist <= 2500) {
                    threats.push({
                        id: threatUserId,
                        lat: threatData.lat,
                        lng: threatData.lng,
                        picture: threatData.picture,
                        distance: Math.round(dist)
                    });
                }
            });
            setNearbyThreats(threats);
        });

        return () => off(nearbySosRef, 'value', listener);
    }, [currentLocation, user]);

    // RENDER STATES
    if (!currentLocation) {
        return (
            <View className="flex-1 bg-[#09090b] items-center justify-center">
                <ActivityIndicator size="large" color="#ffffff" />
                <Text className="text-zinc-400 mt-4 font-medium tracking-tight">Establishing Identity Shield...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-black">
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={{ flex: 1, width: '100%', height: '100%' }}
                showsUserLocation={true}
                showsMyLocationButton={false}
                showsCompass={false}
                showsUserHeadingIndicator={true}
                initialRegion={{
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                }}
                customMapStyle={[
                    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                    {
                        featureType: "administrative.locality",
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#d59563" }],
                    },
                    {
                        featureType: "poi",
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#d59563" }],
                    },
                    {
                        featureType: "road",
                        elementType: "geometry",
                        stylers: [{ color: "#38414e" }],
                    },
                    {
                        featureType: "road",
                        elementType: "geometry.stroke",
                        stylers: [{ color: "#212a37" }],
                    },
                    {
                        featureType: "road.highway",
                        elementType: "geometry",
                        stylers: [{ color: "#746855" }],
                    },
                    {
                        featureType: "road.highway",
                        elementType: "geometry.stroke",
                        stylers: [{ color: "#1f2835" }],
                    },
                    {
                        featureType: "water",
                        elementType: "geometry",
                        stylers: [{ color: "#17263c" }],
                    },
                    {
                        featureType: "water",
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#515c6d" }],
                    },
                    {
                        featureType: "water",
                        elementType: "labels.text.stroke",
                        stylers: [{ color: "#17263c" }],
                    },
                ]}
            >
                {/* 1. CURRENT USER MARKER - Handled natively by Google Maps via showsUserLocation={true} on MapView */}

                {/* 2. SOS GHOST NEARBY MARKERS (Styled as solid red alerting dots) */}
                {nearbyThreats.map((threat) => (
                    <Marker
                        key={threat.id}
                        coordinate={{ latitude: threat.lat, longitude: threat.lng }}
                        anchor={{ x: 0.5, y: 0.5 }}
                    >
                        <View style={{ width: 60, height: 60, alignItems: 'center', justifyContent: 'center' }}>
                            {/* Blinking Red Ring Effect representing an active SOS user */}
                            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(239, 68, 68, 0.2)', alignItems: 'center', justifyContent: 'center' }} className="animate-pulse">
                                {/* The solid red inner dot with white border */}
                                <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#ef4444', borderColor: '#ffffff', borderWidth: 2, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 }} />
                            </View>
                            <View className="absolute bg-red-600 rounded-md px-2 py-0.5 -bottom-2 border border-red-400 shadow-xl">
                                <Text className="text-[9px] text-white font-bold tracking-widest uppercase">SOS</Text>
                            </View>
                        </View>
                    </Marker>
                ))}

            </MapView>

            {/* UPPER HUD */}
            <View className="absolute top-16 left-4 right-4 flex flex-row items-center justify-between z-50 pointer-events-box-none px-1">

                {/* Back Button */}
                <TouchableOpacity
                    onPress={handleBackPress}
                    activeOpacity={0.8}
                    className="bg-zinc-900/95 border border-zinc-800 h-12 w-12 rounded-full items-center justify-center shadow-2xl pointer-events-auto"
                >
                    <ArrowLeft size={22} color="#ffffff" />
                </TouchableOpacity>

                {/* Status Indicator (Sleek Pill) */}
                <View className="bg-zinc-900/95 border border-zinc-800 rounded-full px-4 py-2 flex-row items-center shadow-2xl pointer-events-auto mx-3 flex-1 justify-center max-w-[220px]">
                    <Shield size={16} color={trackingMode === 'MOVING' ? '#3b82f6' : '#22c55e'} className="mr-2" />
                    <Text className="text-white font-bold text-sm tracking-wide">
                        {trackingMode === 'STATIONARY' ? 'Securing Perimeter' : 'Shield Active'}
                    </Text>
                </View>

                {/* Threat Banner / Invisible Spacer */}
                {nearbyThreats.length > 0 ? (
                    <View className="bg-red-950/90 border border-red-500/50 rounded-full px-3 py-2 flex-row items-center shadow-xl pointer-events-auto">
                        <AlertTriangle size={16} color="#ef4444" className="mr-1.5" />
                        <Text className="text-red-400 text-xs font-bold tracking-wider">{nearbyThreats.length}</Text>
                    </View>
                ) : (
                    <View className="w-12 h-12" /> /* Spacer to keep center alignment */
                )}
            </View>

            {/* Recalibrate / Compass Button (Bottom Right) */}
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                    if (mapRef.current && currentLocation) {
                        mapRef.current.animateCamera({
                            center: { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
                            zoom: 17,
                            pitch: 50,
                            heading: 0
                        }, { duration: 1000 });
                    }
                }}
                className="absolute bottom-40 right-4 bg-zinc-900/90 border border-zinc-700/50 w-12 h-12 rounded-full items-center justify-center shadow-xl z-50 pointer-events-auto"
            >
                <Compass size={24} color="#3b82f6" />
            </TouchableOpacity>

            {/* ACTION BOTTOM BAR */}
            <SOSBottomBar
                sosActive={sosActive}
                onToggleSOS={setSosActive}
                currentLocation={currentLocation}
                isRecordingExternal={isRecording}
                onToggleRecordingExternal={setIsRecording}
            />
        </View>
    );
}

const styles = StyleSheet.create({});