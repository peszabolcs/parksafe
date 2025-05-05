import { Image } from 'expo-image';
import { Platform, StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import {Colors} from '@/constants/Colors';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

// Sample data for bicycle storage locations
const bikeStorageLocations = [
  { id: '1', name: 'Keleti Biciklitároló', distance: '0.3', rating: '4.5', capacity: '32/40', secured: true },
  { id: '2', name: 'Nyugati Biciklitároló', distance: '0.7', rating: '4.2', capacity: '15/25', secured: true },
  { id: '3', name: 'Déli Biciklitároló', distance: '0.9', rating: '4.0', capacity: '8/15', secured: false },
  { id: '4', name: 'Északi Biciklitároló', distance: '1.2', rating: '4.3', capacity: '22/30', secured: true },
];

// Sample data for service centers
const serviceLocations = [
  { id: '1', name: 'Bringaszerviz Kft.', distance: '0.5', rating: '4.8', openNow: true, services: ['Javítás', 'Alkatrészek', 'Kiegészítők'] },
  { id: '2', name: 'BringaDoktor', distance: '1.1', rating: '4.7', openNow: true, services: ['Javítás', 'Karbantartás'] },
  { id: '3', name: 'KerékSzerelde', distance: '1.5', rating: '4.4', openNow: false, services: ['Javítás', 'Alkatrészek'] },
  { id: '4', name: 'BikeTime', distance: '2.0', rating: '4.6', openNow: true, services: ['Karbantartás', 'Kiegészítők', 'Kerékpárkölcsönzés'] },
];

// Recent activity data
const recentActivities = [
  { id: '1', type: 'location', name: 'Keleti Biciklitároló', activity: 'Foglalás', date: '2023.08.15' },
  { id: '2', type: 'service', name: 'Bringaszerviz Kft.', activity: 'Értékelés (5★)', date: '2023.07.21' },
  { id: '3', type: 'location', name: 'Nyugati Biciklitároló', activity: 'Foglalás', date: '2023.07.10' },
];

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Get top rated locations
  const topRatedLocations = [...bikeStorageLocations, ...serviceLocations]
    .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
    .slice(0, 3);
  
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Section */}
      <ThemedView style={styles.headerContainer}>
        <ThemedText type="title">Üdvözöljük a ParkSafe-ben!</ThemedText>
        <ThemedText style={styles.subheader}>
          Találja meg a legközelebbi biciklitárolókat és szervizeket
        </ThemedText>
      </ThemedView>

      {/* Option Buttons */}
      <View style={styles.optionsContainer}>
        <TouchableOpacity style={[
          styles.optionButton,
          { backgroundColor: '#4CAF50' }
        ]}>
          <Ionicons name="bicycle" size={24} color="white" />
          <ThemedText style={styles.optionText}>Biciklitárolók</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={[
          styles.optionButton,
          { backgroundColor: '#2196F3' }
        ]}>
          <Ionicons name="construct" size={24} color="white" />
          <ThemedText style={styles.optionText}>Szervizek</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Nearby Section */}
      <ThemedView style={styles.sectionContainer}>
        <View style={styles.sectionHeaderContainer}>
          <ThemedText type="subtitle">Közelben</ThemedText>
          <TouchableOpacity>
            <ThemedText style={[styles.seeAllText, { color: colors.text }]}>Összes</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Nearby List Items - Bike Storage */}
        {bikeStorageLocations.slice(0, 2).map(location => (
          <ThemedView key={location.id} style={[styles.listItemContainer ]}>
            <View style={[styles.iconContainer, styles.bikeIconContainer]}>
              <Ionicons name="bicycle" size={20} color="white" />
            </View>
            <View style={styles.itemDetails}>
              <ThemedText type="defaultSemiBold">{location.name}</ThemedText>
              <View style={styles.locationDetails}>
                <Ionicons name="location-outline" size={16} color={colors.tabIconDefault} />
                <ThemedText style={styles.distanceText}>{location.distance} km</ThemedText>
                <Ionicons name="star" size={16} color="#FFC107" />
                <ThemedText style={styles.ratingText}>{location.rating}</ThemedText>
                {location.secured && (
                  <View style={styles.secureTagContainer}>
                    <Ionicons name="shield-checkmark" size={12} color="white" />
                  </View>
                )}
              </View>
              <View style={styles.capacityContainer}>
                <Ionicons name="information-circle-outline" size={16} color={colors.tabIconDefault} />
                <ThemedText style={styles.capacityText}>Kapacitás: {location.capacity}</ThemedText>
              </View>
            </View>
          </ThemedView>
        ))}

        {/* Nearby List Items - Services */}
        <ThemedView style={[styles.listItemContainer]}>
          <View style={[styles.iconContainer, styles.serviceIconContainer]}>
            <Ionicons name="construct" size={20} color="white" />
          </View>
          <View style={styles.itemDetails}>
            <ThemedText type="defaultSemiBold">{serviceLocations[0].name}</ThemedText>
            <View style={styles.locationDetails}>
              <Ionicons name="location-outline" size={16} color={colors.tabIconDefault} />
              <ThemedText style={styles.distanceText}>{serviceLocations[0].distance} km</ThemedText>
              <Ionicons name="star" size={16} color="#FFC107" />
              <ThemedText style={styles.ratingText}>{serviceLocations[0].rating}</ThemedText>
              {serviceLocations[0].openNow && (
                <View style={styles.openNowContainer}>
                  <ThemedText style={styles.openNowText}>• Nyitva</ThemedText>
                </View>
              )}
            </View>
            <View style={styles.servicesContainer}>
              <ThemedText style={styles.serviceText}>{serviceLocations[0].services.join(' • ')}</ThemedText>
            </View>
          </View>
        </ThemedView>
      </ThemedView>

      {/* Best Rated Section */}
      <ThemedView style={styles.sectionContainer}>
        <View style={styles.sectionHeaderContainer}>
          <ThemedText type="subtitle">Legjobb értékelésű</ThemedText>
          <TouchableOpacity>
            <ThemedText style={[styles.seeAllText, { color: colors.text }]}>Összes</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Best Rated Items */}
        {topRatedLocations.slice(0, 2).map(location => (
          <ThemedView key={location.id} style={[styles.listItemContainer]}>
            <View style={[
              styles.iconContainer, 
              'services' in location ? styles.serviceIconContainer : styles.bikeIconContainer
            ]}>
              <Ionicons 
                name={'services' in location ? "construct" : "bicycle"} 
                size={20} 
                color="white" 
              />
            </View>
            <View style={styles.itemDetails}>
              <ThemedText type="defaultSemiBold">{location.name}</ThemedText>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#FFC107" />
                <ThemedText style={styles.ratingText}>{location.rating}</ThemedText>
                <ThemedText style={[styles.categoryText, { color: colors.text }]}>
                  • {'services' in location ? "Szerviz" : "Biciklitároló"}
                </ThemedText>
              </View>
            </View>
          </ThemedView>
        ))}
      </ThemedView>

      {/* Recent Activity Section */}
      <ThemedView style={styles.sectionContainer}>
        <View style={styles.sectionHeaderContainer}>
          <ThemedText type="subtitle">Legutóbbi aktivitás</ThemedText>
          <TouchableOpacity>
            <ThemedText style={[styles.seeAllText, { color: colors.text }]}>Összes</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Recent Activity Items */}
        {recentActivities.map(activity => (
          <ThemedView key={activity.id} style={[styles.listItemContainer]}>
            <View style={[
              styles.iconContainer,  
              activity.type === 'location' ? styles.bikeIconContainer : styles.serviceIconContainer
            ]}>
              {activity.type === 'location' ? (
                activity.activity === 'Foglalás' ? (
                  <Ionicons name="calendar" size={20} color="white" />
                ) : (
                  <Ionicons name="locate" size={20} color="white" />
                )
              ) : (
                <Ionicons name="star" size={20} color="white" />
              )}
            </View>
            <View style={styles.itemDetails}>
              <ThemedText type="defaultSemiBold">{activity.name}</ThemedText>
              <View style={styles.activityDetails}>
                <ThemedText style={[styles.activityText, { color: colors.text }]}>{activity.activity}</ThemedText>
                <ThemedText style={styles.dateText}> - {activity.date}</ThemedText>
              </View>
            </View>
          </ThemedView>
        ))}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  subheader: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginVertical: 16,
    gap: 10,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  optionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionContainer: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  seeAllText: {
    opacity: 0.7,
  },
  listItemContainer: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8, // Rectangle with rounded corners
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bikeIconContainer: {
    backgroundColor: '#4CAF50', // Green for bike-related
  },
  serviceIconContainer: {
    backgroundColor: '#2196F3', // Blue for service-related
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  locationDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  distanceText: {
    marginLeft: 4,
    marginRight: 12,
    color: '#666',
  },
  ratingText: {
    marginLeft: 4,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  categoryText: {
    marginLeft: 8,
  },
  secureTagContainer: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
    alignItems: 'center',
  },
  secureTagText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 2,
    fontWeight: '500',
  },
  capacityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  capacityText: {
    marginLeft: 4,
    fontSize: 13,
    color: '#666',
  },
  servicesContainer: {
    marginTop: 4,
  },
  serviceText: {
    fontSize: 13,
    color: '#666',
  },
  openNowContainer: {
    marginLeft: 8,
  },
  openNowText: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  activityDetails: {
    flexDirection: 'row',
    marginTop: 4,
  },
  activityText: {
    fontWeight: '500',
  },
  dateText: {
    color: '#666',
  }
});