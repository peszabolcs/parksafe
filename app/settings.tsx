import React, { useState, useRef, useCallback, useMemo } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Alert, Modal, Dimensions, Animated, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { useProfileStore } from '@/stores/profileStore';
import { router } from 'expo-router';

const { height: screenHeight } = Dimensions.get('window');

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore();
  const { themeMode, setThemeMode, currentTheme } = useThemeStore();
  const { deleteAccount } = useProfileStore();
  const [showThemeModal, setShowThemeModal] = useState(false);
  const modalAnim = useRef(new Animated.Value(screenHeight)).current;
  const insets = useSafeAreaInsets();
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = useThemeColor({ light: '#fff', dark: '#1F2937' }, 'background');
  const borderColor = useThemeColor({ light: '#E5E7EB', dark: '#374151' }, 'background');
  const secondaryTextColor = useThemeColor({ light: '#6B7280', dark: '#9CA3AF' }, 'text');
  const shadowColor = useThemeColor({ light: '#000', dark: '#000' }, 'text');
  const isDarkMode = currentTheme === 'dark';

  // Memoized theme options and label
  const themeOptions = useMemo(() => [
    { value: 'light' as const, label: 'Világos', icon: 'sunny', description: 'Világos téma használata' },
    { value: 'dark' as const, label: 'Sötét', icon: 'moon', description: 'Sötét téma használata' },
    { value: 'system' as const, label: 'Rendszer', icon: 'phone-portrait', description: 'Rendszer beállítás követése' },
  ], []);

  const themeLabel = useMemo(() => {
    const selected = themeOptions.find(option => option.value === themeMode);
    return selected?.label || 'Rendszer';
  }, [themeMode, themeOptions]);

  // Animation functions for modal
  const openThemeModal = useCallback(() => {
    setShowThemeModal(true);
    Animated.timing(modalAnim, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [modalAnim]);

  const closeThemeModal = useCallback(() => {
    Animated.timing(modalAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowThemeModal(false);
      modalAnim.setValue(screenHeight);
    });
  }, [modalAnim]);

  // Interpolate values from single animation
  const backgroundOpacity = modalAnim.interpolate({
    inputRange: [0, screenHeight],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // Optimized condition for bottom nav bar
  const shouldShowBottomBar = showThemeModal && insets.bottom > 0;

  const handleSignOut = async () => {
    Alert.alert(
      'Kijelentkezés',
      'Biztosan ki szeretne jelentkezni?',
      [
        { text: 'Mégse', style: 'cancel' },
        { 
          text: 'Kijelentkezés', 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/login');
            } catch (error) {
              Alert.alert('Hiba', 'Nem sikerült kijelentkezni');
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Fiók törlése',
      'Ez a művelet véglegesen törli a fiókját és az összes kapcsolódó adatot. Ez a művelet nem vonható vissza.\n\nBiztosan törölni szeretné a fiókját?',
      [
        { text: 'Mégse', style: 'cancel' },
        { 
          text: 'Fiók törlése', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Utolsó megerősítés',
              'Ez tényleg az utolsó lehetőség a visszalépésre. A fiók törlése után minden adat elvész.\n\nValóban törölni szeretné a fiókját?',
              [
                { text: 'Mégsem', style: 'cancel' },
                {
                  text: 'Igen, törlés',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const success = await deleteAccount();
                      if (success) {
                        Alert.alert(
                          'Fiók törölve',
                          'A fiók sikeresen törölve lett.',
                          [
                            {
                              text: 'OK',
                              // Ne navigáljunk manuálisan, az auth state változás automatikusan kezelje
                              onPress: () => {}
                            }
                          ]
                        );
                      }
                    } catch (error) {
                      Alert.alert('Hiba', 'Nem sikerült törölni a fiókot');
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const SettingsItem = useCallback(({ icon, title, subtitle, onPress, showArrow = true, customContent }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showArrow?: boolean;
    customContent?: React.ReactNode;
  }) => (
    <TouchableOpacity
      style={[styles.settingsItem, { backgroundColor: cardBackground, borderColor }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingsItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: borderColor }]}>
          <Ionicons name={icon as any} size={20} color={textColor} />
        </View>
        <View style={styles.textContainer}>
          <ThemedText style={[styles.settingsTitle, { color: textColor }]}>
            {title}
          </ThemedText>
          {subtitle && (
            <ThemedText style={[styles.settingsSubtitle, { color: secondaryTextColor }]}>
              {subtitle}
            </ThemedText>
          )}
        </View>
      </View>
      <View style={styles.settingsItemRight}>
        {customContent}
        {showArrow && onPress && (
          <Ionicons name="chevron-forward" size={20} color={secondaryTextColor} />
        )}
      </View>
    </TouchableOpacity>
  ), [cardBackground, borderColor, textColor, secondaryTextColor]);

  const SectionHeader = useCallback(({ title }: { title: string }) => (
    <ThemedText style={[styles.sectionHeader, { color: textColor }]}>
      {title}
    </ThemedText>
  ), [textColor]);

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
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
            <ThemedText style={styles.headerTitle}>
              Beállítások
            </ThemedText>
            <View style={styles.headerPlaceholder} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* User Profile Section */}
          {user && (
            <>
              <SectionHeader title="Profil" />
              <View style={styles.section}>
                <SettingsItem
                  icon="person-outline"
                  title="Profilinformációk"
                  subtitle={user.email || 'Nem elérhető'}
                  onPress={() => router.push('/profile-info')}
                />
                <SettingsItem
                  icon="key-outline"
                  title="Jelszó módosítás"
                  subtitle="Fiók biztonságának növelése"
                  onPress={() => router.push('/change-password')}
                />
                <SettingsItem
                  icon="notifications-outline"
                  title="Értesítések"
                  subtitle="Értesítési beállítások kezelése"
                  onPress={() => Alert.alert('Értesítések', 'Értesítési beállítások hamarosan elérhetőek')}
                />
              </View>
            </>
          )}

          {/* App Preferences */}
          <SectionHeader title="Alkalmazás beállítások" />
          <View style={styles.section}>
            <SettingsItem
              icon="moon-outline"
              title="Téma"
              subtitle={themeLabel}
              onPress={openThemeModal}
            />
            <SettingsItem
              icon="language-outline"
              title="Nyelv"
              subtitle="Magyar"
              onPress={() => Alert.alert('Nyelv', 'Nyelvi beállítások hamarosan elérhetőek')}
            />
            <SettingsItem
              icon="location-outline"
              title="Hely"
              subtitle="Helymeghatározás beállítások"
              onPress={() => Alert.alert('Hely', 'Helymeghatározási beállítások hamarosan elérhetőek')}
            />
          </View>

          {/* Support & Info */}
          <SectionHeader title="Támogatás és információk" />
          <View style={styles.section}>
            <SettingsItem
              icon="help-circle-outline"
              title="Súgó és támogatás"
              subtitle="GYIK és kapcsolat"
              onPress={() => router.push('/help')}
            />
            <SettingsItem
              icon="document-text-outline"
              title="Felhasználási feltételek"
              onPress={() => router.push('/terms')}
            />
            <SettingsItem
              icon="shield-outline"
              title="Adatvédelem"
              onPress={() => router.push('/privacy')}
            />
            <SettingsItem
              icon="information-circle-outline"
              title="Az alkalmazásról"
              subtitle="Verzió 1.0.0"
              onPress={() => Alert.alert('ParkSafe', 'ParkSafe v1.0.0\nBiciklitároló és szerviz kereső alkalmazás')}
            />
          </View>

          {/* Account Actions */}
          {user && (
            <>
              <SectionHeader title="Fiók" />
              <View style={styles.section}>
                <TouchableOpacity
                  style={[styles.settingsItem, styles.dangerItem, { backgroundColor: cardBackground, borderColor }]}
                  onPress={handleDeleteAccount}
                  activeOpacity={0.7}
                >
                  <View style={styles.settingsItemLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: '#FEF2F2' }]}>
                      <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </View>
                    <View style={styles.textContainer}>
                      <ThemedText style={[styles.settingsTitle, { color: '#EF4444' }]}>
                        Fiók törlése
                      </ThemedText>
                    </View>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.settingsItem, { backgroundColor: cardBackground, borderColor }]}
                  onPress={handleSignOut}
                  activeOpacity={0.7}
                >
                  <View style={styles.settingsItemLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: borderColor }]}>
                      <Ionicons name="log-out-outline" size={20} color={textColor} />
                    </View>
                    <View style={styles.textContainer}>
                      <ThemedText style={[styles.settingsTitle, { color: textColor }]}>
                        Kijelentkezés
                      </ThemedText>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={styles.bottomSpacing} />
        </ScrollView>

      {/* Bottom Navigation Bar - Optimized rendering */}
      {shouldShowBottomBar && (
        <Animated.View style={[
          styles.bottomNavBar, 
          { 
            height: insets.bottom, 
            backgroundColor: cardBackground,
            opacity: backgroundOpacity
          }
        ]} />
      )}

      {/* Theme Selection Modal */}
      <Modal
        visible={showThemeModal}
        animationType="none"
        transparent
        onRequestClose={closeThemeModal}
      >
        <Animated.View
          style={{ 
            flex: 1, 
            backgroundColor: 'rgba(0,0,0,0.25)', 
            justifyContent: 'flex-end',
            opacity: backgroundOpacity
          }}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={closeThemeModal}
          />
          <Animated.View
            style={{ 
              backgroundColor: cardBackground, 
              borderTopLeftRadius: 18, 
              borderTopRightRadius: 18, 
              padding: 20, 
              minHeight: 350,
              paddingBottom: 20,
              transform: [{ translateY: modalAnim }]
            }}
          >
            <Pressable
              style={{ flex: 1 }}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
                <ThemedText style={[styles.modalTitle, { color: textColor }]}>
                  Téma választás
                </ThemedText>
                <TouchableOpacity
                  onPress={closeThemeModal}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={textColor} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalBody}>
                {themeOptions.map((option) => {
                  const isSelected = themeMode === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.themeOption,
                        { borderColor },
                        isSelected && { backgroundColor: borderColor }
                      ]}
                      onPress={() => {
                        setThemeMode(option.value);
                        closeThemeModal();
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.themeOptionLeft}>
                        <View style={[
                          styles.themeIconContainer,
                          { backgroundColor: isSelected ? '#3B82F6' : borderColor }
                        ]}>
                          <Ionicons 
                            name={option.icon as any} 
                            size={20} 
                            color={isSelected ? '#FFFFFF' : textColor} 
                          />
                        </View>
                        <View style={styles.themeTextContainer}>
                          <ThemedText style={[styles.themeOptionTitle, { color: textColor }]}>
                            {option.label}
                          </ThemedText>
                          <ThemedText style={[styles.themeOptionDescription, { color: secondaryTextColor }]}>
                            {option.description}
                          </ThemedText>
                        </View>
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark" size={20} color="#3B82F6" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </Modal>
    </ThemedView>
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
    paddingTop: 10,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 32,
    marginBottom: 12,
    marginHorizontal: 20,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 8,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingsSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  dangerItem: {
    borderColor: '#FECACA',
  },
  bottomSpacing: {
    height: 100,
  },
  bottomNavBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  themeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  themeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  themeTextContainer: {
    flex: 1,
  },
  themeOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  themeOptionDescription: {
    fontSize: 14,
    lineHeight: 18,
  },

});
