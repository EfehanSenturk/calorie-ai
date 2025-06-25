import { useAuthContext } from "@/lib/AuthProvider";
import * as SecureStore from "expo-secure-store";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  const { setIsLoggedIn, user } = useAuthContext();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>
        {user?.firstName} {user?.lastName}
      </Text>
      <TouchableOpacity
        onPress={() => {
          SecureStore.deleteItemAsync("token")
            .then(() => {
              setIsLoggedIn(false);
            })
            .catch((error) => {
              console.error("Error deleting token:", error);
            });
        }}
      >
        <Text style={{ color: "blue", marginTop: 20 }}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}
