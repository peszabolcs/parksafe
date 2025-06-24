import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';
import { supabase } from '@/lib/supabase';

const user = {
  name: 'Felhasználó Név',
  email: 'felhasznalo@email.com',
};

const activities = [
  {
    icon: 'bike',
    iconColor: '#22C55E',
    iconBgLight: '#D1FADF',
    iconBgDark: '#14532D',
    title: 'Keleti Biciklitároló',
    subtitle: 'Foglalás',
    date: '2023-08-15',
  },
  {
    icon: 'tools',
    iconColor: '#60A5FA',
    iconBgLight: '#DBEAFE',
    iconBgDark: '#1E3A8A',
    title: 'Bringaszerviz Kft.',
    subtitle: 'Időpontfoglalás',
    date: '2023-07-20',
  },
  {
    icon: 'bike',
    iconColor: '#22C55E',
    iconBgLight: '#D1FADF',
    iconBgDark: '#14532D',
    title: 'Nyugati Biciklitároló',
    subtitle: 'Foglalás',
    date: '2023-06-10',
  },
];

export default function ProfileScreen() {
  const [tab, setTab] = useState<'activity' | 'reviews'>('activity');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data?.user?.email ?? null);
      setUsername(data?.user?.user_metadata?.username ?? null);
      setLoading(false);
    });
  }, []);

  // Theme colors
  const cardBg = useThemeColor({ light: '#F8FAFC', dark: '#18181B' }, 'background');
  const cardInnerBg = useThemeColor({ light: '#fff', dark: '#232329' }, 'background');
  const borderColor = useThemeColor({ light: '#E5E7EB', dark: '#27272A' }, 'background');
  const borderLogout = useThemeColor({ light: '#FCA5A5', dark: '#7F1D1D' }, 'background');
  const textPrimary = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({ light: '#64748B', dark: '#A1A1AA' }, 'text');
  const tabBg = useThemeColor({ light: '#F1F5F9', dark: '#232329' }, 'background');
  const tabActiveBg = cardInnerBg;
  const tabInactiveText = textSecondary;
  const tabActiveText = textPrimary;
  const avatarBg = useThemeColor({ light: '#E5E7EB', dark: '#27272A' }, 'background');
  const iconSettings = useThemeColor({ light: '#0F172A', dark: '#F1F5F9' }, 'text');
  const iconLogout = useThemeColor({ light: '#EF4444', dark: '#F87171' }, 'text');

  async function handleLogout() {
    setLoggingOut(true);
    await supabase.auth.signOut();
    setLoggingOut(false);
    // The AuthGate in _layout.tsx will redirect to /login
  }

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={{ textAlign: 'center', marginTop: 40 }}>Betöltés...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <ThemedView style={[styles.profileCard, { backgroundColor: cardBg, shadowColor: '#000' }]}> 
          <View style={styles.avatarRow}>
            <View style={[styles.avatarCircle, { backgroundColor: avatarBg }]}> 
              <Ionicons name="person-outline" size={48} color={textSecondary} />
            </View>
            <View style={styles.profileInfo}>
              <ThemedText style={[styles.profileName, { color: textPrimary }]} type="subtitle">{username ?? userEmail ?? '—'}</ThemedText>
              <ThemedText style={[styles.profileEmail, { color: textSecondary }]}>{userEmail ?? '—'}</ThemedText>
            </View>
          </View>
          <View style={styles.profileButtonsRow}>
            <TouchableOpacity style={[styles.settingsButton, { backgroundColor: cardInnerBg, borderColor }]} onPress={() => router.push('/settings')}>
              <Ionicons name="settings-outline" size={18} color={iconSettings} style={{ marginRight: 6 }} />
              <ThemedText style={[styles.settingsButtonText, { color: iconSettings }]}>Beállítások</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.logoutButton, { backgroundColor: cardInnerBg, borderColor: borderLogout }]} onPress={handleLogout} disabled={loggingOut}>
              <Ionicons name="log-out-outline" size={18} color={iconLogout} style={{ marginRight: 6 }} />
              <ThemedText style={[styles.logoutButtonText, { color: iconLogout }]}>{loggingOut ? 'Kijelentkezés...' : 'Kijelentkezés'}</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
        {/* Tabs */}
        <View style={[styles.tabsRow, { backgroundColor: tabBg }]}> 
          <TouchableOpacity style={[styles.tabButton, tab === 'activity' && { backgroundColor: tabActiveBg }]} onPress={() => setTab('activity')}>
            <ThemedText style={[styles.tabButtonText, { color: tabInactiveText }, tab === 'activity' && { color: tabActiveText, fontWeight: 'bold' }]}>Aktivitás</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabButton, tab === 'reviews' && { backgroundColor: tabActiveBg }]} onPress={() => setTab('reviews')}>
            <ThemedText style={[styles.tabButtonText, { color: tabInactiveText }, tab === 'reviews' && { color: tabActiveText, fontWeight: 'bold' }]}>Értékeléseim</ThemedText>
          </TouchableOpacity>
        </View>
        {/* Activity List */}
        {tab === 'activity' && (
          <View style={styles.activityList}>
            {activities.map((item, idx) => {
              const iconBg = useThemeColor({ light: item.iconBgLight, dark: item.iconBgDark }, 'background');
              return (
                <ThemedView key={idx} style={[styles.activityCard, { backgroundColor: cardInnerBg, shadowColor: '#000' }]}> 
                  <View style={[styles.activityIconCircle, { backgroundColor: iconBg }]}> 
                    <MaterialCommunityIcons name={item.icon} size={22} color={item.iconColor} />
                  </View>
                  <View style={styles.activityInfo}>
                    <ThemedText style={[styles.activityTitle, { color: textPrimary }]}>{item.title}</ThemedText>
                    <ThemedText style={[styles.activitySubtitle, { color: textSecondary }]}>{item.subtitle}</ThemedText>
                  </View>
                  <ThemedText style={[styles.activityDate, { color: textSecondary }]}>{item.date}</ThemedText>
                </ThemedView>
              );
            })}
          </View>
        )}
        {/* Reviews Tab Placeholder */}
        {tab === 'reviews' && (
          <View style={styles.reviewsPlaceholder}>
            <ThemedText style={{ color: textSecondary }}>Nincsenek értékelések.</ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  profileCard: {
    borderRadius: 16,
    padding: 20,
    marginTop: 10,
    marginBottom: 18,
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 15,
  },
  profileButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    marginTop: 4,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderWidth: 1,
    flex: 1,
    minWidth: 0,
  },
  settingsButtonText: {
    fontWeight: '500',
    fontSize: 15,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderWidth: 1,
    flex: 1,
    minWidth: 0,
  },
  logoutButtonText: {
    fontWeight: '500',
    fontSize: 15,
  },
  tabsRow: {
    flexDirection: 'row',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  tabButtonText: {
    fontWeight: '500',
    fontSize: 15,
  },
  activityList: {
    gap: 10,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    marginBottom: 2,
  },
  activityIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 14,
  },
  activityDate: {
    fontSize: 13,
    marginLeft: 8,
  },
  reviewsPlaceholder: {
    alignItems: 'center',
    padding: 32,
  },
});
