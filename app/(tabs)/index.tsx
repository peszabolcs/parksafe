import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";
import { getTotalLocationCounts } from "@/lib/markers";
import { useAuthStore } from "@/stores/authStore";
import { useLocationStore } from "@/stores/locationStore";
import { useProfileStore } from "@/stores/profileStore";
import { useThemeStore } from "@/stores/themeStore";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { markers, loading, error } = useLocationStore();
  const { session, user } = useAuthStore();
  const { profile } = useProfileStore();
  const { currentTheme } = useThemeStore();
  const [totalLocations, setTotalLocations] = useState(0);
  const [locationCountsLoading, setLocationCountsLoading] = useState(true);

  // Theme-aware colors
  const cardBackgroundColor = useThemeColor(
    { light: "#FFFFFF", dark: "#1E293B" },
    "background"
  );
  const subtitleColor = useThemeColor(
    { light: "#64748B", dark: "#94A3B8" },
    "text"
  );
  const isDarkMode = currentTheme === "dark";

  // Get top 3 nearby markers
  const nearby = useMemo(() => {
    return markers.slice(0, 3);
  }, [markers]);

  const isLoggedIn = session && user;

  // Fetch total location counts on component mount
  useEffect(() => {
    const fetchTotalCounts = async () => {
      setLocationCountsLoading(true);
      try {
        const counts = await getTotalLocationCounts();
        setTotalLocations(counts.total);
      } catch (error) {
        console.error("Error fetching total counts:", error);
      } finally {
        setLocationCountsLoading(false);
      }
    };

    fetchTotalCounts();
  }, []);

  return (
    <View style={styles.container}>
      {/* Modern Gradient Header */}
      <LinearGradient
        colors={isDarkMode ? ["#0F172A", "#1E293B"] : ["#22C55E", "#16A34A"]}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <View>
              <ThemedText style={styles.headerGreeting}>
                {isLoggedIn
                  ? `Helló, ${profile?.username || profile?.full_name || "Felhasználó"}!`
                  : "Üdvözöljük!"}
              </ThemedText>
              <ThemedText style={styles.headerTitle}>ParkSafe</ThemedText>
            </View>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.push("/notifications")}
            >
              <Ionicons name="notifications-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        {/* <View style={styles.heroSection}>
          <ThemedText style={styles.heroTitle}>
            Keressen biztonságos biciklitárolókat és megbízható szervizeket
          </ThemedText>
          <ThemedText style={[styles.heroSubtitle, { color: subtitleColor }]}>
            {locationCountsLoading ? (
              'Helyek betöltése...'
            ) : totalLocations > 0 ? (
              `Több mint ${totalLocations}+ ellenőrzött hely országszerte`
            ) : (
              'Ellenőrzött helyek országszerte'
            )}
          </ThemedText>
        </View> */}

        {/* Modern Action Cards */}
        <View style={styles.actionCardsContainer}>
          <TouchableOpacity
            style={[
              styles.primaryActionCard,
              { backgroundColor: cardBackgroundColor },
            ]}
            onPress={() => router.push({
              pathname: "/(tabs)/map",
              params: { filterType: "parking" }
            })}
          >
            <LinearGradient
              colors={["#22C55E", "#16A34A"]}
              style={styles.actionCardGradient}
            >
              <View style={styles.actionCardContent}>
                <MaterialCommunityIcons name="bike" size={32} color="white" />
                <View style={styles.actionCardText}>
                  <ThemedText style={styles.actionCardTitle}>
                    Biciklitárolók
                  </ThemedText>
                  <ThemedText style={styles.actionCardSubtitle}>
                    Keresse meg a legközelebbi biztonságos tárolókat
                  </ThemedText>
                </View>
                <Ionicons name="arrow-forward" size={24} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.primaryActionCard,
              { backgroundColor: cardBackgroundColor },
            ]}
            onPress={() => router.push({
              pathname: "/(tabs)/map",
              params: { filterType: "repairStation" }
            })}
          >
            <LinearGradient
              colors={["#3B82F6", "#2563EB"]}
              style={styles.actionCardGradient}
            >
              <View style={styles.actionCardContent}>
                <MaterialCommunityIcons name="tools" size={32} color="white" />
                <View style={styles.actionCardText}>
                  <ThemedText style={styles.actionCardTitle}>
                    Szervizek
                  </ThemedText>
                  <ThemedText style={styles.actionCardSubtitle}>
                    Találjon szakértő javítókat közelben
                  </ThemedText>
                </View>
                <Ionicons name="arrow-forward" size={24} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.primaryActionCard,
              { backgroundColor: cardBackgroundColor },
            ]}
            onPress={() => router.push({
              pathname: "/(tabs)/map",
              params: { filterType: "bicycleService" }
            })}
          >
            <LinearGradient
              colors={["#F97316", "#EA580C"]}
              style={styles.actionCardGradient}
            >
              <View style={styles.actionCardContent}>
                <MaterialCommunityIcons
                  name="storefront"
                  size={32}
                  color="white"
                />
                <View style={styles.actionCardText}>
                  <ThemedText style={styles.actionCardTitle}>
                    Bicikli boltok
                  </ThemedText>
                  <ThemedText style={styles.actionCardSubtitle}>
                    Vásároljon alkatrészeket és kiegészítőket
                  </ThemedText>
                </View>
                <Ionicons name="arrow-forward" size={24} color="white" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Modern Stats Section */}
        <View style={styles.statsContainer}>
          <View
            style={[styles.statCard, { backgroundColor: cardBackgroundColor }]}
          >
            <View style={[styles.statIcon, { backgroundColor: "#FEF3C7" }]}>
              <Ionicons name="location" size={20} color="#F59E0B" />
            </View>
            {locationCountsLoading ? (
              <ActivityIndicator
                size="small"
                color="#F59E0B"
                style={{ marginVertical: 4 }}
              />
            ) : (
              <ThemedText style={styles.statNumber}>
                {totalLocations}
              </ThemedText>
            )}
            <ThemedText style={[styles.statLabel, { color: subtitleColor }]}>
              Aktív helyek
            </ThemedText>
          </View>
          <View
            style={[styles.statCard, { backgroundColor: cardBackgroundColor }]}
          >
            <View style={[styles.statIcon, { backgroundColor: "#DCFCE7" }]}>
              <Ionicons name="star" size={20} color="#22C55E" />
            </View>
            <ThemedText style={styles.statNumber}>4.8</ThemedText>
            <ThemedText style={[styles.statLabel, { color: subtitleColor }]}>
              Átlag értékelés
            </ThemedText>
          </View>
          <View
            style={[styles.statCard, { backgroundColor: cardBackgroundColor }]}
          >
            <View style={[styles.statIcon, { backgroundColor: "#DBEAFE" }]}>
              <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
            </View>
            <ThemedText style={styles.statNumber}>100%</ThemedText>
            <ThemedText style={[styles.statLabel, { color: subtitleColor }]}>
              Biztonságos
            </ThemedText>
          </View>
        </View>

        {/* Nearby Section */}
        <View style={styles.modernSectionHeader}>
          <View>
            <ThemedText style={styles.sectionTitle}>
              Közelben lévő helyek
            </ThemedText>
            <ThemedText
              style={[styles.sectionSubtitle, { color: subtitleColor }]}
            >
              A legközelebbi biciklitárolók és szervizek
            </ThemedText>
          </View>
          <TouchableOpacity
            style={styles.sectionButton}
            onPress={() => {
              router.push({
                pathname: "/(tabs)/map",
                params: { openList: Date.now().toString() },
              });
            }}
          >
            <ThemedText style={styles.sectionButtonText}>Összes</ThemedText>
            <Ionicons name="arrow-forward" size={16} color="#22C55E" />
          </TouchableOpacity>
        </View>

        <View>
          {loading && nearby.length === 0 ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                marginVertical: 16,
              }}
            >
              <ActivityIndicator
                size="small"
                color="#3B82F6"
                style={{ marginRight: 8 }}
              />
              <ThemedText style={{ color: "#888" }}>
                Hely meghatározása...
              </ThemedText>
            </View>
          ) : error && nearby.length === 0 ? (
            <View style={{ alignItems: "center", marginVertical: 16 }}>
              <Ionicons
                name="location-outline"
                size={24}
                color="#EF4444"
                style={{ marginBottom: 8 }}
              />
              <ThemedText
                style={{
                  textAlign: "center",
                  color: "#EF4444",
                  marginBottom: 8,
                  fontSize: 14,
                }}
              >
                {error}
              </ThemedText>
              <TouchableOpacity
                onPress={() => {
                  useLocationStore.getState().refresh();
                }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: "#3B82F6",
                  borderRadius: 8,
                }}
              >
                <ThemedText style={{ color: "#fff", fontSize: 14 }}>
                  Újrapróbálás
                </ThemedText>
              </TouchableOpacity>
            </View>
          ) : nearby.length === 0 ? (
            <View style={{ alignItems: "center", marginVertical: 16 }}>
              <ThemedText
                style={{ textAlign: "center", color: "#888", marginBottom: 8 }}
              >
                {isLoggedIn
                  ? "Még nincsenek közeli helyek betöltve."
                  : "Jelentkezzen be a közeli helyek megtekintéséhez."}
              </ThemedText>
              <TouchableOpacity
                onPress={() => {
                  if (isLoggedIn) {
                    useLocationStore.getState().refresh();
                  } else {
                    router.push("/login");
                  }
                }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: "#3B82F6",
                  borderRadius: 8,
                }}
              >
                <ThemedText style={{ color: "#fff", fontSize: 14 }}>
                  {isLoggedIn ? "Frissítés" : "Bejelentkezés"}
                </ThemedText>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {loading && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 8,
                  }}
                >
                  <ActivityIndicator
                    size="small"
                    color="#3B82F6"
                    style={{ marginRight: 8 }}
                  />
                  <ThemedText style={{ color: "#888", fontSize: 12 }}>
                    Frissítés...
                  </ThemedText>
                </View>
              )}
              {nearby.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.modernNearbyCard,
                    { backgroundColor: cardBackgroundColor },
                  ]}
                  onPress={() => {
                    const timestamp = Date.now().toString();
                    router.push({
                      pathname: "/(tabs)/map",
                      params: {
                        selectedMarkerId: item.id,
                        latitude: item.coordinate.latitude.toString(),
                        longitude: item.coordinate.longitude.toString(),
                        timestamp,
                      },
                    });
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.modernNearbyContent}>
                    <View
                      style={[
                        styles.modernNearbyIcon,
                        {
                          backgroundColor:
                            item.type === "parking"
                              ? "#DCFCE7"
                              : item.type === "bicycleService"
                              ? "#FED7AA"
                              : "#DBEAFE",
                        },
                      ]}
                    >
                      {item.type === "parking" ? (
                        <MaterialCommunityIcons
                          name="bike"
                          size={28}
                          color="#059669"
                        />
                      ) : item.type === "bicycleService" ? (
                        <MaterialCommunityIcons
                          name="storefront"
                          size={28}
                          color="#F97316"
                        />
                      ) : (
                        <MaterialCommunityIcons
                          name="tools"
                          size={28}
                          color="#1D4ED8"
                        />
                      )}
                    </View>
                    <View style={styles.modernNearbyInfo}>
                      <ThemedText style={styles.modernNearbyTitle}>
                        {item.title}
                      </ThemedText>
                      <View style={styles.modernNearbyMeta}>
                        <View style={styles.modernNearbyDistance}>
                          <Ionicons
                            name="location"
                            size={16}
                            color={subtitleColor}
                          />
                          <ThemedText
                            style={[
                              styles.modernNearbyDetailText,
                              { color: subtitleColor },
                            ]}
                          >
                            {item.distance
                              ? (item.distance / 1000).toFixed(2)
                              : "---"}{" "}
                            km
                          </ThemedText>
                        </View>
                        <View style={styles.modernNearbyRating}>
                          <Ionicons name="star" size={16} color="#F59E0B" />
                          <ThemedText
                            style={[
                              styles.modernNearbyDetailText,
                              { color: subtitleColor },
                            ]}
                          >
                            {item.type === "parking" ? "4.5" : "4.8"}
                          </ThemedText>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.modernNearbyBadge,
                          {
                            backgroundColor:
                              item.type === "parking"
                                ? "#DCFCE7"
                                : item.type === "bicycleService"
                                ? "#FED7AA"
                                : "#DBEAFE",
                          },
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.modernNearbyBadgeText,
                            {
                              color:
                                item.type === "parking"
                                  ? "#059669"
                                  : item.type === "bicycleService"
                                  ? "#F97316"
                                  : "#1D4ED8",
                            },
                          ]}
                        >
                          {item.type === "parking"
                            ? "Biciklitároló"
                            : item.type === "bicycleService"
                            ? "Bicikli bolt"
                            : "Szerviz"}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={subtitleColor}
                  />
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerGreeting: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  headerButton: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
  },
  scrollView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  heroSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    lineHeight: 32,
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  actionCardsContainer: {
    gap: 16,
    marginTop: 24,
    marginBottom: 32,
  },
  primaryActionCard: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionCardGradient: {
    padding: 20,
    borderRadius: 20,
  },
  actionCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  actionCardText: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  actionCardSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },
  modernSectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderRadius: 12,
  },
  sectionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#22C55E",
  },
  modernNearbyCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  modernNearbyContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 16,
  },
  modernNearbyIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modernNearbyInfo: {
    flex: 1,
    gap: 8,
  },
  modernNearbyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    lineHeight: 22,
  },
  modernNearbyMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  modernNearbyDistance: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  modernNearbyRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  modernNearbyDetailText: {
    fontSize: 14,
    fontWeight: "500",
  },
  modernNearbyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  modernNearbyBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  nearbyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  nearbyInfo: {
    flex: 1,
  },
  nearbyTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 2,
  },
  nearbyDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  bestRatedContainer: {
    marginBottom: 24,
  },
  bestRatedCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  bestRatedIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  bestRatedInfo: {
    flex: 1,
  },
  bestRatedTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 2,
  },
  bestRatedDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  bestRatedRating: {
    fontSize: 14,
    marginHorizontal: 2,
  },
  bestRatedType: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
  nearbyDetailText: {
    fontSize: 13,
    marginHorizontal: 2,
  },
  nearbyDetailDot: {
    fontSize: 13,
    marginHorizontal: 2,
  },
  recentActivityContainer: {
    marginBottom: 24,
  },
  recentActivityCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  recentActivityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  recentActivityInfo: {
    flex: 1,
  },
  recentActivityTitle: {
    fontWeight: "bold",
    fontSize: 15,
  },
});
