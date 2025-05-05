import { Tabs, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Platform, View, Pressable, StyleSheet, Modal, TouchableOpacity, TouchableWithoutFeedback, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { DrawerActions } from '@react-navigation/native';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

// Sample notifications data
const notifications = [
  { id: '1', title: 'Új biciklitároló a közelben', message: 'Felfedezhet egy új biciklitárolót az Ön közelében.', time: '2 perce', read: false },
  { id: '2', title: 'Foglalás megerősítve', message: 'A Keleti biciklitárolónál történt foglalását megerősítettük.', time: '3 órája', read: false },
  { id: '3', title: 'Értékelés kérés', message: 'Kérjük, értékelje a legutóbbi Bringaszerviz látogatását!', time: '1 napja', read: true },
  { id: '4', title: 'Akciós kerékpár kiegészítők', message: 'A BringaDoktornál most 20% kedvezménnyel vásárolhat kiegészítőket.', time: '2 napja', read: true },
  { id: '5', title: 'Akciós kerékpár kiegészítők', message: 'A BringaDoktornál most 20% kedvezménnyel vásárolhat kiegészítőket.', time: '2 napja', read: true },
  { id: '6', title: 'Akciós kerékpár kiegészítők', message: 'A BringaDoktornál most 20% kedvezménnyel vásárolhat kiegészítőket.', time: '2 napja', read: true },
];

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const navigation = useNavigation();
  const colors = Colors[colorScheme ?? 'light'];
  
  // State for notification modal
  const [notificationModalVisible, setNotificationModalVisible] = useState(false);
  const [notificationsState, setNotificationsState] = useState(notifications);

  const headerButtonStyle = { paddingHorizontal: 15 };
  const headerIconColor = colors.text;
  const headerIconSize = 24;

  // Unread notification count
  const unreadCount = notificationsState.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotificationsState(
      notificationsState.map(notification => ({
        ...notification,
        read: true
      }))
    );
  };

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: 'green',
          headerShown: true,
          headerTitle: 'ParkSafe',
          headerTitleAlign: 'center',

          headerLeft: () => (
            <Pressable
              style={headerButtonStyle}
              onPress={() => {
                navigation.dispatch(DrawerActions.openDrawer());
                console.log('Menu pressed - opening drawer');
              }}>
              <Feather name="menu" size={headerIconSize} color={headerIconColor} />
            </Pressable>
          ),
          
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Pressable
                style={headerButtonStyle}
                onPress={() => {
                  console.log('Search pressed');
                }}>
                <Feather name="search" size={headerIconSize} color={headerIconColor} />
              </Pressable>
              <Pressable
                style={[headerButtonStyle, styles.notificationIconContainer]}
                onPress={() => {
                  setNotificationModalVisible(true);
                  console.log('Notifications pressed');
                }}>
                <Feather name="bell" size={headerIconSize} color={headerIconColor} />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <ThemedText style={styles.notificationBadgeText}>
                      {unreadCount}
                    </ThemedText>
                  </View>
                )}
              </Pressable>
            </View>
          ),
          
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              position: 'absolute',
            },
            default: {},
          }),
          tabBarIcon: ({ color, size, focused }) => {
            let iconName = 'circle';
            return <Feather name={iconName as any} size={28} color={color} />;
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Főoldal',
            tabBarIcon: ({ color, size, focused }) => (
              <Feather name="home" size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: 'Térkép',
            tabBarIcon: ({ color, size, focused }) => (
              <Feather name="map" size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="favourites"
          options={{
            title: 'Kedvencek',
            tabBarIcon: ({ color, size, focused }) => (
              <Feather name="star" size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color, size, focused }) => (
              <Feather name="user" size={28} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* Notification Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={notificationModalVisible}
        onRequestClose={() => setNotificationModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setNotificationModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <ThemedView style={[
                styles.modalContent, 
                { 
                  backgroundColor: colorScheme === 'dark' ? '#222' : '#fff',
                  borderTopColor: colorScheme === 'dark' ? '#333' : '#eee',
                }
              ]}>
                <View style={[
                  styles.modalHeader, 
                  { borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee' }
                ]}>
                  <View style={styles.modalHandleContainer}>
                    <View style={[styles.modalHandle, { backgroundColor: colorScheme === 'dark' ? '#555' : '#ccc' }]} />
                  </View>
                  <ThemedText type="title">Értesítések</ThemedText>
                  <TouchableOpacity 
                    style={styles.closeButtonContainer} 
                    onPress={() => setNotificationModalVisible(false)}
                  >
                    <Feather name="x" size={24} color={headerIconColor} />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.notificationsContainer}>
                  {notificationsState.length > 0 ? (
                    notificationsState.map((notification, index) => (
                      <TouchableOpacity 
                        key={notification.id || `notification-${index}`}
                        activeOpacity={0.7}
                        onPress={() => {
                          // Update this specific notification to read
                          const updatedNotifications = [...notificationsState];
                          updatedNotifications[index] = {
                            ...updatedNotifications[index],
                            read: true
                          };
                          setNotificationsState(updatedNotifications);
                        }}
                      >
                        <ThemedView 
                          style={[
                            styles.notificationItem,
                            notification.read ? null : styles.unreadNotification,
                            { borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee' },
                            index === notificationsState.length - 1 ? styles.lastNotificationItem : null
                          ]}
                        >
                          <View style={[
                            styles.notificationIcon,
                            { backgroundColor: notification.read 
                              ? (colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)') 
                              : 'rgba(76, 175, 80, 0.1)' 
                            }
                          ]}>
                            <Feather 
                              name={notification.title.includes('tároló') ? 'map-pin' : 
                                    notification.title.includes('foglalás') ? 'calendar' : 
                                    notification.title.includes('Értékelés') ? 'star' : 'bell'} 
                              size={20} 
                              color={notification.read ? colors.text : '#4CAF50'} 
                            />
                          </View>
                          <View style={styles.notificationContent}>
                            <ThemedText style={styles.notificationTitle} type={notification.read ? 'default' : 'defaultSemiBold'}>
                              {notification.title}
                            </ThemedText>
                            <ThemedText style={styles.notificationMessage}>
                              {notification.message}
                            </ThemedText>
                            <ThemedText style={styles.notificationTime}>
                              {notification.time}
                            </ThemedText>
                          </View>
                          
                          {!notification.read && (
                            <View style={styles.unreadDot} />
                          )}
                        </ThemedView>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <ThemedText style={styles.emptyNotification}>
                      Nincs értesítés
                    </ThemedText>
                  )}
                </ScrollView>

                {unreadCount > 0 && (
                  <View style={[
                    styles.modalFooter, 
                    { borderTopColor: colorScheme === 'dark' ? '#333' : '#eee' }
                  ]}>
                    <TouchableOpacity 
                      style={[
                        styles.footerButton,
                        { backgroundColor: colors.primary }
                      ]} 
                      onPress={() => {
                        markAllAsRead();
                      }}
                    >
                      <ThemedText style={styles.footerButtonText}>Összes olvasottnak jelölése</ThemedText>
                    </TouchableOpacity>
                  </View>
                )}
              </ThemedView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  notificationIconContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: 10,
    backgroundColor: '#ff3b30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    paddingTop: 0, // Removed padding for handle
    paddingBottom: 0, // Removed padding to fix gap
    height: '85%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  modalHandleContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 10,
    left: 22,
    zIndex: 10,
  },
  modalHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  closeButtonContainer: {
    position: 'absolute',
    right: 16,
  },
  notificationsContainer: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    position: 'relative',
  },
  lastNotificationItem: {
    borderBottomWidth: 0,
  },
  unreadNotification: {
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
  },
  unreadDot: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
    paddingRight: 8,
  },
  notificationTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    opacity: 0.8,
  },
  notificationTime: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  emptyNotification: {
    textAlign: 'center',
    padding: 20,
    opacity: 0.6,
  },
  modalFooter: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16, // Add extra padding for iOS devices with home indicator
    borderTopWidth: 1,
  },
  footerButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  footerButtonText: {
    fontWeight: '600',
    fontSize: 16,
  }
});