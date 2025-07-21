import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";
import {
  ClusteredFeature,
  getClusterInfo,
  getMarkerFromPoint,
  isCluster,
  useExpoClustering,
  markersToPoints,
} from "@/lib/expoClustering";
import Supercluster from 'supercluster';
import { MapMarker, getDistance } from "@/lib/markers";
import { clearMarkerCache } from "@/lib/markerUtils";
import { useFavouritesStore } from "@/stores/favouritesStore";
import { useLocationStore } from "@/stores/locationStore";
import { useThemeStore } from "@/stores/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT, Region } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const INITIAL_REGION = {
  latitude: 46.253,
  longitude: 20.1484,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "administrative.country",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#bdbdbd" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#181818" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ color: "#2c2c2c" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8a8a8a" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#373737" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#3c3c3c" }],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    featureType: "transit",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#000000" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3d3d3d" }],
  },
];

const LIGHT_MAP_STYLE: any[] = [];

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(INITIAL_REGION);
  const [currentMapCenter, setCurrentMapCenter] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [showListModal, setShowListModal] = useState(false);
  const [listFilter, setListFilter] = useState<
    "all" | "parking" | "repair" | "bicycleService"
  >("all");
  const [screenDimensions, setScreenDimensions] = useState(
    Dimensions.get("window")
  );
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [markerFilters, setMarkerFilters] = useState({
    parking: true,
    repairStation: true,
    bicycleService: true,
  });
  const [mapType, setMapType] = useState<"standard" | "hybrid">("standard");

  const modalAnim = useRef(new Animated.Value(screenDimensions.height)).current; // Dynamic animation value
  const insets = useSafeAreaInsets();

  const {
    userLocation,
    markers,
    loading,
    searchAtLocation,
    clearSearchResults,
    refresh,
  } = useLocationStore();

  const { currentTheme } = useThemeStore();
  const { addFavourite, removeFavourite, isFavourite, loadFavourites } =
    useFavouritesStore();

  const backgroundColor = useThemeColor({}, "background");
  const textColor = useThemeColor({}, "text");
  const cardBackground = useThemeColor(
    { light: "#fff", dark: "#1F2937" },
    "background"
  );
  const borderColor = useThemeColor(
    { light: "#E5E7EB", dark: "#374151" },
    "background"
  );
  const shadowColor = useThemeColor({ light: "#000", dark: "#000" }, "text");

  const isDarkMode = currentTheme === "dark";
  const params = useLocalSearchParams();

  // Calculate bottom position for FABs taking into account iOS tab bar
  const bottomPosition = useMemo(() => {
    if (Platform.OS === "ios") {
      // iOS tab bar is typically 83px with safe area, 49px without
      // Add extra padding to ensure buttons are visible above tab bar
      return insets.bottom + 95; // 95px above the bottom safe area
    }
    return 38; // Android default
  }, [insets.bottom]);

  // Handle screen dimension changes for rotation support
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setScreenDimensions(window);
      modalAnim.setValue(window.height);
    });

    return () => subscription?.remove();
  }, [modalAnim]);

  // Enhanced iOS memory management and crash prevention
  useEffect(() => {
    if (Platform.OS === "ios") {
      // More aggressive cleanup for iOS stability
      if (markers.length > 30 || markers.length === 0) {
        clearMarkerCache();
      }
      
      // Force garbage collection and memory cleanup on iOS
      const cleanup = () => {
        if (global.gc) {
          global.gc();
        }
        // Remove automatic map animation - this was causing the jumping back issue
      };
      
      // Longer debounce for iOS stability
      const timer = setTimeout(cleanup, 1500);
      return () => clearTimeout(timer);
    }
  }, [markers.length]);

  // iOS cleanup on unmount
  useEffect(() => {
    return () => {
      if (Platform.OS === "ios") {
        clearMarkerCache();
        if (global.gc) {
          global.gc();
        }
      }
    };
  }, []);

  // Animation functions for modal with dynamic dimensions
  const openModal = useCallback(() => {
    setShowListModal(true);
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [modalAnim]);

  const closeModal = useCallback(() => {
    Animated.timing(modalAnim, {
      toValue: screenDimensions.height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowListModal(false);
      modalAnim.setValue(screenDimensions.height);
    });
  }, [modalAnim, screenDimensions.height]);

  // Interpolate values from single animation
  const backgroundOpacity = modalAnim.interpolate({
    inputRange: [0, screenDimensions.height],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  // Always show search button when user location is available
  const showSearchButton = useMemo(() => {
    return userLocation !== null && currentMapCenter !== null;
  }, [userLocation, currentMapCenter]);

  // Automatically clear search results when user returns to their location
  useEffect(() => {
    if (!userLocation || !currentMapCenter) return;

    const distance = getDistance(
      userLocation.latitude,
      userLocation.longitude,
      currentMapCenter.latitude,
      currentMapCenter.longitude
    );

    // If user is back within 2km of their location, clear search results
    if (distance <= 2000) {
      const { searchMarkers } = useLocationStore.getState();
      if (searchMarkers && searchMarkers.length > 0) {
        clearSearchResults();
      }
    }
  }, [userLocation, currentMapCenter, clearSearchResults]);

  // Filter markers based on user selection
  const filteredMarkers = useMemo(() => {
    return markers.filter((marker) => {
      return markerFilters[marker.type];
    });
  }, [markers, markerFilters]);

  // State to control when to render markers (only on search)
  const [shouldRenderMarkers, setShouldRenderMarkers] = useState(false);
  const [frozenClusters, setFrozenClusters] = useState<any[]>([]);
  
  const clusteredMarkers = useMemo(() => {
    // Only return frozen clusters when we should render them
    if (!shouldRenderMarkers) {
      console.log("Markers hidden - waiting for search");
      return [];
    }
    
    console.log("Using frozen clusters:", frozenClusters.length, "clusters");
    return frozenClusters;
  }, [frozenClusters, shouldRenderMarkers]);

  const listFilteredMarkers = useMemo(() => {
    if (listFilter === "all") return markers;
    if (listFilter === "repair")
      return markers.filter((m) => m.type === "repairStation");
    if (listFilter === "bicycleService")
      return markers.filter((m) => m.type === "bicycleService");
    return markers.filter((m) => m.type === listFilter);
  }, [markers, listFilter]);

  // Track if this is the first time we get user location
  const [hasInitializedLocation, setHasInitializedLocation] = useState(false);

  useEffect(() => {
    if (userLocation && mapRef.current && !hasInitializedLocation) {
      const newRegion = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      setCurrentMapCenter({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      });
      
      // Only move to user location on initial load
      mapRef.current.animateToRegion(newRegion, 1000);
      setHasInitializedLocation(true);
      
      console.log("Initial location set - use search button to load markers");
      
      // Auto-load markers on first initialization if there are home markers available
      setTimeout(() => {
        if (markers.length > 0) {
          console.log("Auto-loading initial home markers:", markers.length);
          const initialFiltered = markers.filter((marker) => {
            return markerFilters[marker.type];
          });
          
          const clusteringResult = useExpoClustering(initialFiltered, newRegion);
          setFrozenClusters(clusteringResult.clusters);
          setShouldRenderMarkers(true);
        }
      }, 1000);
    }
  }, [userLocation, hasInitializedLocation, markers, markerFilters]);

  useEffect(() => {
    if (params.selectedMarkerId && markers.length > 0) {
      const selectedMarker = markers.find(
        (m) => m.id === params.selectedMarkerId
      );
      if (selectedMarker) {
        setSelectedMarker(selectedMarker);

        const newRegion = {
          latitude: selectedMarker.coordinate.latitude,
          longitude: selectedMarker.coordinate.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 500);
      }
    }
  }, [params.selectedMarkerId, params.timestamp, markers]);

  useEffect(() => {
    if (params.openList) {
      setListFilter("all");
      openModal();
    }
  }, [params.openList, openModal]);

  // Handle filter type parameter from home screen buttons
  useEffect(() => {
    if (params.filterType) {
      // Reset all filters to false
      const newFilters = {
        parking: false,
        repairStation: false,
        bicycleService: false,
      };

      // Enable only the selected filter type
      if (params.filterType === "parking") {
        newFilters.parking = true;
      } else if (params.filterType === "repairStation") {
        newFilters.repairStation = true;
      } else if (params.filterType === "bicycleService") {
        newFilters.bicycleService = true;
      }

      setMarkerFilters(newFilters);
    }
  }, [params.filterType]);

  const handleRegionChangeComplete = useCallback((newRegion: Region) => {
    setRegion(newRegion);
    setCurrentMapCenter({
      latitude: newRegion.latitude,
      longitude: newRegion.longitude,
    });
  }, []);

  const handleMapReady = useCallback(() => {
    // Force region update when map is ready to ensure clustering works initially
    if (mapRef.current) {
      mapRef.current
        .getMapBoundaries()
        .then((boundaries) => {
          if (boundaries) {
            const { northEast, southWest } = boundaries;
            const latitudeDelta = northEast.latitude - southWest.latitude;
            const longitudeDelta = northEast.longitude - southWest.longitude;
            const centerLatitude =
              (northEast.latitude + southWest.latitude) / 2;
            const centerLongitude =
              (northEast.longitude + southWest.longitude) / 2;

            const newRegion = {
              latitude: centerLatitude,
              longitude: centerLongitude,
              latitudeDelta,
              longitudeDelta,
            };

            setRegion(newRegion);
            setCurrentMapCenter({
              latitude: centerLatitude,
              longitude: centerLongitude,
            });
          }
        })
        .catch(() => {
          // Fallback: if getMapBoundaries fails, just trigger a minimal region update
          // to force clustering recalculation
          setRegion((prevRegion) => ({ ...prevRegion }));
        });
    }
  }, []);

  const handleSearchAtCurrentLocation = useCallback(async () => {
    if (!currentMapCenter) return;

    try {
      console.log("Search button clicked - loading markers at:", currentMapCenter);
      
      // Load markers for current map center
      await searchAtLocation(
        currentMapCenter.latitude,
        currentMapCenter.longitude
      );
      
      // Get fresh markers after search
      const { markers: freshMarkers } = useLocationStore.getState();
      console.log("Fresh markers from store:", freshMarkers.length);
      
      const freshFiltered = freshMarkers.filter((marker) => {
        return markerFilters[marker.type];
      });
      console.log("Filtered markers:", freshFiltered.length);
      
      // Perform clustering once and freeze the result
      const searchRegion = {
        latitude: currentMapCenter.latitude,
        longitude: currentMapCenter.longitude,
        latitudeDelta: region.latitudeDelta,
        longitudeDelta: region.longitudeDelta,
      };
      
      console.log("Clustering with region:", searchRegion);
      
      // Manual clustering implementation
      const points = markersToPoints(freshFiltered);
      console.log("Created points:", points.length);
      
      const supercluster = new Supercluster({
        radius: 50,
        maxZoom: 15,
        minZoom: 0,
        minPoints: 4,
        extent: 256,
        nodeSize: 32,
      });
      
      supercluster.load(points);
      console.log("SuperCluster loaded");
      
      const zoom = Math.log2(360 / searchRegion.latitudeDelta);
      const clampedZoom = Math.max(0, Math.min(20, zoom));
      
      const bounds = [
        searchRegion.longitude - searchRegion.longitudeDelta / 2,
        searchRegion.latitude - searchRegion.latitudeDelta / 2,
        searchRegion.longitude + searchRegion.longitudeDelta / 2,
        searchRegion.latitude + searchRegion.latitudeDelta / 2,
      ] as [number, number, number, number];
      
      const clusteredFeatures = supercluster.getClusters(bounds, clampedZoom);
      const finalClusters = clusteredFeatures.length > 0 ? clusteredFeatures : points;
      
      console.log("Final clustering result:", finalClusters.length, "clusters from", freshFiltered.length, "markers");
      
      // Freeze the clusters - they won't change until next search
      setFrozenClusters(finalClusters);
      
      // Enable marker rendering
      setShouldRenderMarkers(true);
      
      console.log("Search completed successfully - frozen clusters will now be visible");
    } catch (error) {
      console.error("Search error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      Alert.alert(
        "Hiba",
        "Nem sikerült betölteni a helyeket ezen a területen. Error: " + errorMessage
      );
    }
  }, [currentMapCenter, searchAtLocation, region, markerFilters]);

  const recenter = useCallback(async () => {
    console.log("Recenter button pressed - current userLocation:", userLocation);

    // First refresh location to get current simulator position
    await refresh();
    
    // Get the fresh location from store
    const { userLocation: freshLocation } = useLocationStore.getState();
    
    if (!freshLocation) {
      Alert.alert("Helymeghatározás", "A helymeghatározás nincs elérhető.");
      return;
    }

    console.log("Fresh location after refresh:", freshLocation);

    // Clear any search results when returning to user location
    const { searchMarkers } = useLocationStore.getState();
    if (searchMarkers && searchMarkers.length > 0) {
      clearSearchResults();
    }

    const newRegion = {
      latitude: freshLocation.latitude,
      longitude: freshLocation.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };

    console.log("Animating to fresh region:", newRegion);

    // Update region state and current map center
    setRegion(newRegion);
    setCurrentMapCenter({
      latitude: freshLocation.latitude,
      longitude: freshLocation.longitude,
    });

    mapRef.current?.animateToRegion(newRegion, 500);
  }, [refresh, clearSearchResults]);

  const handleMarkerPress = useCallback((marker: MapMarker) => {
    setSelectedMarker(marker);

    const newRegion = {
      latitude: marker.coordinate.latitude,
      longitude: marker.coordinate.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };

    mapRef.current?.animateToRegion(newRegion, 500);
  }, []);

  const handleClusterPress = useCallback(
    (cluster: ClusteredFeature) => {
      // Agresszívebb zoom hogy biztosan szétváljon
      const zoomFactor = 0.3; // Még agresszívebb zoom
      const clusterInfo = getClusterInfo(cluster);
      const newRegion = {
        latitude: clusterInfo.coordinate.latitude,
        longitude: clusterInfo.coordinate.longitude,
        latitudeDelta: Math.max(region.latitudeDelta * zoomFactor, 0.0005), // Kisebb minimum
        longitudeDelta: Math.max(region.longitudeDelta * zoomFactor, 0.0005),
      };

      // Re-cluster at the new zoom level using manual clustering (no hooks in callbacks!)
      const { markers: currentMarkers } = useLocationStore.getState();
      const currentFiltered = currentMarkers.filter((marker) => {
        return markerFilters[marker.type];
      });
      
      // Manual clustering implementation (same as in search)
      const points = markersToPoints(currentFiltered);
      
      const supercluster = new Supercluster({
        radius: 50,
        maxZoom: 15,
        minZoom: 0,
        minPoints: 4,
        extent: 256,
        nodeSize: 32,
      });
      
      supercluster.load(points);
      
      const zoom = Math.log2(360 / newRegion.latitudeDelta);
      const clampedZoom = Math.max(0, Math.min(20, zoom));
      
      const bounds = [
        newRegion.longitude - newRegion.longitudeDelta / 2,
        newRegion.latitude - newRegion.latitudeDelta / 2,
        newRegion.longitude + newRegion.longitudeDelta / 2,
        newRegion.latitude + newRegion.latitudeDelta / 2,
      ] as [number, number, number, number];
      
      const clusteredFeatures = supercluster.getClusters(bounds, clampedZoom);
      const finalClusters = clusteredFeatures.length > 0 ? clusteredFeatures : points;
      
      console.log("Re-clustering for zoom:", finalClusters.length, "clusters");
      
      // Update frozen clusters with new zoom level clusters
      setFrozenClusters(finalClusters);
      
      mapRef.current?.animateToRegion(newRegion, 600);
    },
    [region, markerFilters]
  );

  const closeFlyout = useCallback(() => {
    setSelectedMarker(null);
  }, []);

  const handleDirections = useCallback(() => {
    if (selectedMarker) {
      const { latitude, longitude } = selectedMarker.coordinate;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

      Linking.openURL(url).catch(() => {
        Alert.alert("Hiba", "Nem sikerült megnyitni a navigációt.");
      });
    }
  }, [selectedMarker]);

  const handleFavouriteToggle = useCallback(
    async (marker: MapMarker) => {
      try {
        if (isFavourite(marker.id)) {
          await removeFavourite(marker.id);
        } else {
          await addFavourite(marker);
        }
      } catch (error) {
        Alert.alert("Hiba", "Nem sikerült frissíteni a kedvenceket.");
      }
    },
    [isFavourite, addFavourite, removeFavourite]
  );

  // Load favourites when component mounts
  useEffect(() => {
    loadFavourites();
  }, [loadFavourites]);

  // Clear marker cache on mount for iOS stability
  useEffect(() => {
    if (Platform.OS === "ios") {
      clearMarkerCache();
    }
  }, []);

  const handleListItemPress = useCallback(
    (marker: MapMarker) => {
      setSelectedMarker(marker);
      closeModal();

      const newRegion = {
        latitude: marker.coordinate.latitude,
        longitude: marker.coordinate.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      mapRef.current?.animateToRegion(newRegion, 500);
    },
    [closeModal]
  );

  // Universal stable clustering for both platforms
  const renderMarker = useCallback(
    (feature: any, index: number) => {
      // Check if it's a cluster first
      if (isCluster(feature)) {
        // Render cluster marker
        const clusterInfo = getClusterInfo(feature);
        const clusterBackgroundColor = "#059669";

        return (
          <Marker
            key={`cluster-${clusterInfo.clusterId}-${index}`}
            coordinate={clusterInfo.coordinate}
            onPress={() => handleClusterPress(feature)}
            tracksViewChanges={false}
            anchor={{ x: 0.5, y: 0.5 }}
            centerOffset={{ x: 0, y: 0 }}
            zIndex={200}
          >
            <View
              style={[
                styles.clusterContainer,
                {
                  backgroundColor: clusterBackgroundColor,
                  borderColor: "#fff",
                  borderWidth: 2,
                  // Platform-specific shadow optimizations
                  shadowOpacity: Platform.OS === 'ios' ? 0 : 0.2,
                  shadowRadius: Platform.OS === 'ios' ? 0 : 4,
                  elevation: Platform.OS === 'ios' ? 0 : 4,
                },
              ]}
            >
              <ThemedText style={styles.clusterText}>
                {clusterInfo.pointCount}
              </ThemedText>
            </View>
          </Marker>
        );
      }

      // Individual marker
      const marker = getMarkerFromPoint(feature);
      const isParking = marker.type === "parking";
      const isBicycleService = marker.type === "bicycleService";
      const isMarkerFavourite = isFavourite(marker.id);

      const iconName = isParking
        ? "bicycle"
        : isBicycleService
        ? "storefront"
        : "build";
      const iconColor = isParking
        ? "#059669"
        : isBicycleService
        ? "#F97316"
        : "#1D4ED8";
      const markerBackgroundColor = isParking
        ? "#D1FAE5"
        : isBicycleService
        ? "#FED7AA"
        : "#DBEAFE";
      const markerBorderColor = isMarkerFavourite ? "#FFD700" : "#fff";

      return (
        <Marker
          key={`marker-${marker.id}`}
          coordinate={marker.coordinate}
          title={marker.title}
          description={marker.description}
          onPress={() => handleMarkerPress(marker)}
          anchor={{ x: 0.5, y: 0.5 }}
          zIndex={100}
          tracksViewChanges={false}
        >
          <View
            style={[
              styles.markerContainer,
              {
                backgroundColor: markerBackgroundColor,
                borderColor: markerBorderColor,
                borderWidth: 2,
                // Platform-specific shadow optimizations
                shadowOpacity: Platform.OS === 'ios' ? 0 : 0.2,
                shadowRadius: Platform.OS === 'ios' ? 0 : 3,
                elevation: Platform.OS === 'ios' ? 0 : 3,
              },
            ]}
          >
            <Ionicons name={iconName as any} size={14} color={iconColor} />
            {isMarkerFavourite && (
              <View
                style={[
                  styles.starOverlay,
                  {
                    shadowOpacity: Platform.OS === 'ios' ? 0 : 0.2,
                    shadowRadius: Platform.OS === 'ios' ? 0 : 2,
                    elevation: Platform.OS === 'ios' ? 0 : 3,
                  },
                ]}
              >
                <Ionicons name="star" size={12} color="#FFD700" />
              </View>
            )}
          </View>
        </Marker>
      );
    },
    [handleMarkerPress, handleClusterPress, isFavourite]
  );

  // Calculate initial region based on user location or fallback to default
  const initialRegion = useMemo(() => {
    if (userLocation) {
      return {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    return INITIAL_REGION;
  }, [userLocation]);

  // Ultra-safe marker rendering with strict limits
  const renderedMarkers = useMemo(() => {
    // Strict iOS limits to prevent crashes
    const maxMarkers = Platform.OS === 'ios' ? 20 : 50;
    const safeMarkers = clusteredMarkers.slice(0, maxMarkers);
    
    const markers = safeMarkers.map((feature, index) => {
      try {
        return renderMarker(feature, index);
      } catch (error) {
        console.error('Marker render error:', error);
        return null;
      }
    }).filter(Boolean);
    
    console.log(
      `Rendering ${markers.length}/${safeMarkers.length} markers (max: ${maxMarkers}) - Platform: ${Platform.OS}`
    );
    return markers;
  }, [clusteredMarkers, renderMarker]);

  if (loading && markers.length === 0) {
    return (
      <ThemedView style={[styles.container, { backgroundColor }]}>
        <MapView
          ref={mapRef}
          provider={Platform.OS === "ios" ? PROVIDER_DEFAULT : PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFill}
          initialRegion={initialRegion}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass={false}
          showsScale={false}
          toolbarEnabled={false}
          customMapStyle={
            Platform.OS === "ios" ? undefined :
            mapType === "hybrid"
              ? []
              : isDarkMode
              ? DARK_MAP_STYLE
              : LIGHT_MAP_STYLE
          }
          mapType={mapType}
          rotateEnabled={true}
          scrollEnabled={true}
          zoomEnabled={true}
          // @ts-ignore - Using deprecated zoom props as camera doesn't support min/max constraints
          maxZoomLevel={Platform.OS === "ios" ? 18 : 20}
          minZoomLevel={Platform.OS === "ios" ? 8 : 3}
          loadingEnabled={true}
          loadingIndicatorColor="#3B82F6"
          loadingBackgroundColor={isDarkMode ? "#1F2937" : "#fff"}
        />

        <View
          style={[
            styles.loadingOverlay,
            { backgroundColor: backgroundColor + "90" },
          ]}
        >
          <ActivityIndicator size="large" color="#3B82F6" />
          <ThemedText style={[styles.loadingText, { color: textColor }]}>
            Helyek betöltése...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <MapView
        ref={mapRef}
        provider={Platform.OS === "ios" ? PROVIDER_DEFAULT : PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        onRegionChangeComplete={handleRegionChangeComplete}
        onMapReady={handleMapReady}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        toolbarEnabled={false}
        customMapStyle={
          Platform.OS === "ios" ? undefined :
          mapType === "hybrid"
            ? []
            : isDarkMode
            ? DARK_MAP_STYLE
            : LIGHT_MAP_STYLE
        }
        mapType={mapType}
        rotateEnabled={true}
        scrollEnabled={true}
        zoomEnabled={true}
        // @ts-ignore - Using deprecated zoom props as camera doesn't support min/max constraints
        maxZoomLevel={Platform.OS === "ios" ? 18 : 20}
        minZoomLevel={Platform.OS === "ios" ? 8 : 3}
        loadingEnabled={true}
        loadingIndicatorColor="#3B82F6"
        loadingBackgroundColor={isDarkMode ? "#1F2937" : "#fff"}
      >
        {renderedMarkers}
      </MapView>

      {selectedMarker && (
        <View
          style={[
            styles.flyoutContainer,
            {
              backgroundColor: cardBackground,
              borderColor: borderColor,
              shadowColor,
              padding: 0,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
              elevation: 16,
              bottom: bottomPosition + 60, // Position above the FAB buttons
            },
          ]}
        >
          <View
            style={[
              styles.flyoutHeader,
              {
                backgroundColor:
                  selectedMarker.type === "parking"
                    ? "rgba(5, 150, 105, 0.15)"
                    : selectedMarker.type === "bicycleService"
                    ? "rgba(249, 115, 22, 0.15)"
                    : "rgba(29, 78, 216, 0.15)",
                borderBottomColor:
                  selectedMarker.type === "parking"
                    ? "rgba(5, 150, 105, 0.2)"
                    : selectedMarker.type === "bicycleService"
                    ? "rgba(249, 115, 22, 0.2)"
                    : "rgba(29, 78, 216, 0.2)",
                paddingBottom: 12,
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
              },
            ]}
          >
            <View style={styles.flyoutTitleRow}>
              <View
                style={[
                  styles.flyoutIcon,
                  {
                    backgroundColor:
                      selectedMarker.type === "parking"
                        ? "#059669"
                        : selectedMarker.type === "bicycleService"
                        ? "#F97316"
                        : "#1D4ED8",
                    shadowOpacity: 0.15,
                    shadowRadius: 6,
                    elevation: 4,
                  },
                ]}
              >
                <Ionicons
                  name={
                    selectedMarker.type === "parking"
                      ? "bicycle"
                      : selectedMarker.type === "bicycleService"
                      ? "storefront"
                      : "build"
                  }
                  size={20}
                  color="#fff"
                />
              </View>
              <View style={styles.flyoutTitleContainer}>
                <ThemedText style={[styles.flyoutTitle, { color: textColor }]}>
                  {selectedMarker.title}
                </ThemedText>
                <View style={styles.flyoutSubtitleRow}>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor: selectedMarker.available
                          ? "#22C55E"
                          : "#EF4444",
                      },
                    ]}
                  />
                  <ThemedText
                    style={[styles.flyoutSubtitle, { color: textColor }]}
                  >
                    {selectedMarker.description}
                  </ThemedText>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={closeFlyout} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={textColor} />
            </TouchableOpacity>
          </View>

          <View style={[styles.flyoutContent, { paddingBottom: 20 }]}>
            {selectedMarker.type === "parking" ? (
              <View style={styles.parkingDetails}>
                <View style={styles.detailRow}>
                  <View
                    style={[
                      styles.detailIcon,
                      { backgroundColor: "rgba(5, 150, 105, 0.1)" },
                    ]}
                  >
                    <Ionicons name="bicycle" size={14} color="#059669" />
                  </View>
                  <ThemedText style={[styles.detailText, { color: textColor }]}>
                    Biciklitároló
                  </ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <View
                    style={[
                      styles.detailIcon,
                      { backgroundColor: "rgba(5, 150, 105, 0.1)" },
                    ]}
                  >
                    <Ionicons
                      name="shield-checkmark"
                      size={14}
                      color="#059669"
                    />
                  </View>
                  <ThemedText style={[styles.detailText, { color: textColor }]}>
                    Biztonságos tárolás
                  </ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <View
                    style={[
                      styles.detailIcon,
                      { backgroundColor: "rgba(5, 150, 105, 0.1)" },
                    ]}
                  >
                    <Ionicons name="time" size={14} color="#059669" />
                  </View>
                  <ThemedText style={[styles.detailText, { color: textColor }]}>
                    24/7 nyitva
                  </ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <View
                    style={[
                      styles.detailIcon,
                      { backgroundColor: "rgba(5, 150, 105, 0.1)" },
                    ]}
                  >
                    <Ionicons name="card" size={14} color="#059669" />
                  </View>
                  <ThemedText style={[styles.detailText, { color: textColor }]}>
                    Ingyenes
                  </ThemedText>
                </View>
              </View>
            ) : selectedMarker.type === "bicycleService" ? (
              <View style={styles.bicycleServiceDetails}>
                {selectedMarker.rating && (
                  <View style={styles.detailRow}>
                    <View
                      style={[
                        styles.detailIcon,
                        { backgroundColor: "rgba(249, 115, 22, 0.1)" },
                      ]}
                    >
                      <Ionicons name="star" size={14} color="#F97316" />
                    </View>
                    <ThemedText
                      style={[styles.detailText, { color: textColor }]}
                    >
                      {selectedMarker.rating.toFixed(1)}/5.0 értékelés
                    </ThemedText>
                  </View>
                )}
                {selectedMarker.openingHours && (
                  <View style={styles.detailRow}>
                    <View
                      style={[
                        styles.detailIcon,
                        { backgroundColor: "rgba(249, 115, 22, 0.1)" },
                      ]}
                    >
                      <Ionicons name="time" size={14} color="#F97316" />
                    </View>
                    <ThemedText
                      style={[styles.detailText, { color: textColor }]}
                    >
                      {selectedMarker.openingHours}
                    </ThemedText>
                  </View>
                )}
                {selectedMarker.phone && (
                  <View style={styles.detailRow}>
                    <View
                      style={[
                        styles.detailIcon,
                        { backgroundColor: "rgba(249, 115, 22, 0.1)" },
                      ]}
                    >
                      <Ionicons name="call" size={14} color="#F97316" />
                    </View>
                    <ThemedText
                      style={[styles.detailText, { color: textColor }]}
                    >
                      {selectedMarker.phone}
                    </ThemedText>
                  </View>
                )}
                {selectedMarker.priceRange && (
                  <View style={styles.detailRow}>
                    <View
                      style={[
                        styles.detailIcon,
                        { backgroundColor: "rgba(249, 115, 22, 0.1)" },
                      ]}
                    >
                      <Ionicons name="card" size={14} color="#F97316" />
                    </View>
                    <ThemedText
                      style={[styles.detailText, { color: textColor }]}
                    >
                      {selectedMarker.priceRange}
                    </ThemedText>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.repairDetails}>
                <View style={styles.detailRow}>
                  <View
                    style={[
                      styles.detailIcon,
                      { backgroundColor: "rgba(29, 78, 216, 0.1)" },
                    ]}
                  >
                    <Ionicons name="construct" size={14} color="#1D4ED8" />
                  </View>
                  <ThemedText style={[styles.detailText, { color: textColor }]}>
                    Teljes szerviz
                  </ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <View
                    style={[
                      styles.detailIcon,
                      { backgroundColor: "rgba(29, 78, 216, 0.1)" },
                    ]}
                  >
                    <Ionicons name="time" size={14} color="#1D4ED8" />
                  </View>
                  <ThemedText style={[styles.detailText, { color: textColor }]}>
                    H-P: 8:00-18:00
                  </ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <View
                    style={[
                      styles.detailIcon,
                      { backgroundColor: "rgba(29, 78, 216, 0.1)" },
                    ]}
                  >
                    <Ionicons name="call" size={14} color="#1D4ED8" />
                  </View>
                  <ThemedText style={[styles.detailText, { color: textColor }]}>
                    +36 62 123 4567
                  </ThemedText>
                </View>
                <View style={styles.detailRow}>
                  <View
                    style={[
                      styles.detailIcon,
                      { backgroundColor: "rgba(29, 78, 216, 0.1)" },
                    ]}
                  >
                    <Ionicons name="star" size={14} color="#1D4ED8" />
                  </View>
                  <ThemedText style={[styles.detailText, { color: textColor }]}>
                    4.8/5 értékelés
                  </ThemedText>
                </View>
              </View>
            )}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.actionButtonModern,
                  {
                    backgroundColor: selectedMarker.available
                      ? "#22C55E"
                      : "#EF4444",
                    flex: 1,
                    marginRight: 5,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: selectedMarker.available ? 1 : 0.7,
                  },
                ]}
                activeOpacity={0.85}
              >
                <Ionicons
                  name="eye"
                  size={16}
                  color="#fff"
                  style={{ marginRight: 6 }}
                />
                <ThemedText style={styles.actionButtonModernText}>
                  {selectedMarker.available ? "Megtekintés" : "Nem elérhető"}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButtonModern,
                  {
                    backgroundColor: isFavourite(selectedMarker.id)
                      ? "#FFD700"
                      : "#fff",
                    borderWidth: 2,
                    borderColor: "#FFD700",
                    width: 50,
                    marginHorizontal: 5,
                    alignItems: "center",
                    justifyContent: "center",
                  },
                ]}
                activeOpacity={0.85}
                onPress={() => handleFavouriteToggle(selectedMarker)}
              >
                <Ionicons
                  name={
                    isFavourite(selectedMarker.id) ? "star" : "star-outline"
                  }
                  size={20}
                  color={isFavourite(selectedMarker.id) ? "#fff" : "#FFD700"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButtonModern,
                  {
                    backgroundColor: "#fff",
                    borderWidth: 2,
                    borderColor: "#3B82F6",
                    flex: 1,
                    marginLeft: 5,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                ]}
                activeOpacity={0.85}
                onPress={handleDirections}
              >
                <Ionicons
                  name="navigate"
                  size={16}
                  color="#3B82F6"
                  style={{ marginRight: 6 }}
                />
                <ThemedText
                  style={[styles.actionButtonModernText, { color: "#3B82F6" }]}
                >
                  Útvonal
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <Modal
        visible={showListModal}
        animationType="none"
        transparent
        onRequestClose={closeModal}
      >
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.25)",
            justifyContent: "flex-end",
            opacity: backgroundOpacity,
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={closeModal} />
          <Animated.View
            style={{
              backgroundColor: cardBackground,
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              padding: 20,
              height: "65%",
              minHeight: 400,
              transform: [{ translateY: modalAnim }],
            }}
          >
            <Pressable style={{ flex: 1 }} onPress={(e) => e.stopPropagation()}>
              <View style={{ marginBottom: 16 }}>
                <FlatList
                  data={[
                    { key: "all", label: "Összes" },
                    { key: "parking", label: "Parkolók" },
                    { key: "repair", label: "Szervizek" },
                    { key: "bicycleService", label: "Boltok" },
                  ]}
                  keyExtractor={(item) => item.key}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{
                    paddingHorizontal: 20,
                    alignItems: "center",
                    justifyContent: "center",
                    flexGrow: 1,
                  }}
                  renderItem={({ item: f }) => (
                    <TouchableOpacity
                      key={f.key}
                      onPress={() => {
                        setListFilter(
                          f.key as
                            | "all"
                            | "parking"
                            | "repair"
                            | "bicycleService"
                        );
                      }}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: 20,
                        borderRadius: 22,
                        marginHorizontal: 6,
                        backgroundColor:
                          listFilter === f.key ? "#3B82F6" : "#E5E7EB",
                        minWidth: 80,
                        alignItems: "center",
                      }}
                      activeOpacity={0.85}
                    >
                      <ThemedText
                        style={{
                          color: listFilter === f.key ? "#fff" : "#222",
                          fontWeight: "600",
                          fontSize: 14,
                          textAlign: "center",
                        }}
                      >
                        {f.label}
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                />
              </View>
              <ThemedText
                style={{
                  fontWeight: "bold",
                  fontSize: 18,
                  marginBottom: 12,
                  textAlign: "center",
                }}
              >
                Közeli helyek
              </ThemedText>
              <FlatList
                data={listFilteredMarkers}
                keyExtractor={(item) => item.id}
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => handleListItemPress(item)}
                    style={({ pressed }) => [
                      {
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 12,
                        paddingHorizontal: 8,
                        borderBottomWidth: 1,
                        borderBottomColor: borderColor,
                        backgroundColor: pressed ? "#e5e7eb55" : "transparent",
                        borderRadius: 8,
                      },
                    ]}
                  >
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                        backgroundColor:
                          item.type === "parking"
                            ? "#D1FAE5"
                            : item.type === "bicycleService"
                            ? "#FED7AA"
                            : "#DBEAFE",
                      }}
                    >
                      <Ionicons
                        name={
                          item.type === "parking"
                            ? "bicycle"
                            : item.type === "bicycleService"
                            ? "storefront"
                            : "build"
                        }
                        size={18}
                        color={
                          item.type === "parking"
                            ? "#059669"
                            : item.type === "bicycleService"
                            ? "#F97316"
                            : "#1D4ED8"
                        }
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText style={{ fontWeight: "600", fontSize: 15 }}>
                        {item.title}
                      </ThemedText>
                      <ThemedText style={{ fontSize: 12, color: "#666" }}>
                        {item.type === "parking"
                          ? "Parkoló"
                          : item.type === "bicycleService"
                          ? "Bicikli bolt"
                          : "Szerviz"}{" "}
                        • {item.available ? "Nyitva" : "Zárva"}
                      </ThemedText>
                    </View>
                    {userLocation && item.distance !== undefined && (
                      <ThemedText
                        style={{
                          fontSize: 13,
                          color: "#3B82F6",
                          fontWeight: "500",
                          marginLeft: 8,
                        }}
                      >
                        {(item.distance / 1000).toFixed(2)} km
                      </ThemedText>
                    )}
                  </Pressable>
                )}
                ListEmptyComponent={
                  <Text
                    style={{
                      textAlign: "center",
                      color: "#888",
                      marginTop: 20,
                    }}
                  >
                    Nincs elérhető hely.
                  </Text>
                }
              />
              <TouchableOpacity
                onPress={closeModal}
                style={{ marginTop: 18, alignSelf: "center", padding: 10 }}
              >
                <ThemedText
                  style={{ color: "#3B82F6", fontWeight: "bold", fontSize: 16 }}
                >
                  Bezárás
                </ThemedText>
              </TouchableOpacity>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.filterModalOverlay}>
          <Pressable
            style={styles.filterModalOverlayPress}
            onPress={() => setShowFilterModal(false)}
          />
          <View
            style={[
              styles.filterModalContent,
              { backgroundColor: cardBackground },
            ]}
          >
            <View style={styles.filterModalHeader}>
              <ThemedText
                style={[styles.filterModalTitle, { color: textColor }]}
              >
                Szűrő beállítások
              </ThemedText>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={styles.filterModalClose}
              >
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>

            <View style={styles.filterSection}>
              <ThemedText
                style={[styles.filterSectionTitle, { color: textColor }]}
              >
                Megjelenített helyek
              </ThemedText>

              <TouchableOpacity
                style={styles.filterOption}
                onPress={() =>
                  setMarkerFilters((prev) => ({
                    ...prev,
                    parking: !prev.parking,
                  }))
                }
              >
                <View
                  style={[
                    styles.filterOptionIcon,
                    { backgroundColor: "#DCFCE7" },
                  ]}
                >
                  <Ionicons name="bicycle" size={20} color="#059669" />
                </View>
                <ThemedText
                  style={[styles.filterOptionText, { color: textColor }]}
                >
                  Biciklitárolók
                </ThemedText>
                <View
                  style={[
                    styles.checkbox,
                    markerFilters.parking && styles.checkboxChecked,
                  ]}
                >
                  {markerFilters.parking && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.filterOption}
                onPress={() =>
                  setMarkerFilters((prev) => ({
                    ...prev,
                    repairStation: !prev.repairStation,
                  }))
                }
              >
                <View
                  style={[
                    styles.filterOptionIcon,
                    { backgroundColor: "#DBEAFE" },
                  ]}
                >
                  <Ionicons name="build" size={20} color="#1D4ED8" />
                </View>
                <ThemedText
                  style={[styles.filterOptionText, { color: textColor }]}
                >
                  Javítóállomások
                </ThemedText>
                <View
                  style={[
                    styles.checkbox,
                    markerFilters.repairStation && styles.checkboxChecked,
                  ]}
                >
                  {markerFilters.repairStation && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.filterOption}
                onPress={() =>
                  setMarkerFilters((prev) => ({
                    ...prev,
                    bicycleService: !prev.bicycleService,
                  }))
                }
              >
                <View
                  style={[
                    styles.filterOptionIcon,
                    { backgroundColor: "#FED7AA" },
                  ]}
                >
                  <Ionicons name="storefront" size={20} color="#F97316" />
                </View>
                <ThemedText
                  style={[styles.filterOptionText, { color: textColor }]}
                >
                  Bicikli boltok
                </ThemedText>
                <View
                  style={[
                    styles.checkbox,
                    markerFilters.bicycleService && styles.checkboxChecked,
                  ]}
                >
                  {markerFilters.bicycleService && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.filterSection}>
              <ThemedText
                style={[styles.filterSectionTitle, { color: textColor }]}
              >
                Térkép nézet
              </ThemedText>

              <TouchableOpacity
                style={styles.filterOption}
                onPress={() => setMapType("standard")}
              >
                <View
                  style={[
                    styles.filterOptionIcon,
                    { backgroundColor: "#E5E7EB" },
                  ]}
                >
                  <Ionicons name="map" size={20} color="#6B7280" />
                </View>
                <ThemedText
                  style={[styles.filterOptionText, { color: textColor }]}
                >
                  Utcai térkép
                </ThemedText>
                <View
                  style={[
                    styles.checkbox,
                    mapType === "standard" && styles.checkboxChecked,
                  ]}
                >
                  {mapType === "standard" && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.filterOption}
                onPress={() => setMapType("hybrid")}
              >
                <View
                  style={[
                    styles.filterOptionIcon,
                    { backgroundColor: "#E5E7EB" },
                  ]}
                >
                  <Ionicons name="globe" size={20} color="#6B7280" />
                </View>
                <ThemedText
                  style={[styles.filterOptionText, { color: textColor }]}
                >
                  Műholdas nézet
                </ThemedText>
                <View
                  style={[
                    styles.checkbox,
                    mapType === "hybrid" && styles.checkboxChecked,
                  ]}
                >
                  {mapType === "hybrid" && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.filterApplyButton, { backgroundColor: "#3B82F6" }]}
              onPress={() => setShowFilterModal(false)}
            >
              <ThemedText style={styles.filterApplyButtonText}>
                Alkalmaz
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Search Button - appears when user moves map away from their location */}
      {showSearchButton && (
        <View style={styles.fabGroupTopCenter}>
          <TouchableOpacity
            style={[
              styles.searchButton,
              {
                backgroundColor: "#3B82F6",
                shadowColor,
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 8,
              },
            ]}
            onPress={handleSearchAtCurrentLocation}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator
                size="small"
                color="#fff"
                style={{ marginRight: 8 }}
              />
            ) : (
              <Ionicons
                name="search"
                size={18}
                color="#fff"
                style={{ marginRight: 8 }}
              />
            )}
            <ThemedText style={[styles.searchButtonText, { color: "#fff" }]}>
              {loading ? "Keresés..." : "Keresés"}
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* Filter Button - top right corner */}
      <View style={styles.fabGroupTopRight}>
        <TouchableOpacity
          style={[
            styles.fab,
            {
              backgroundColor: cardBackground,
              shadowColor,
              borderColor: borderColor,
              borderWidth: 1,
            },
          ]}
          onPress={() => setShowFilterModal(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="options" size={22} color={textColor} />
        </TouchableOpacity>
      </View>

      <View style={[styles.fabGroupBottomCenter, { bottom: bottomPosition }]}>
        <TouchableOpacity
          style={[
            styles.fabWide,
            {
              backgroundColor: cardBackground,
              shadowColor,
              borderColor: borderColor,
              borderWidth: 1,
            },
          ]}
          onPress={() => {
            setListFilter("all");
            openModal();
          }}
          activeOpacity={0.85}
        >
          <Ionicons
            name="list"
            size={18}
            color={textColor}
            style={{ marginRight: 8 }}
          />
          <ThemedText style={[styles.fabWideText, { color: textColor }]}>
            Lista nézet
          </ThemedText>
        </TouchableOpacity>
      </View>

      <View style={[styles.fabGroupBottomRight, { bottom: bottomPosition }]}>
        <TouchableOpacity
          style={[
            styles.fab,
            {
              backgroundColor: cardBackground,
              shadowColor,
              borderColor: borderColor,
              borderWidth: 1,
            },
          ]}
          onPress={recenter}
        >
          <Ionicons name="locate" size={22} color={textColor} />
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  markerContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        // iOS-specific optimizations for rotation stability
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        backgroundColor: "transparent",
        // Prevent transform issues during rotation
        transform: [{ perspective: 1000 }],
      },
      android: {
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 4,
        backgroundColor: "transparent",
      },
    }),
  },
  calloutContainer: {
    padding: 8,
    minWidth: 150,
  },
  calloutTitle: {
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 4,
  },
  calloutDescription: {
    fontSize: 12,
    marginBottom: 6,
    color: "#666",
  },
  statusIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  statusText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "500",
  },
  fabGroupTopCenter: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  fabGroupTopRight: {
    position: "absolute",
    top: 60,
    right: 18,
    zIndex: 20,
  },

  fabGroupBottomCenter: {
    position: "absolute",
    // bottom will be set dynamically based on platform and safe area
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  fabGroupBottomRight: {
    position: "absolute",
    // bottom will be set dynamically based on platform and safe area
    right: 18,
    zIndex: 20,
  },
  fab: {
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  fabWide: {
    borderRadius: 24,
    paddingHorizontal: 12,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    minWidth: 120,
    maxWidth: 180,
  },
  fabWideText: {
    fontWeight: "500",
    fontSize: 16,
  },
  searchButton: {
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    minWidth: 120,
  },
  searchButtonText: {
    fontWeight: "600",
    fontSize: 16,
  },

  flyoutContainer: {
    position: "absolute",
    // bottom will be set dynamically based on platform and safe area
    left: 16,
    right: 16,
    borderRadius: 16,
    borderWidth: 1,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
    maxHeight: 280,
    overflow: "hidden",
  },
  flyoutHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
  flyoutIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  flyoutTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  flyoutTitleContainer: {
    flex: 1,
  },
  flyoutTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  flyoutSubtitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  flyoutSubtitle: {
    fontSize: 12,
    color: "#666",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  closeButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  flyoutContent: {
    padding: 16,
  },
  parkingDetails: {
    marginBottom: 16,
  },
  repairDetails: {
    marginBottom: 16,
  },
  bicycleServiceDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  detailText: {
    fontSize: 13,
    color: "#666",
    flex: 1,
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -25,
  },
  actionButtonModern: {
    paddingVertical: 2,
    paddingHorizontal: 0,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 44,
    minWidth: 0,
    marginTop: 8,
  },
  actionButtonModernText: {
    fontWeight: "700",
    fontSize: 15,
    color: "#fff",
    letterSpacing: 0.1,
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "500",
  },
  markerWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        backgroundColor: "transparent",
        overflow: "visible",
      },
      android: {
        backgroundColor: "transparent",
      },
    }),
  },
  starOverlay: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#fff",
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  clusterContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    ...Platform.select({
      ios: {
        // iOS-specific optimizations for stability
        shadowColor: "transparent",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
        // Prevent transform and rendering issues
        backgroundColor: "transparent",
        overflow: "visible",
        // Force hardware acceleration for better performance
        shouldRasterizeIOS: true,
        rasterizationScale: 2,
      },
      android: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
        backgroundColor: "transparent",
      },
    }),
  },
  clusterText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
    textAlign: "center",
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
  },
  filterModalOverlayPress: {
    flex: 1,
  },
  filterModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 400,
  },
  filterModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  filterModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  filterModalClose: {
    padding: 4,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  filterOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  filterOptionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#3B82F6",
    borderColor: "#3B82F6",
  },
  filterApplyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  filterApplyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
