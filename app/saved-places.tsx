import React  from 'react';
import { 
  View, Text, StyleSheet, Pressable, SafeAreaView, StatusBar, 
  Platform, FlatList, Animated, useColorScheme
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

type SavedPlace = {
  id: string;
  name: string;
  address: string;
  favorite: boolean;
  type: 'home' | 'work' | 'other';
};

export default function SavedPlacesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';

  // Get colors based on theme
  const themeColors = Colors[colorScheme];

  // Placeholder data for saved places
  const placeholderData: SavedPlace[] = [
    { id: '1', name: 'Otthon', address: 'Petőfi Sándor utca 12, Budapest', favorite: true, type: 'home' },
    { id: '2', name: 'Munkahely', address: 'Váci út 33, Budapest', favorite: true, type: 'work' },
    { id: '3', name: 'Bevásárlóközpont', address: 'Andrássy út 102, Budapest', favorite: false, type: 'other' },
    { id: '4', name: 'Konditerem', address: 'Bartók Béla út 75, Budapest', favorite: false, type: 'other' },
  ];


  const getIconForType = (type: 'home' | 'work' | 'other') => {
    switch (type) {
      case 'home':
        return 'home';
      case 'work':
        return 'briefcase';
      default:
        return 'map-pin';
    }
  };

  // Create styles with the current theme
  const themeStyles = createThemedStyles(themeColors, colorScheme);

  const renderItem = ({ item }: { item: SavedPlace }) => (
    <Pressable
      style={({pressed}) => [
        themeStyles.placeItem,
        pressed && themeStyles.placeItemPressed
      ]}
      onPress={() => console.log(`Selected place: ${item.name}`)}
    >
      <View style={themeStyles.placeIconContainer}>
        <Feather name={getIconForType(item.type)} size={20} color={themeColors.tint} />
      </View>
      <View style={themeStyles.placeContent}>
        <Text style={themeStyles.placeName}>{item.name}</Text>
        <Text style={themeStyles.placeAddress}>{item.address}</Text>
      </View>
      <Pressable
        style={themeStyles.favoriteButton}
        onPress={() => console.log(`Toggle favorite: ${item.name}`)}
        hitSlop={8}
      >
        <Feather
          name={item.favorite ? "star" : "star"}
          size={22}
          color={item.favorite ? '#FFD700' : (colorScheme === 'dark' ? '#555' : '#DDD')}
        />
      </Pressable>
    </Pressable>
  );

  const EmptyState = () => (
    <View style={themeStyles.emptyContainer}>
      <View style={themeStyles.emptyIconContainer}>
        <Feather name="map" size={50} color={themeColors.tint} style={themeStyles.emptyIcon} />
      </View>
      <Text style={themeStyles.emptyTitle}>Nincsenek mentett helyek</Text>
      <Text style={themeStyles.emptyDescription}>
        A gyors navigációhoz mentsd el a gyakran használt helyeket.
      </Text>
      <Pressable
        style={themeStyles.addButton}
        onPress={() => console.log('Add new place')}
      >
        <Feather name="plus" size={20} color="#FFF" style={{ marginRight: 8 }} />
        <Text style={themeStyles.addButtonText}>Új hely hozzáadása</Text>
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={themeStyles.safeArea}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Header with Animated Back Button */}
      <View style={themeStyles.header}>
        <Animated.View>
          <Pressable
            style={themeStyles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Feather name="arrow-left" size={24} color={themeColors.text} />
          </Pressable>
        </Animated.View>
        <Text style={themeStyles.headerTitle}>Mentett helyek</Text>
        <Pressable
          style={themeStyles.addNewButton}
          onPress={() => console.log('Add new place')}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Feather name="plus" size={24} color={themeColors.tint} />
        </Pressable>
      </View>

      {/* Content */}
      <FlatList
        data={placeholderData}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={themeStyles.listContent}
        ListEmptyComponent={EmptyState}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

// Create theme-specific styles
const createThemedStyles = (themeColors: any, colorScheme: 'light' | 'dark') => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: themeColors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colorScheme === 'dark' ? '#333' : '#EEEEEE',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: themeColors.text,
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
  },
  addNewButton: {
    padding: 8,
  },
  listContent: {
    paddingVertical: 16,
    flexGrow: 1,
  },
  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colorScheme === 'dark' ? '#333' : '#F0F0F0',
  },
  placeItemPressed: {
    backgroundColor: colorScheme === 'dark' ? '#2A2A2A' : '#F8F8F8',
  },
  placeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colorScheme === 'dark'
      ? 'rgba(74, 144, 226, 0.2)'
      : 'rgba(74, 144, 226, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  placeContent: {
    flex: 1,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '500',
    color: themeColors.text,
    marginBottom: 2,
  },
  placeAddress: {
    fontSize: 14,
    color: colorScheme === 'dark' ? '#AAA' : '#888888',
  },
  favoriteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colorScheme === 'dark'
      ? 'rgba(74, 144, 226, 0.15)'
      : 'rgba(74, 144, 226, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyIcon: {
    opacity: 0.8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: themeColors.text,
    marginBottom: 10,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    color: colorScheme === 'dark' ? '#AAA' : '#888888',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: themeColors.tint,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 50,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  }
});