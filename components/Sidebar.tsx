import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
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
                      router.push(`/(root)/analysis/${analysis.id}`);
                      // console.log(`Navigating to analysis ${analysis.id}`);
                    }}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={24}
                      color="#4f46e5"
                    />
                    <Text style={styles.sidebarMenuItemText}>
                      {analysis.title}
                    </Text>
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
    paddingVertical: 14,
    paddingHorizontal: 20,
  },

  sidebarMenuItemText: {
    marginLeft: 16,
    fontSize: 16,
    color: "#333",
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
});

export default Sidebar;
