import React from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useThemeStore } from '@/stores/themeStore';
import { router } from 'expo-router';

const notificationsData = [
  {
    id: '1',
    title: 'Új biciklitároló nyílt',
    message: 'A Keleti pályaudvar közelében új biztonságos biciklitároló nyílt meg. Fedezze fel most!',
    time: '2 órája',
    type: 'info',
    icon: 'information-circle',
    color: '#3B82F6',
    backgroundColor: '#DBEAFE',
  },
  {
    id: '2',
    title: 'Szerviz kedvezmény',
    message: 'A Bringaszerviz Kft. 20% kedvezményt ad az alapszervizre. Érvényes március 31-ig.',
    time: '1 napja',
    type: 'promo',
    icon: 'gift',
    color: '#10B981',
    backgroundColor: '#D1FAE5',
  },
  {
    id: '3',
    title: 'Karbantartás',
    message: 'A Nyugati biciklitároló átmenetileg zárva lesz karbantartás miatt. Várható megnyitás: holnap 10:00.',
    time: '2 napja',
    type: 'warning',
    icon: 'warning',
    color: '#F59E0B',
    backgroundColor: '#FEF3C7',
  },
  {
    id: '4',
    title: 'Értékelés kérés',
    message: 'Mit szólt a Központi Szervizhez? Ossza meg tapasztalatait más felhasználókkal.',
    time: '3 napja',
    type: 'request',
    icon: 'star',
    color: '#8B5CF6',
    backgroundColor: '#E9D5FF',
  },
  {
    id: '5',
    title: 'Biztonsági frissítés',
    message: 'Az alkalmazás biztonsági frissítése elérhető. Javasoljuk a legújabb verzióra való frissítést.',
    time: '1 hete',
    type: 'security',
    icon: 'shield-checkmark',
    color: '#EF4444',
    backgroundColor: '#FEE2E2',
  },
];

export default function NotificationsScreen() {
  const { currentTheme } = useThemeStore();
  const isDarkMode = currentTheme === 'dark';
  const cardBackgroundColor = useThemeColor({ light: '#FFFFFF', dark: '#1E293B' }, 'background');
  const subtitleColor = useThemeColor({ light: '#64748B', dark: '#94A3B8' }, 'text');
  const textColor = useThemeColor({}, 'text');

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={isDarkMode ? ['#0F172A', '#1E293B'] : ['#22C55E', '#16A34A']}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <ThemedText style={styles.headerTitle}>Értesítések</ThemedText>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="checkmark-done" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {notificationsData.map((notification) => (
          <TouchableOpacity
            key={notification.id}
            style={[styles.notificationCard, { backgroundColor: cardBackgroundColor }]}
            activeOpacity={0.7}
          >
            <View style={styles.notificationContent}>
              <View style={[
                styles.notificationIcon,
                { backgroundColor: notification.backgroundColor }
              ]}>
                <Ionicons 
                  name={notification.icon as any} 
                  size={24} 
                  color={notification.color} 
                />
              </View>
              
              <View style={styles.notificationInfo}>
                <View style={styles.notificationHeader}>
                  <ThemedText style={[styles.notificationTitle, { color: textColor }]}>
                    {notification.title}
                  </ThemedText>
                  <ThemedText style={[styles.notificationTime, { color: subtitleColor }]}>
                    {notification.time}
                  </ThemedText>
                </View>
                
                <ThemedText style={[styles.notificationMessage, { color: subtitleColor }]}>
                  {notification.message}
                </ThemedText>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Empty state if no notifications */}
        {notificationsData.length === 0 && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: subtitleColor + '20' }]}>
              <Ionicons name="notifications-off" size={48} color={subtitleColor} />
            </View>
            <ThemedText style={[styles.emptyTitle, { color: textColor }]}>
              Nincs értesítés
            </ThemedText>
            <ThemedText style={[styles.emptyMessage, { color: subtitleColor }]}>
              Amikor új frissítések érkeznek, itt fogja látni őket
            </ThemedText>
          </View>
        )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 100,
  },
  notificationCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationInfo: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  notificationTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 40,
  },
});