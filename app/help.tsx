import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useThemeStore } from '@/stores/themeStore';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

type FAQItem = {
  question: string;
  answer: string;
};

export default function HelpScreen() {
  const { t } = useTranslation();
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const { currentTheme } = useThemeStore();
  const isDarkMode = currentTheme === 'dark';
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = useThemeColor({ light: '#fff', dark: '#1F2937' }, 'background');
  const borderColor = useThemeColor({ light: '#E5E7EB', dark: '#374151' }, 'background');
  const secondaryTextColor = useThemeColor({ light: '#6B7280', dark: '#9CA3AF' }, 'text');
  const primaryColor = useThemeColor({ light: '#3B82F6', dark: '#60A5FA' }, 'tint');

  const faqItems: FAQItem[] = [
    {
      question: t('help.questions.whatIsParkSafe'),
      answer: t('help.questions.whatIsParkSafeAnswer')
    },
    {
      question: t('help.questions.howSearchWorks'),
      answer: t('help.questions.howSearchWorksAnswer')
    },
    {
      question: t('help.questions.isFree'),
      answer: t('help.questions.isFreeAnswer')
    },
    {
      question: t('help.questions.premiumFeatures'),
      answer: t('help.questions.premiumFeaturesAnswer')
    },
    {
      question: t('help.questions.addLocation'),
      answer: t('help.questions.addLocationAnswer')
    },
    {
      question: t('help.questions.reportError'),
      answer: t('help.questions.reportErrorAnswer')
    },
    {
      question: t('help.questions.rateLocation'),
      answer: t('help.questions.rateLocationAnswer')
    },
    {
      question: t('help.questions.locationPermission'),
      answer: t('help.questions.locationPermissionAnswer')
    },
    {
      question: t('help.questions.offlineMode'),
      answer: t('help.questions.offlineModeAnswer')
    },
    {
      question: t('help.questions.dataProtection'),
      answer: t('help.questions.dataProtectionAnswer')
    }
  ];

  const handleContactPress = () => {
    Linking.openURL('mailto:perjesidev@gmail.com?subject=ParkSafe Támogatás');
  };

  const toggleExpanded = (index: number) => {
    setExpandedItem(expandedItem === index ? null : index);
  };

  const SectionHeader = ({ title, icon }: { title: string; icon: string }) => (
    <View style={[styles.sectionHeader, { borderBottomColor: borderColor }]}>
      <View style={styles.sectionHeaderLeft}>
        <View style={[styles.sectionIcon, { backgroundColor: primaryColor }]}>
          <Ionicons name={icon as any} size={20} color="#FFFFFF" />
        </View>
        <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
          {title}
        </ThemedText>
      </View>
    </View>
  );

  const ContactItem = ({ icon, title, subtitle, onPress }: {
    icon: string;
    title: string;
    subtitle: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.contactItem, { backgroundColor: cardBackground, borderColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.contactItemLeft}>
        <View style={[styles.contactIcon, { backgroundColor: borderColor }]}>
          <Ionicons name={icon as any} size={20} color={primaryColor} />
        </View>
        <View style={styles.contactTextContainer}>
          <ThemedText style={[styles.contactTitle, { color: textColor }]}>
            {title}
          </ThemedText>
          <ThemedText style={[styles.contactSubtitle, { color: secondaryTextColor }]}>
            {subtitle}
          </ThemedText>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={secondaryTextColor} />
    </TouchableOpacity>
  );

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
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <ThemedText style={styles.headerTitle}>
              {t('help.title')}
            </ThemedText>
            <View style={styles.headerRight} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* FAQ Section */}
          <SectionHeader title={t('help.faq')} icon="help-circle" />
          <View style={styles.section}>
            {faqItems.map((item, index) => (
              <View key={index} style={[styles.faqItem, { backgroundColor: cardBackground, borderColor }]}>
                <TouchableOpacity
                  style={styles.faqQuestion}
                  onPress={() => toggleExpanded(index)}
                  activeOpacity={0.7}
                >
                  <ThemedText style={[styles.questionText, { color: textColor }]}>
                    {item.question}
                  </ThemedText>
                  <Ionicons
                    name={expandedItem === index ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={secondaryTextColor}
                  />
                </TouchableOpacity>
                {expandedItem === index && (
                  <View style={[styles.faqAnswer, { borderTopColor: borderColor }]}>
                    <ThemedText style={[styles.answerText, { color: secondaryTextColor }]}>
                      {item.answer}
                    </ThemedText>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Contact Section */}
          <SectionHeader title={t('help.contact')} icon="mail" />
          <View style={styles.section}>
            <ContactItem
              icon="mail"
              title={t('help.emailSupport')}
              subtitle="perjesidev@gmail.com"
              onPress={handleContactPress}
            />
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginRight: 32,
  },
  headerRight: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginTop: 20,
    borderBottomWidth: 1,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  faqItem: {
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    marginTop: 8,
  },
  answerText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  contactItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactTextContainer: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  contactSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  infoCard: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  bottomSpacing: {
    height: 100,
  },
});