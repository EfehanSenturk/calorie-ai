import Sidebar from "@/components/Sidebar";
import { useAuthContext } from "@/lib/AuthProvider";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type AnalysisItem = {
  id: string;
  title: string;
};

export default function Index() {
  const { setIsLoggedIn, user, setUser } = useAuthContext();
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<null | {
    title: string;
    items: { name: string; weight: string; calories: string }[];
    totalCalories: string;
  }>(null);

  const [analysisHistory, setAnalysisHistory] = useState<AnalysisItem[]>([]);
  const menuAnimation = useRef(new Animated.Value(0)).current;
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const sidebarAnimation = useRef(new Animated.Value(-300)).current;

  useEffect(() => {
    fetchUserAnalyses();
  }, [analysisResult]);

  const analyzeImage = async () => {
    if (!selectedImage) return;

    try {
      setLoading(true);
      setAnalysisResult(null);

      // Base64 formatını düzeltme
      const base64 = await FileSystem.readAsStringAsync(selectedImage, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Token'ı al
      const token = await SecureStore.getItemAsync("token");

      if (!token) {
        Alert.alert("Error", "You need to be logged in to analyze images");
        setLoading(false);
        return;
      }

      // İsteği logla
      console.log("Sending request with image length:", base64.length);

      // İstek gönderme formatını güncelle
      const response = await axios.post(
        "http://localhost:3000/openai/analyze",
        {
          image: base64,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          // Büyük istekler için timeout süresini artır
          timeout: 30000, // 30 saniye
        }
      );

      console.log("Response:", response.data);
      setAnalysisResult(response.data.result);
    } catch (error: any) {
      console.error("Analiz hatası:", error);

      // Daha detaylı hata mesajı için
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);

        if (error.response.status === 400) {
          Alert.alert(
            "Bad Request Error",
            "There was a problem with the image. It might be too large or in an unsupported format."
          );
        } else if (error.response.status === 401) {
          Alert.alert(
            "Authentication Error",
            "Please log in again to continue"
          );
        } else {
          Alert.alert(
            "Error",
            error.response?.data?.message || "An error occurred during analysis"
          );
        }
      } else if (error.request) {
        // İstek yapıldı ama cevap alınamadı
        Alert.alert("Network Error", "Could not connect to the server");
      } else {
        // İstek hazırlanırken bir şeyler yanlış gitti
        Alert.alert("Error", error.message || "An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAnalyses = async () => {
    try {
      const token = await SecureStore.getItemAsync("token");

      if (!token) {
        Alert.alert("Error", "You need to be logged in to fetch analyses");
        return;
      }

      const response = await axios.get(
        "http://localhost:3000/openai/analyses",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Fetched analyses:", response.data);
      setAnalysisHistory(response.data || []);
    } catch (error) {
      console.error("Error fetching analyses:", error);
      Alert.alert("Error", "Failed to fetch analyses. Please try again.");
    }
  };

  // Profil menüsünü aç/kapat
  const toggleProfileMenu = () => {
    if (profileMenuVisible) {
      Animated.timing(menuAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setProfileMenuVisible(false));
    } else {
      setProfileMenuVisible(true);
      Animated.timing(menuAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Required",
        "You need to allow access to your photos to upload an image."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setSelectedImage(uri); // Bu yine setState olarak güncellenir

      // Burada doğrudan uri üzerinden mime kontrolü yap
      const extension = uri.split(".").pop()?.toLowerCase();
      console.log("Selected image URI:", uri);
      console.log("Selected image extension:", extension);

      const allowed = ["jpg", "jpeg", "png", "webp", "gif"];
      if (!extension || !allowed.includes(extension)) {
        Alert.alert(
          "Unsupported Format",
          `You selected a .${
            extension || "unknown"
          } file. Please choose a JPEG, PNG, WEBP or GIF image.`
        );
        setSelectedImage(null); // Hatalı formatsa sıfırla
        return;
      }
    }
  };

  const reset = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
    setLoading(false);
  };

  // Çıkış yapma fonksiyonu
  const handleSignOut = async () => {
    try {
      await SecureStore.deleteItemAsync("token");

      // Durumu sıfırla
      reset();

      // Login durumunu güncelle - bu sayfayı otomatik olarak kapatacak
      // Bu en son yapılmalı çünkü componenti unmount edecek
      setIsLoggedIn(false);
    } catch (error) {
      console.error("Error during sign out:", error);
      Alert.alert("Error", "Failed to sign out. Please try again.");
    }
  };

  // Sidebar'ı açıp kapatan fonksiyon
  const toggleSidebar = () => {
    if (sidebarVisible) {
      // Sidebar'ı kapat
      Animated.timing(sidebarAnimation, {
        toValue: -300,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Animasyon tamamlandıktan sonra state'i güncelle
        setSidebarVisible(false);
      });
    } else {
      // Sidebar'ı aç
      setSidebarVisible(true);
      Animated.timing(sidebarAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.hamburgerButton}
          onPress={toggleSidebar}
        >
          <Ionicons name="menu-outline" size={28} color="#333" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Calorie AI</Text>

        <TouchableOpacity
          style={styles.profileButton}
          onPress={toggleProfileMenu}
        >
          <Ionicons name="person-circle-outline" size={28} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Tüm içeriği ScrollView içine alın */}
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Yüklemede değilse ve analiz sonucu yoksa görsel yükleme bölümünü göster */}
          {!loading && !analysisResult ? (
            <>
              <TouchableOpacity
                style={styles.imageContainer}
                onPress={pickImage}
              >
                {selectedImage ? (
                  <Image
                    source={{ uri: selectedImage }}
                    style={styles.selectedImage}
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Ionicons name="camera-outline" size={80} color="#ccc" />
                    <Text style={styles.imageText}>
                      Tap to upload food image
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Görsel seçildiyse Analyze butonu göster */}
              {selectedImage && (
                <TouchableOpacity
                  onPress={analyzeImage}
                  style={styles.analyzeButton}
                >
                  <Text style={styles.analyzeButtonText}>Analyze Image</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            // Yükleme veya analiz sonucu varsa seçilen görsel ve sonuçları göster
            <>
              <TouchableOpacity
                style={styles.imageContainer}
                onPress={loading ? undefined : reset}
              >
                <Image
                  source={{ uri: selectedImage || "" }}
                  style={styles.selectedImage}
                />
                {loading && (
                  <View style={styles.loadingOverlay}>
                    <Text style={styles.loadingText}>Analyzing...</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Analiz sonucu varsa göster */}
              {analysisResult && (
                <View style={styles.resultCard}>
                  <Text style={styles.resultTitle}>{analysisResult.title}</Text>
                  {analysisResult.items.map((item, index) => (
                    <View key={index} style={styles.resultItem}>
                      <Text style={styles.resultItemText}>
                        🍽 {item.name} — {item.weight}, {item.calories}
                      </Text>
                    </View>
                  ))}
                  <Text style={styles.totalCalories}>
                    🔥 Total Calories: {analysisResult.totalCalories}
                  </Text>

                  {/* Yeni analiz yapmak için reset butonu */}
                  <TouchableOpacity
                    style={styles.newAnalysisButton}
                    onPress={reset}
                  >
                    <Text style={styles.newAnalysisButtonText}>
                      New Analysis
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Profil Menüsü */}
      {profileMenuVisible && (
        <Pressable style={styles.menuBackdrop} onPress={toggleProfileMenu}>
          <Animated.View
            style={[
              styles.profileMenu,
              {
                opacity: menuAnimation,
                transform: [
                  {
                    translateY: menuAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.profileMenuHeader}>
              <Text style={styles.profileMenuName}>
                {user?.firstName || ""} {user?.lastName || ""}
              </Text>
              <Text style={styles.profileMenuUsername}>
                @{user?.username || "user"}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                // Önce menüyü kapat, sonra işlem yap
                toggleProfileMenu();
                // Kısa bir gecikme ekleyerek animasyonun tamamlanmasını bekleyin
                setTimeout(() => {
                  handleSignOut();
                }, 300); // Menü kapanma animasyonunun süresine bağlı olarak ayarlayın
              }}
            >
              <Ionicons name="log-out-outline" size={20} color="#ff3b30" />
              <Text style={styles.menuItemTextSignOut}>Sign Out</Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      )}

      {/* Sidebar */}
      <Sidebar
        visible={sidebarVisible}
        onClose={() => {
          // Sidebar'ı kapatmak için animasyonu başlat
          Animated.timing(sidebarAnimation, {
            toValue: -300,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            // Animasyon tamamlandıktan sonra sidebar'ı gizle
            setSidebarVisible(false);
          });
        }}
        animation={sidebarAnimation}
        analyses={analysisHistory}
      />
    </SafeAreaView>
  );
}

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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  hamburgerButton: {
    padding: 8,
  },
  profileButton: {
    padding: 8,
  },
  scrollViewContent: {
    flexGrow: 1, // Büyüyebilmesi için
    paddingBottom: 20, // Alt tarafta ekstra padding
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 20, // Üstte biraz boşluk ekleyin
    paddingBottom: 20, // Altta biraz boşluk ekleyin
  },
  imageContainer: {
    width: "80%", // Yüzde olarak ayarlayın
    height: 300, // Sabit yükseklik yerine daha esnek bir çözüm
    maxWidth: 300, // Maksimum genişlik
    aspectRatio: 1, // Kare olması için
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e1e4e8",
    position: "relative", // loading overlay için
  },
  selectedImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  imageText: {
    marginTop: 16,
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
  },
  menuBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  profileMenu: {
    position: "absolute",
    top: 60,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    width: 220,
    zIndex: 101,
  },
  profileMenuHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 12,
    marginBottom: 12,
  },
  profileMenuName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  profileMenuUsername: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  menuItemTextSignOut: {
    marginLeft: 12,
    fontSize: 16,
    color: "#ff3b30",
  },

  resultCard: {
    marginTop: 24,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    width: "90%", // Ekran genişliğine göre ayarlayın
    maxWidth: 400, // Maksimum genişlik belirleyin
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
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
  analyzeButton: {
    backgroundColor: "#4f46e5",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 20,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  analyzeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  newAnalysisButton: {
    backgroundColor: "#4f46e5",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },
  newAnalysisButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
