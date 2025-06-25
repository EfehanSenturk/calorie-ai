import AuthProvider from "@/lib/AuthProvider";

import { Stack } from "expo-router";

export default function Layout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade_from_bottom",
          contentStyle: {
            backgroundColor: "#fff",
          },
        }}
      ></Stack>
    </AuthProvider>
  );
}
