import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Alert, Modal, Dimensions, Animated, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useThemeStore } from '@/stores/themeStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useAuthStore } from '@/stores/authStore';
import { useProfileStore } from '@/stores/profileStore';
import { useTranslation } from 'react-i18next';
import { onboardingDebug } from '@/lib/onboardingDebug';

const { height: screenHeight } = Dimensions.get('window');


export default function ProfileScreen() {
  const { t } = useTranslation();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const modalAnim = useRef(new Animated.Value(screenHeight)).current;
  const languageModalAnim = useRef(new Animated.Value(screenHeight)).current;
  const { user, signOut } = useAuthStore();
  const { themeMode, setThemeMode, currentTheme } = useThemeStore();
  const { language, setLanguage } = useLanguageStore();
  const { profile, loadProfile, deleteAccount } = useProfileStore();

  // Load profile when user changes
  useEffect(() => {
    if (user?.id) {
      loadProfile(user.id);
    }
  }, [user?.id, loadProfile]);

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = useThemeColor({ light: '#fff', dark: '#1F2937' }, 'background');
  const borderColor = useThemeColor({ light: '#E5E7EB', dark: '#374151' }, 'background');
  const textColor = useThemeColor({}, 'text');
  const secondaryTextColor = useThemeColor({ light: '#6B7280', dark: '#9CA3AF' }, 'text');
  const avatarBg = useThemeColor({ light: '#E5E7EB', dark: '#27272A' }, 'background');
  const isDarkMode = currentTheme === 'dark';

  // Memoized theme options and label
  const themeOptions = useMemo(() => [
    { value: 'light' as const, label: t('theme.light'), icon: 'sunny', description: t('theme.lightDescription') },
    { value: 'dark' as const, label: t('theme.dark'), icon: 'moon', description: t('theme.darkDescription') },
    { value: 'system' as const, label: t('theme.system'), icon: 'phone-portrait', description: t('theme.systemDescription') },
  ], [t]);

  const themeLabel = useMemo(() => {
    const selected = themeOptions.find(option => option.value === themeMode);
    return selected?.label || t('theme.system');
  }, [themeMode, themeOptions, t]);

  // Memoized language options and label
  const languageOptions = useMemo(() => [
    { value: 'hu' as const, label: t('language.hungarian'), icon: 'flag', description: t('language.hungarianDescription') },
    { value: 'en' as const, label: t('language.english'), icon: 'flag', description: t('language.englishDescription') },
    { value: 'system' as const, label: t('language.system'), icon: 'phone-portrait', description: t('language.systemDescription') },
  ], [t]);

  const languageLabel = useMemo(() => {
    const selected = languageOptions.find(option => option.value === language);
    return selected?.label || t('language.system');
  }, [language, languageOptions, t]);

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

  const openLanguageModal = useCallback(() => {
    setShowLanguageModal(true);
    Animated.timing(languageModalAnim, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [languageModalAnim]);

  const closeLanguageModal = useCallback(() => {
    Animated.timing(languageModalAnim, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowLanguageModal(false);
      languageModalAnim.setValue(screenHeight);
    });
  }, [languageModalAnim]);

  // Interpolate values from animations
  const backgroundOpacity = modalAnim.interpolate({
    inputRange: [0, screenHeight],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const languageBackgroundOpacity = languageModalAnim.interpolate({
    inputRange: [0, screenHeight],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  async function handleLogout() {
    Alert.alert(
      'Kijelentkezés',
      'Biztosan ki szeretne jelentkezni?',
      [
        { text: 'Mégse', style: 'cancel' },
        { 
          text: 'Kijelentkezés', 
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            try {
              await signOut();
              // The AuthGate in _layout.tsx will redirect to /login
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Hiba', 'Nem sikerült kijelentkezni');
            } finally {
              setLoggingOut(false);
            }
          }
        }
      ]
    );
  }

  const handleDeleteAccount = async () => {
    Alert.alert(
      t('settings.deleteAccount'),
      t('settings.deleteAccountConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('settings.deleteAccount'), 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              t('common.confirm'),
              t('settings.deleteAccountFinalConfirm'),
              [
                { text: t('common.cancel'), style: 'cancel' },
                {
                  text: t('settings.deleteAccountFinalButton'),
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const success = await deleteAccount();
                      if (success) {
                        Alert.alert(
                          t('settings.deleteAccount'),
                          t('settings.deleteAccountSuccess'),
                          [{ text: t('common.ok'), onPress: () => {} }]
                        );
                      }
                    } catch (error) {
                      Alert.alert(t('common.error'), t('settings.deleteAccountError'));
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

  const handleShowOnboarding = async () => {
    Alert.alert(
      t('settings.onboardingTest'),
      t('settings.onboardingTestMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.onboardingTestButton'),
          onPress: async () => {
            try {
              // Clear current user's onboarding flag
              if (user?.id) {
                await onboardingDebug.resetUserOnboarding(user.id);
              }
              // Navigate to onboarding
              router.push('/onboarding');
            } catch (error) {
              console.error('Error showing onboarding:', error);
              Alert.alert(t('common.error'), t('settings.onboardingTestError'));
            }
          }
        }
      ]
    );
  };

  const userEmail = user?.email;
  const username = profile?.username || profile?.full_name || user?.user_metadata?.full_name;

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

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <LinearGradient
        colors={isDarkMode ? ['#0F172A', '#1E293B'] : ['#22C55E', '#16A34A']}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <ThemedText style={styles.headerTitle}>
              {t('tabs.profile')}
            </ThemedText>
          </View>
        </SafeAreaView>
      </LinearGradient>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <ThemedView style={[styles.profileCard, { backgroundColor: cardBackground, shadowColor: '#000' }]}> 
          <View style={styles.avatarRow}>
            <View style={[styles.avatarCircle, { backgroundColor: avatarBg }]}> 
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatarImage}
                />
              ) : (
                <Ionicons name="person-outline" size={48} color={secondaryTextColor} />
              )}
            </View>
            <View style={styles.profileInfo}>
              <ThemedText style={[styles.profileName, { color: textColor }]} type="subtitle">
                {username ?? userEmail ?? '—'}
              </ThemedText>
              <ThemedText style={[styles.profileEmail, { color: secondaryTextColor }]}>
                {userEmail ?? '—'}
              </ThemedText>
            </View>
          </View>
        </ThemedView>

        {/* Main Settings */}
        <ThemedText style={[styles.sectionHeader, { color: textColor }]}>
          {t('settings.mainSettings')}
        </ThemedText>
        <View style={styles.section}>
          <SettingsItem
            icon="moon-outline"
            title={t('settings.theme')}
            subtitle={themeLabel}
            onPress={openThemeModal}
          />
          <SettingsItem
            icon="notifications-outline"
            title={t('settings.notifications')}
            subtitle={t('settings.notificationsSubtitle')}
            onPress={() => Alert.alert(t('settings.notifications'), t('settings.notificationsComingSoon'))}
          />
          <SettingsItem
            icon="language-outline"
            title={t('settings.language')}
            subtitle={languageLabel}
            onPress={openLanguageModal}
          />
          <SettingsItem
            icon="location-outline"
            title={t('settings.locationSettings')}
            subtitle={t('settings.locationSettingsSubtitle')}
            onPress={() => Alert.alert(t('settings.locationSettings'), t('settings.locationComingSoon'))}
          />
        </View>

        {/* Profile Settings */}
        <ThemedText style={[styles.sectionHeader, { color: textColor }]}>
          {t('settings.profileSettings')}
        </ThemedText>
        <View style={styles.section}>
          <SettingsItem
            icon="person-outline"
            title={t('settings.profileInfo')}
            subtitle={username || t('settings.profileInfoDefault')}
            onPress={() => router.push('/profile-info')}
          />
          <SettingsItem
            icon="key-outline"
            title={t('settings.changePassword')}
            subtitle={t('settings.changePasswordSubtitle')}
            onPress={() => router.push('/change-password')}
          />
        </View>

        {/* Additional Options */}
        <ThemedText style={[styles.sectionHeader, { color: textColor }]}>
          {t('settings.additionalOptions')}
        </ThemedText>
        <View style={styles.section}>
          <SettingsItem
            icon="chatbubble-ellipses-outline"
            title={t('settings.feedback')}
            subtitle={t('settings.feedbackSubtitle')}
            onPress={() => router.push('/feedback')}
          />
          <SettingsItem
            icon="help-circle-outline"
            title={t('settings.help')}
            subtitle={t('settings.helpSubtitle')}
            onPress={() => router.push('/help')}
          />
          <SettingsItem
            icon="shield-outline"
            title={t('settings.privacy')}
            onPress={() => router.push('/privacy')}
          />
          <SettingsItem
            icon="document-text-outline"
            title={t('settings.terms')}
            onPress={() => router.push('/terms')}
          />
        </View>

        {/* Development Section - Only in DEV mode */}
        {__DEV__ && (
          <>
            <ThemedText style={[styles.sectionHeader, { color: textColor }]}>
              {t('settings.developmentTools')}
            </ThemedText>
            <View style={styles.section}>
              <SettingsItem
                icon="play-outline"
                title={t('settings.onboardingTest')}
                subtitle={t('settings.onboardingTestSubtitle')}
                onPress={handleShowOnboarding}
              />
            </View>
          </>
        )}

        {/* Account Actions */}
        <ThemedText style={[styles.sectionHeader, { color: textColor }]}>
          {t('settings.account')}
        </ThemedText>
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
                  {t('settings.deleteAccount')}
                </ThemedText>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.settingsItem, { backgroundColor: cardBackground, borderColor }]}
            onPress={handleLogout}
            activeOpacity={0.7}
            disabled={loggingOut}
          >
            <View style={styles.settingsItemLeft}>
              <View style={[styles.iconContainer, { backgroundColor: borderColor }]}>
                <Ionicons name="log-out-outline" size={20} color={textColor} />
              </View>
              <View style={styles.textContainer}>
                <ThemedText style={[styles.settingsTitle, { color: textColor }]}>
                  {loggingOut ? t('auth.logout.button') + '...' : t('auth.logout.button')}
                </ThemedText>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

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
                  {t('theme.selection')}
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

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        animationType="none"
        transparent
        onRequestClose={closeLanguageModal}
      >
        <Animated.View
          style={{ 
            flex: 1, 
            backgroundColor: 'rgba(0,0,0,0.25)', 
            justifyContent: 'flex-end',
            opacity: languageBackgroundOpacity
          }}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={closeLanguageModal}
          />
          <Animated.View
            style={{ 
              backgroundColor: cardBackground, 
              borderTopLeftRadius: 18, 
              borderTopRightRadius: 18, 
              padding: 20, 
              minHeight: 350,
              paddingBottom: 20,
              transform: [{ translateY: languageModalAnim }]
            }}
          >
            <Pressable
              style={{ flex: 1 }}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
                <ThemedText style={[styles.modalTitle, { color: textColor }]}>
                  {t('language.selection')}
                </ThemedText>
                <TouchableOpacity
                  onPress={closeLanguageModal}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={textColor} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalBody}>
                {languageOptions.map((option) => {
                  const isSelected = language === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.themeOption,
                        { borderColor },
                        isSelected && { backgroundColor: borderColor }
                      ]}
                      onPress={async () => {
                        await setLanguage(option.value);
                        closeLanguageModal();
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
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    borderRadius: 16,
    padding: 20,
    margin: 20,
    marginBottom: 12,
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
