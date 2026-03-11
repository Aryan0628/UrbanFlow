import React, { useEffect } from "react";
import { View, Text } from "react-native";
import { Stack, Redirect } from "expo-router";
import { useAuth0 } from "react-native-auth0";
import { useAuthStore } from "../../store/useAuthStore";
import CircularText from "../../components/ui/CircularText";

export default function ProtectedLayout() {
  const { isLoading } = useAuth0();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated && !isLoading) {
    return <Redirect href="/" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      {isLoading && (
        <View className="absolute inset-0 z-[999] bg-gray-900 items-center justify-center">
          <CircularText
            text="URBAN*FLOW*URBAN*FLOW "
            spinDuration={20}
            className="custom-class"
            textClassName="text-blue-400"
          />
        </View>
      )}
    </View>
  );
}