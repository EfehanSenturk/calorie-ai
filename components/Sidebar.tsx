import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React from "react";
import {
  Alert,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SidebarProps = {
  visible: boolean;
  onClose: () => void;
  animation: Animated.Value;
  analyses: AnalysisItem[];
};
type AnalysisItem = {
  id: string;
  title: string;
};

const Sidebar = ({ visible, onClose, animation, analyses }: SidebarProps) => {
  // Safe area insets değerlerini component mount olduğunda al
  const insets = useSafeAreaInsets();

  const handleDelete = async (id: string) => {
    try {
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        Alert.alert("Error", "You must be logged in to delete this analysis.");
        return;
      }

      await axios.delete(`http://localhost:3000/openai/analyses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Analiz silindikten sonra sidebar'ı güncelle
      router.replace("/");
    } catch (error) {
      console.error("Error deleting analysis:", error);
      Alert.alert("Error", "Failed to delete analysis.");
    }
  };

  // Sabit paddingleri bir kez hesaplayın
  const paddingTop = insets.top;
  const paddingBottom = insets.bottom;
  const paddingLeft = insets.left;

  return (
    <>
      {visible && (
        <Pressable style={styles.sidebarBackdrop} onPress={onClose}>
          <Animated.View
            style={[
              styles.sidebar,
              {
                transform: [{ translateX: animation }],
                paddingTop,
                paddingBottom,
                paddingLeft,
              },
            ]}
          >
            {/* Sidebar Başlığı */}
            <View style={styles.sidebarHeader}>
              <View style={styles.sidebarHeaderContent}>
                <Ionicons name="nutrition-outline" size={40} color="#4f46e5" />
                <View style={styles.sidebarHeaderText}>
                  <Text style={styles.sidebarTitle}>Calorie AI</Text>
                  <Text style={styles.sidebarSubtitle}>Food Analysis</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close-outline" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.sidebarMenu}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyHeaderText}>Analysis History</Text>
              </View>
              {analyses.length > 0 ? (
                analyses.map((analysis) => (
                  <TouchableOpacity
                    key={analysis.id}
                    style={styles.sidebarMenuItem}
                    onPress={() => {
                      onClose(); // Tıklandığında sidebar'ı kapat
                      router.push(`/(root)/analysis/${analysis.id}`);
                    }}
                  >
                    <View style={styles.menuItemContent}>
                      <Ionicons
                        name="document-text-outline"
                        size={22}
                        color="#4f46e5"
                      />
                      <Text
                        style={styles.sidebarMenuItemText}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {analysis.title}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation(); // Üst öğeye tıklama olayının geçmesini engelle
                        handleDelete(analysis.id);
                      }}
                      style={styles.deleteButton}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color="#ff3b30"
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noHistoryText}>No analyses found.</Text>
              )}
            </View>

            {/* Sidebar Altbilgi */}
            <View style={styles.sidebarFooter}></View>
          </Animated.View>
        </Pressable>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  // Sidebar arkaplanı (saydam siyah katman)
  sidebarBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 150,
  },

  // Sidebar ana container
  sidebar: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 280,
    height: "100%",
    backgroundColor: "#fff",
    zIndex: 151,
    // paddingTop kaldırıldı - useSafeAreaInsets kullanılacak
    flexDirection: "column",
    justifyContent: "space-between", // Footer için
  },

  // Sidebar Başlık
  sidebarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e4e8",
  },

  sidebarHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
  },

  sidebarHeaderText: {
    marginLeft: 12,
  },

  sidebarTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },

  sidebarSubtitle: {
    fontSize: 14,
    color: "#666",
  },

  // Sidebar Menü
  sidebarMenu: {
    flex: 1,
    paddingTop: 8,
  },

  sidebarMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Öğeleri doğru hizala
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e1e4e8",
    marginHorizontal: 0,
  },

  sidebarMenuItemText: {
    fontSize: 15,
    color: "#333",
    marginLeft: 12,
    flex: 1,
  },

  // Geçmiş Başlığı
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#e1e4e8",
  },

  historyHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },

  noHistoryText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 20,
    paddingHorizontal: 20,
  },

  // Sidebar Altbilgi
  sidebarFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e1e4e8",
  },

  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },

  signOutButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#ff3b30",
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1, // Esnek genişlik ver
  },
  deleteButton: {
    padding: 8, // Kolay tıklama için daha büyük dokunma alanı
  },
});

export default Sidebar;
