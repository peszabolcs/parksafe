import React, { useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  RefreshControl,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useFavouritesStore } from '@/stores/favouritesStore';
import { useAuthStore } from '@/stores/authStore';
import { MapMarker, getDistance } from '@/lib/markers';
import { useLocationStore } from '@/stores/locationStore';
import { router } from 'expo-router';
import { Fonts } from '@/constants/Fonts';

const { width: screenWidth } = Dimensions.get('window');

export default function FavouritesScreen() {
  const { 
    favourites, 
    loading, 
    error, 
    loadFavourites, 
    removeFavourite 
  } = useFavouritesStore();
  const { user } = useAuthStore();
  const { userLocation } = useLocationStore();

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = useThemeColor({ light: '#fff', dark: '#1F2937' }, 'background');
  const borderColor = useThemeColor({ light: '#E5E7EB', dark: '#374151' }, 'background');
  const shadowColor = useThemeColor({ light: '#000', dark: '#000' }, 'text');
  const secondaryTextColor = useThemeColor({ light: '#6B7280', dark: '#9CA3AF' }, 'text');
  const errorColor = useThemeColor({ light: '#EF4444', dark: '#F87171' }, 'text');
  const emptyStateColor = useThemeColor({ light: '#9CA3AF', dark: '#6B7280' }, 'text');

  useEffect(() => {
    if (user) {
      loadFavourites();
    }
  }, [user]); // Remove loadFavourites from dependency array to prevent infinite loops

  const handleRefresh = useCallback(async () => {
    if (user) {
      await loadFavourites();
    }
  }, [user]); // Remove loadFavourites from dependency array

  const handleRemoveFavourite = useCallback(async (marker: MapMarker) => {
    Alert.alert(
      'Eltávolítás a kedvencekből',
      `Biztosan el szeretné távolítani a "${marker.title}" helyet a kedvencekből?`,
      [
        {
          text: 'Mégse',
          style: 'cancel',
        },
        {
          text: 'Eltávolítás',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeFavourite(marker.id);
            } catch (error) {
              Alert.alert('Hiba', 'Nem sikerült eltávolítani a kedvencet.');
            }
          },
        },
      ]
    );
  }, [removeFavourite]);

  const handleMarkerPress = useCallback((marker: MapMarker) => {
    // Add timestamp to force navigation even when selecting the same marker
    const timestamp = Date.now();
    router.push(`/(tabs)/map?selectedMarkerId=${marker.id}&timestamp=${timestamp}`);
  }, []);

  const calculateMarkerDistance = useCallback((marker: MapMarker): string => {
    if (!userLocation) return '';
    
    const distance = getDistance(
      userLocation.latitude,
      userLocation.longitude,
      marker.coordinate.latitude,
      marker.coordinate.longitude
    );
    
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  }, [userLocation]);

  const renderFavouriteItem = useCallback(({ item }: { item: MapMarker }) => {
    const isParking = item.type === 'parking';
    const iconName = isParking ? 'bicycle' : 'build';
    const iconColor = isParking ? '#22C55E' : '#3B82F6';
    const iconBackgroundColor = isParking ? '#DCFCE7' : '#DBEAFE';
    const distance = calculateMarkerDistance(item);

    return (
      <TouchableOpacity 
        style={[
          styles.favouriteCard,
          {
            backgroundColor: cardBackground,
            borderColor: borderColor,
            shadowColor: shadowColor,
          }
        ]}
        onPress={() => handleMarkerPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          <View style={styles.leftSection}>
            <View style={[
              styles.iconContainer,
              { backgroundColor: iconBackgroundColor }
            ]}>
              <Ionicons name={iconName as any} size={20} color={iconColor} />
            </View>
            <View style={styles.textContainer}>
              <ThemedText style={[styles.title, { color: textColor }]} numberOfLines={1}>
                {item.title}
              </ThemedText>
              <ThemedText style={[styles.description, { color: secondaryTextColor }]} numberOfLines={2}>
                {item.description}
              </ThemedText>
              <View style={styles.metaRow}>
                <View style={styles.typeTag}>
                  <ThemedText style={[styles.typeText, { color: iconColor }]}>
                    {isParking ? 'Parkoló' : 'Szerviz'}
                  </ThemedText>
                </View>
                {distance && (
                  <ThemedText style={[styles.distance, { color: secondaryTextColor }]}>
                    {distance}
                  </ThemedText>
                )}
              </View>
            </View>
          </View>
          <View style={styles.rightSection}>
            <View style={[styles.statusIndicator, { 
              backgroundColor: item.available ? '#22C55E' : '#EF4444' 
            }]} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveFavourite(item)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="heart" size={24} color="#FFD700" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [
    cardBackground,
    borderColor,
    shadowColor,
    textColor,
    secondaryTextColor,
    calculateMarkerDistance,
    handleMarkerPress,
    handleRemoveFavourite
  ]);

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconContainer, { backgroundColor: borderColor }]}>
        <Ionicons name="heart-outline" size={48} color={emptyStateColor} />
      </View>
      <ThemedText style={[styles.emptyTitle, { color: textColor }]}>
        Még nincsenek kedvencei
      </ThemedText>
      <ThemedText style={[styles.emptyDescription, { color: secondaryTextColor }]}>
        Adjon hozzá kedvencekhez helyeket a térkép nézetben a csillag gombra kattintva.
      </ThemedText>
      <TouchableOpacity
        style={[styles.exploreButton, { borderColor: borderColor }]}
        onPress={() => router.push('/(tabs)/map')}
      >
        <Ionicons name="map-outline" size={20} color={textColor} style={{ marginRight: 8 }} />
        <ThemedText style={[styles.exploreButtonText, { color: textColor }]}>
          Térkép megtekintése
        </ThemedText>
      </TouchableOpacity>
    </View>
  ), [borderColor, emptyStateColor, textColor, secondaryTextColor]);

  const renderError = useCallback(() => (
    <View style={styles.errorState}>
      <Ionicons name="warning-outline" size={48} color={errorColor} />
      <ThemedText style={[styles.errorText, { color: errorColor }]}>
        {error || 'Hiba történt a kedvencek betöltésekor'}
      </ThemedText>
      <TouchableOpacity
        style={[styles.retryButton, { borderColor: errorColor }]}
        onPress={handleRefresh}
      >
        <ThemedText style={[styles.retryButtonText, { color: errorColor }]}>
          Újrapróbálás
        </ThemedText>
      </TouchableOpacity>
    </View>
  ), [error, errorColor, handleRefresh]);

  if (!user) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <View style={styles.authRequired}>
          <Ionicons name="person-outline" size={48} color={emptyStateColor} />
          <ThemedText style={[styles.authTitle, { color: textColor }]}>
            Bejelentkezés szükséges
          </ThemedText>
          <ThemedText style={[styles.authDescription, { color: secondaryTextColor }]}>
            A kedvencek megtekintéséhez jelentkezzen be a fiókjába.
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>
        <View style={styles.headerContent}>
          <ThemedText style={[styles.headerTitle, { color: textColor }]}>
            Kedvencek
          </ThemedText>
        </View>
      </View>

      {/* Content */}
      {loading && favourites.length === 0 ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <ThemedText style={[styles.loadingText, { color: secondaryTextColor }]}>
            Kedvencek betöltése...
          </ThemedText>
        </View>
      ) : error ? (
        renderError()
      ) : favourites.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={favourites}
          renderItem={renderFavouriteItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={handleRefresh}
              colors={['#3B82F6']}
              tintColor="#3B82F6"
            />
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  favouriteCard: {
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  distance: {
    fontSize: 12,
    fontWeight: '500',
  },
  rightSection: {
    alignItems: 'center',
    marginLeft: 12,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  removeButton: {
    padding: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  exploreButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  authRequired: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  authDescription: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});
