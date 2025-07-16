import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FoodItem = {
  name: string;
  weight: string;
  calories: string;
};

type AnalysisResult = {
  title: string;
  items: FoodItem[];
  totalCalories: string;
};

type AnalysisDetail = {
  id: string;
  title: string;
  result: AnalysisResult;
  createdAt: string;
  imageUrl?: string;
};

const Details = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [analysis, setAnalysis] = useState<AnalysisDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof id === "string") {
      fetchAnalysisDetails(id);
    }
  }, [id]);

  const fetchAnalysisDetails = async (analysisId: string) => {
    try {
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        Alert.alert("Error", "You must be logged in to view this analysis.");
        return;
      }

      const response = await axios.get(
        `http://localhost:3000/openai/analyses/${analysisId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAnalysis(response.data);
    } catch (error: any) {
      console.error("Analysis fetch error:", error);
      Alert.alert(
        "Error",
        error?.response?.data?.message || "Failed to load analysis."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Analysis Details</Text>

        <TouchableOpacity
          onPress={() => router.replace("/")}
          style={styles.homeButton}
        >
          <Ionicons name="home-outline" size={24} color="#4f46e5" />
        </TouchableOpacity>
      </View>

      {/* İçerik */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color="#4f46e5" />
        ) : analysis ? (
          <View style={styles.resultCard}>
            {analysis.imageUrl && (
              <Image
                source={{
                  uri: analysis.imageUrl.startsWith("data:")
                    ? analysis.imageUrl
                    : `data:image/jpeg;base64,${analysis.imageUrl}`,
                }}
                style={styles.analysisImage}
                resizeMode="contain"
              />
            )}

            <Text style={styles.resultTitle}>{analysis.result.title}</Text>

            {analysis.result.items.map((item, index) => (
              <View key={index} style={styles.resultItem}>
                <Text style={styles.resultItemText}>
                  🍽 {item.name} — {item.weight}, {item.calories}
                </Text>
              </View>
            ))}

            <Text style={styles.totalCalories}>
              🔥 Total Calories: {analysis.result.totalCalories}
            </Text>

            <Text style={styles.createdAt}>
              📅 Created At: {new Date(analysis.createdAt).toLocaleString()}
            </Text>
          </View>
        ) : (
          <Text style={styles.errorText}>Analysis not found.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Details;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e4e8",
    backgroundColor: "#fff",
    zIndex: 10,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backText: {
    marginLeft: 6,
    fontSize: 16,
    color: "#333",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  homeButton: {
    padding: 6,
  },
  scrollContent: {
    padding: 20,
  },
  resultCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  analysisImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    color: "#333",
  },
  resultItem: {
    marginBottom: 8,
  },
  resultItemText: {
    fontSize: 16,
    color: "#444",
  },
  totalCalories: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "bold",
    color: "#e63946",
  },
  createdAt: {
    marginTop: 8,
    fontSize: 14,
    color: "#888",
  },
  errorText: {
    color: "#999",
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
  },
});
