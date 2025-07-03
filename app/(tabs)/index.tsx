import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useLocationStore } from '@/stores/locationStore';
import { router } from 'expo-router';

const bestRated = [
  {
    icon: <MaterialCommunityIcons name="tools" size={24} color="#60A5FA" />,
    title: 'Bringaszerviz Kft.',
    rating: 4.8,
    type: 'Szerviz',
    typeColor: '#64748B',
  },
  {
    icon: <MaterialCommunityIcons name="bike" size={24} color="#4ADE80" />,
    title: 'Keleti Biciklitároló',
    rating: 4.5,
    type: 'Biciklitároló',
    typeColor: '#22C55E',
  },
];

const recentActivity = [
  {
    icon: <Ionicons name="time-outline" size={22} color="#94A3B8" />,
    title: 'Keleti Biciklitároló',
    subtitle: 'Foglalás - 2023.08.15',
    iconBg: '#F1F5F9',
    textColor: '#0F172A',
  },
  {
    icon: <Ionicons name="star" size={22} color="#FBBF24" />,
    title: 'Bringaszerviz Kft.',
    subtitle: 'Értékelés (5★) - 2023.07.21',
    iconBg: '#F1F5F9',
    textColor: '#0F172A',
  },
];

export default function HomeScreen() {
  const { userLocation, nearbyMarkers, loading } = useLocationStore();

  // Theme-aware colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackgroundColor = useThemeColor({ light: '#fff', dark: '#1F2937' }, 'background');
  const subtitleColor = useThemeColor({ light: '#6B7280', dark: '#9CA3AF' }, 'text');
  const secondaryTextColor = useThemeColor({ light: '#6B7280', dark: '#9CA3AF' }, 'text');
  const cardShadowColor = useThemeColor({ light: '#000', dark: '#000' }, 'text');
  const iconBackgroundLight = useThemeColor({ light: '#ECFDF5', dark: '#064E3B' }, 'background');

  // Get top 3 nearby markers
  const nearby = useMemo(() => {
    return nearbyMarkers.slice(0, 3);
  }, [nearbyMarkers]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle} type="title">ParkSafe</ThemedText>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Welcome Section */}
        <ThemedText style={styles.welcomeTitle} type="title">
          Üdvözöljük a ParkSafe-ben!
        </ThemedText>
        <ThemedText style={[styles.welcomeSubtitle, { color: subtitleColor }]}>
          Találja meg a legközelebbi biciklitárolókat és szervizeket
        </ThemedText>
        
        {/* Main Buttons - Card Style */}
        <View style={styles.mainButtonsRow}>
          <TouchableOpacity style={[styles.mainButtonCard, { backgroundColor: cardBackgroundColor, shadowColor: cardShadowColor, borderColor: '#4ADE80' }]}>
            <MaterialCommunityIcons name="bike" size={24} color="#4ADE80" />
            <ThemedText style={[styles.mainButtonCardLabel, { color: textColor }]}>Biciklitárolók</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.mainButtonCard, { backgroundColor: cardBackgroundColor, shadowColor: cardShadowColor, borderColor: '#60A5FA' }]}>
            <MaterialCommunityIcons name="tools" size={24} color="#60A5FA" />
            <ThemedText style={[styles.mainButtonCardLabel, { color: textColor }]}>Szervizek</ThemedText>
          </TouchableOpacity>
        </View>
        
        {/* Nearby Section */}
        <View style={styles.sectionHeaderRow}>
          <ThemedText style={styles.sectionTitle} type="subtitle">Közelben</ThemedText>
          <ThemedText
            style={[styles.sectionAll, { color: subtitleColor }]}
            onPress={() => {
              router.push({ pathname: '/(tabs)/map', params: { openList: Date.now().toString() } });
            }}
          >
            Összes
          </ThemedText>
        </View>
        
        <View>
          {loading ? (
            <ActivityIndicator size="small" color="#3B82F6" style={{ marginVertical: 16 }} />
          ) : nearby.length === 0 ? (
            <ThemedText style={{ textAlign: 'center', color: '#888', marginVertical: 16 }}>
              Nem találhatóak közeli helyek vagy nincs helyhozzáférés engedélyezve.
            </ThemedText>
          ) : (
            nearby.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.nearbyCard, { backgroundColor: cardBackgroundColor, shadowColor: cardShadowColor }]}
                onPress={() => {
                  router.push({ 
                    pathname: '/(tabs)/map', 
                    params: { 
                      selectedMarkerId: item.id,
                      latitude: item.coordinate.latitude.toString(),
                      longitude: item.coordinate.longitude.toString()
                    } 
                  });
                }}
                activeOpacity={0.7}
              > 
                <View style={[styles.nearbyIcon, { backgroundColor: item.type === 'parking' ? iconBackgroundLight : '#EFF6FF' }]}> 
                  {item.type === 'parking' ? (
                    <MaterialCommunityIcons name="bike" size={24} color="#4ADE80" />
                  ) : (
                    <MaterialCommunityIcons name="tools" size={24} color="#60A5FA" />
                  )}
                </View>
                <View style={styles.nearbyInfo}>
                  <ThemedText style={styles.nearbyTitle}>{item.title}</ThemedText>
                  <View style={styles.nearbyDetails}>
                    <Ionicons name="location-outline" size={14} color={secondaryTextColor} />
                    <ThemedText style={[styles.nearbyDetailText, { color: secondaryTextColor }]}>{(item.distance / 1000).toFixed(2)} km</ThemedText>
                    <ThemedText style={[styles.nearbyDetailDot, { color: secondaryTextColor }]}>•</ThemedText>
                    <Ionicons name="star" size={14} color="#FBBF24" />
                    <ThemedText style={[styles.nearbyDetailText, { color: secondaryTextColor }]}>
                      {item.type === 'parking' ? '4.5' : '4.8'}
                    </ThemedText>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Best Rated Section */}
        <View style={styles.sectionHeaderRow}>
          <ThemedText style={styles.sectionTitle} type="subtitle">Legjobban értékelt</ThemedText>
        </View>
        <View style={styles.bestRatedContainer}>
          {bestRated.map((item, index) => (
            <View key={index} style={[styles.bestRatedCard, { backgroundColor: cardBackgroundColor, shadowColor: cardShadowColor }]}>
              <View style={styles.bestRatedIcon}>{item.icon}</View>
              <View style={styles.bestRatedInfo}>
                <ThemedText style={[styles.bestRatedTitle, { color: textColor }]}>{item.title}</ThemedText>
                <View style={styles.bestRatedDetails}>
                  <Ionicons name="star" size={14} color="#FBBF24" />
                  <ThemedText style={[styles.bestRatedRating, { color: secondaryTextColor }]}>{item.rating}</ThemedText>
                  <ThemedText style={[styles.bestRatedType, { color: item.typeColor }]}>{item.type}</ThemedText>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Recent Activity Section */}
        <View style={styles.sectionHeaderRow}>
          <ThemedText style={styles.sectionTitle} type="subtitle">Legutóbbi tevékenységek</ThemedText>
        </View>
        <View style={styles.recentActivityContainer}>
          {recentActivity.map((item, index) => (
            <View key={index} style={[styles.recentActivityCard, { backgroundColor: cardBackgroundColor, shadowColor: cardShadowColor }]}>
              <View style={[styles.recentActivityIcon, { backgroundColor: item.iconBg }]}>{item.icon}</View>
              <View style={styles.recentActivityInfo}>
                <ThemedText style={[styles.recentActivityTitle, { color: item.textColor }]}>{item.title}</ThemedText>
                <ThemedText style={[styles.recentActivitySubtitle, { color: item.textColor }]}>{item.subtitle}</ThemedText>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  welcomeTitle: {
    marginTop: 8,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    marginBottom: 16,
  },
  mainButtonsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  mainButtonCard: {
    flex: 1,
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 0,
    flexDirection: 'row',
    gap: 12,
    borderWidth: 2,
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  mainButtonCardLabel: {
    fontWeight: '700',
    fontSize: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  sectionAll: {
    fontWeight: '500',
    fontSize: 15,
  },
  nearbyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  nearbyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  nearbyInfo: {
    flex: 1,
  },
  nearbyTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
  },
  nearbyDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bestRatedContainer: {
    marginBottom: 24,
  },
  bestRatedCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bestRatedInfo: {
    flex: 1,
  },
  bestRatedTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
  },
  bestRatedDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bestRatedRating: {
    fontSize: 14,
    marginHorizontal: 2,
  },
  bestRatedType: {
    fontSize: 14,
    fontWeight: '500',
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
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  recentActivityInfo: {
    flex: 1,
  },
  recentActivityTitle: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  recentActivitySubtitle: {
    fontSize: 14,
    marginTop: 1,
  },
});
