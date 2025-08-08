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
import { useLanguageStore } from '@/stores/languageStore';
import { useProfileStore } from '@/stores/profileStore';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

const { height: screenHeight } = Dimensions.get('window');

export default function SettingsScreen() {
  console.log('🔥🔥🔥 SETTINGS SCREEN LOADED - CORRECT FILE 🔥🔥🔥');
  const { t } = useTranslation();
  const { user, signOut } = useAuthStore();
  const { themeMode, setThemeMode, currentTheme } = useThemeStore();
  const { language, setLanguage, actualLanguage } = useLanguageStore();
  const { deleteAccount } = useProfileStore();
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const modalAnim = useRef(new Animated.Value(screenHeight)).current;
  const languageModalAnim = useRef(new Animated.Value(screenHeight)).current;
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
    console.log('🔥 Language modal opening...');
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

  // Optimized condition for bottom nav bar
  const shouldShowBottomBar = (showThemeModal || showLanguageModal) && insets.bottom > 0;

  const handleSignOut = async () => {
    Alert.alert(
      t('auth.logout.title'),
      t('auth.logout.message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('auth.logout.button'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/login');
            } catch (error) {
              Alert.alert(t('common.error'), t('auth.logout.error'));
            }
          }
        }
      ]
    );
  };

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
                          [
                            {
                              text: t('common.ok'),
                              // Ne navigáljunk manuálisan, az auth state változás automatikusan kezelje
                              onPress: () => {}
                            }
                          ]
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
              {t('settings.title')}
            </ThemedText>
            <View style={styles.headerPlaceholder} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* User Profile Section */}
          {user && (
            <>
              <SectionHeader title={t('settings.profile')} />
              <View style={styles.section}>
                <SettingsItem
                  icon="person-outline"
                  title={t('settings.profileInfo')}
                  subtitle={user.email || 'Nem elérhető'}
                  onPress={() => router.push('/profile-info')}
                />
                <SettingsItem
                  icon="key-outline"
                  title={t('settings.changePassword')}
                  subtitle={t('settings.changePasswordSubtitle')}
                  onPress={() => router.push('/change-password')}
                />
                <SettingsItem
                  icon="notifications-outline"
                  title={t('settings.notifications')}
                  subtitle={t('settings.notificationsSubtitle')}
                  onPress={() => Alert.alert(t('settings.notifications'), t('settings.notificationsComingSoon'))}
                />
              </View>
            </>
          )}

          {/* App Preferences */}
          <SectionHeader title={t('settings.appSettings')} />
          <View style={styles.section}>
            <SettingsItem
              icon="moon-outline"
              title={t('settings.theme')}
              subtitle={themeLabel}
              onPress={openThemeModal}
            />
            <SettingsItem
              icon="language-outline"
              title={t('settings.language')}
              subtitle={languageLabel}
              onPress={() => {
                console.log('🌍 Language button pressed');
                openLanguageModal();
              }}
            />
            <SettingsItem
              icon="location-outline"
              title={t('settings.location')}
              subtitle={t('settings.locationSubtitle')}
              onPress={() => Alert.alert(t('settings.location'), t('settings.locationComingSoon'))}
            />
          </View>

          {/* Support & Info */}
          <SectionHeader title={t('settings.support')} />
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
              icon="document-text-outline"
              title={t('settings.terms')}
              onPress={() => router.push('/terms')}
            />
            <SettingsItem
              icon="shield-outline"
              title={t('settings.privacy')}
              onPress={() => router.push('/privacy')}
            />
            <SettingsItem
              icon="information-circle-outline"
              title={t('settings.about')}
              subtitle={t('settings.aboutSubtitle')}
              onPress={() => Alert.alert('ParkSafe', t('settings.aboutMessage'))}
            />
          </View>

          {/* Account Actions */}
          {user && (
            <>
              <SectionHeader title={t('settings.account')} />
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
                  onPress={handleSignOut}
                  activeOpacity={0.7}
                >
                  <View style={styles.settingsItemLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: borderColor }]}>
                      <Ionicons name="log-out-outline" size={20} color={textColor} />
                    </View>
                    <View style={styles.textContainer}>
                      <ThemedText style={[styles.settingsTitle, { color: textColor }]}>
                        {t('auth.logout.button')}
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
                      onPress={() => {
                        setLanguage(option.value);
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
                        console.log('🌍 Setting language to:', option.value);
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