import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Pressable, 
  ScrollView,
  useColorScheme,
  SafeAreaView,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ActivityItem = {
  id: string;
  title: string;
  type: string;
  date: string;
  iconType: 'bike' | 'tool';
};

type ReviewItem = {
  id: string;
  parkingName: string;
  rating: number;
  date: string;
  comment: string;
  imageUrl?: string;
};

export default function ProfileScreen() {
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme() ?? 'light';
  const themeColors = Colors[colorScheme];
  
  // State for active tab - default to activity
  const [activeTab, setActiveTab] = useState<'activity' | 'reviews'>('activity');
  
  // Reset tab selection on focus, unless specific parameters are provided
  useFocusEffect(
    React.useCallback(() => {
      const loadTabState = async () => {
        try {
          // Clear any stored tab selection to start fresh
          await AsyncStorage.removeItem('profileActiveTab');

          const activeTabParam = params.activeTab as string | undefined;
          const hasTimestamp = params._t !== undefined;
          
          // Only change the tab if we have a parameter AND it comes with a timestamp
          // (indicating it's from drawer navigation)
          if (activeTabParam && hasTimestamp) {
            if (activeTabParam === 'reviews') {
              console.log('Setting reviews tab from drawer navigation');
              setActiveTab('reviews');
            } else if (activeTabParam === 'activity') {
              setActiveTab('activity');
            }
          } else {
            // Default to activity tab when no specific params are provided
            // This ensures the profile always starts with Activity tab
            setActiveTab('activity');
          }
        } catch (error) {
          console.error('Error handling tab selection:', error);
        }
      };
      
      loadTabState();
      
      // No cleanup needed
      return () => {};
    }, [params.activeTab, params._t])
  );
  
  // Update the tab state when user manually changes tabs
  const handleTabChange = (tab: 'activity' | 'reviews') => {
    setActiveTab(tab);
    // Store user's manual tab selection for the current session only
    try {
      AsyncStorage.setItem('profileActiveTab', tab);
    } catch (error) {
      console.error('Error saving tab selection:', error);
    }
  };
  
  // Mock user data
  const userData = {
    name: 'Felhasználó Név',
    email: 'felhasznalo@email.com',
  };
  
  // Mock activity data
  const activityData: ActivityItem[] = [
    { 
      id: '1', 
      title: 'Keleti Biciklitároló', 
      type: 'Foglalás', 
      date: '2023-08-15',
      iconType: 'bike'
    },
    { 
      id: '2', 
      title: 'Bringaszerviz Kft.', 
      type: 'Időpontfoglalás', 
      date: '2023-07-20',
      iconType: 'tool'
    },
    { 
      id: '3', 
      title: 'Nyugati Biciklitároló', 
      type: 'Foglalás', 
      date: '2023-06-10',
      iconType: 'bike'
    },
  ];
  
  // Mock reviews data
  const reviewsData: ReviewItem[] = [
    {
      id: '1',
      parkingName: 'Westend Parkoló',
      rating: 4,
      date: '2023-07-28',
      comment: 'Tiszta, jól megvilágított parkoló. Mindig van szabad hely.',
      imageUrl: 'https://via.placeholder.com/80x80'
    },
    {
      id: '2',
      parkingName: 'Árkád Mélygarázs',
      rating: 3,
      date: '2023-06-15',
      comment: 'Elég szűk a parkolóhelyek között a hely, nehéz manőverezni.',
    },
    {
      id: '3',
      parkingName: 'MOM Park',
      rating: 5,
      date: '2023-05-20',
      comment: 'Kiválóan karbantartott, biztonságos parkoló. Ajánlom!',
      imageUrl: 'https://via.placeholder.com/80x80'
    }
  ];

  // Create styles with the current theme
  const styles = createThemedStyles(themeColors, colorScheme);
  
  // Function to render star ratings
  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map(star => (
          <Feather
            key={star}
            name="star"
            size={14}
            color={star <= rating ? '#FFD700' : (colorScheme === 'dark' ? '#444' : '#DDD')}
            style={{ marginRight: 2 }}
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Info Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Feather name="user" size={32} color={colorScheme === 'dark' ? '#777' : '#8E8E93'} />
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{userData.name}</Text>
            <Text style={styles.userEmail}>{userData.email}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <Pressable 
            style={styles.settingsButton}
            onPress={() => router.push('/settings')}
          >
            <Feather name="settings" size={18} color={themeColors.text} style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Beállítások</Text>
          </Pressable>
          
          <Pressable 
            style={styles.logoutButton}
            onPress={() => console.log('Logout')}
          >
            <Feather name="log-out" size={18} color="#FF3B30" style={styles.buttonIcon} />
            <Text style={styles.logoutButtonText}>Kijelentkezés</Text>
          </Pressable>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <Pressable 
            style={[styles.tab, activeTab === 'activity' && styles.activeTab]}
            onPress={() => handleTabChange('activity')}
          >
            <Text style={[
              styles.tabText, 
              activeTab === 'activity' && styles.activeTabText
            ]}>
              Aktivitás
            </Text>
          </Pressable>
          
          <Pressable 
            style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
            onPress={() => handleTabChange('reviews')}
          >
            <Text style={[
              styles.tabText, 
              activeTab === 'reviews' && styles.activeTabText
            ]}>
              Értékeléseim
            </Text>
          </Pressable>
        </View>

        {/* Activity List */}
        {activeTab === 'activity' && (
          <View style={styles.activityContainer}>
            {activityData.map((item) => (
              <View key={item.id} style={styles.activityItem}>
                <View style={[
                  styles.activityIconContainer, 
                  { 
                    backgroundColor: colorScheme === 'dark' 
                      ? (item.iconType === 'bike' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(33, 150, 243, 0.2)') 
                      : (item.iconType === 'bike' ? '#E8F5E9' : '#E3F2FD') 
                  }
                ]}>
                  <Feather 
                    name={item.iconType === 'bike' ? 'navigation' : 'tool'} 
                    size={24} 
                    color={item.iconType === 'bike' ? '#4CAF50' : '#2196F3'} 
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{item.title}</Text>
                  <Text style={styles.activityType}>{item.type}</Text>
                </View>
                <Text style={styles.activityDate}>{item.date}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <View style={styles.reviewsContainer}>
            {reviewsData.map((review) => (
              <View key={review.id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.parkingName}>{review.parkingName}</Text>
                  <Text style={styles.reviewDate}>{review.date}</Text>
                </View>
                
                {/* Star Rating */}
                {renderStars(review.rating)}
                
                {/* Review Comment */}
                <Text style={styles.reviewComment}>{review.comment}</Text>
                
                {/* Review Image (if available) */}
                {review.imageUrl && (
                  <View style={styles.reviewImageContainer}>
                    <Image 
                      source={{ uri: review.imageUrl }} 
                      style={styles.reviewImage} 
                      resizeMode="cover"
                    />
                  </View>
                )}
                
                {/* Review Actions */}
                <View style={styles.reviewActions}>
                  <Pressable style={styles.reviewAction}>
                    <Feather name="edit-2" size={14} color={colorScheme === 'dark' ? '#AAA' : '#777'} style={styles.actionIcon} />
                    <Text style={styles.actionText}>Szerkesztés</Text>
                  </Pressable>
                  <Pressable style={styles.reviewAction}>
                    <Feather name="trash-2" size={14} color={colorScheme === 'dark' ? '#AAA' : '#777'} style={styles.actionIcon} />
                    <Text style={styles.actionText}>Törlés</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createThemedStyles = (themeColors: any, colorScheme: 'light' | 'dark') => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colorScheme === 'dark' ? '#333' : '#EEEEEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: themeColors.text,
  },
  userEmail: {
    fontSize: 16,
    color: colorScheme === 'dark' ? '#AAA' : '#777777',
    marginTop: 4,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  settingsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: colorScheme === 'dark' ? '#444' : '#DDDDDD',
    backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
  },
  logoutButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: colorScheme === 'dark' ? 'rgba(255, 59, 48, 0.3)' : '#FFE5E5',
    backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: themeColors.text,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF3B30',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#F7F7F7',
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: colorScheme === 'dark' ? '#AAA' : '#777777',
  },
  activeTabText: {
    color: themeColors.text,
    fontWeight: '600',
  },
  activityContainer: {
    paddingHorizontal: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? '#333' : '#EEEEEE',
    borderRadius: 8,
    padding: 16,
    backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
  },
  activityIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.text,
    marginBottom: 4,
  },
  activityType: {
    fontSize: 14,
    color: colorScheme === 'dark' ? '#AAA' : '#777777',
  },
  activityDate: {
    fontSize: 14,
    color: colorScheme === 'dark' ? '#777' : '#999999',
  },
  reviewsContainer: {
    paddingHorizontal: 16,
  },
  reviewItem: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colorScheme === 'dark' ? '#333' : '#EEEEEE',
    borderRadius: 8,
    padding: 16,
    backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  parkingName: {
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.text,
  },
  reviewDate: {
    fontSize: 14,
    color: colorScheme === 'dark' ? '#777' : '#999999',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  reviewComment: {
    fontSize: 15,
    color: themeColors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  reviewImageContainer: {
    marginBottom: 12,
  },
  reviewImage: {
    width: 80,
    height: 80,
    borderRadius: 4,
  },
  reviewActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colorScheme === 'dark' ? '#333' : '#EEEEEE',
    paddingTop: 12,
  },
  reviewAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionIcon: {
    marginRight: 4,
  },
  actionText: {
    fontSize: 14,
    color: colorScheme === 'dark' ? '#AAA' : '#777777',
  }
});