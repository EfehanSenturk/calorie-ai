import { useAuthContext } from "@/lib/AuthProvider";
import { Redirect, Stack } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";

const RootLayout = () => {
  const { isLoggedIn, isAuthLoading } = useAuthContext();

  if (isAuthLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!isLoggedIn) {
    return <Redirect href="/sign-in" />;
  }
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade_from_bottom",
          contentStyle: {
            backgroundColor: "#fff",
          },
          gestureEnabled: true,
          gestureDirection: "horizontal",
        }}
      ></Stack>
    </>
  );
};

export default RootLayout;
