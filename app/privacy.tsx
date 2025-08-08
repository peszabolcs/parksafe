import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useThemeStore } from "@/stores/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PrivacyScreen() {
  const { t } = useTranslation();
  const { currentTheme } = useThemeStore();
  const isDarkMode = currentTheme === "dark";

  // Theme colors
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
  const secondaryTextColor = useThemeColor(
    { light: "#6B7280", dark: "#9CA3AF" },
    "text"
  );
  const primaryColor = useThemeColor(
    { light: "#3B82F6", dark: "#60A5FA" },
    "tint"
  );

  const Section = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <View
      style={[styles.section, { backgroundColor: cardBackground, borderColor }]}
    >
      <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
        {title}
      </ThemedText>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  const Paragraph = ({ children }: { children: React.ReactNode }) => (
    <ThemedText style={[styles.paragraph, { color: secondaryTextColor }]}>
      {children}
    </ThemedText>
  );

  const ListItem = ({ children }: { children: React.ReactNode }) => (
    <View style={styles.listItem}>
      <ThemedText style={[styles.bullet, { color: primaryColor }]}>
        •
      </ThemedText>
      <ThemedText style={[styles.listItemText, { color: secondaryTextColor }]}>
        {children}
      </ThemedText>
    </View>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <LinearGradient
        colors={isDarkMode ? ["#0F172A", "#1E293B"] : ["#22C55E", "#16A34A"]}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <ThemedText style={styles.headerTitle}>
              {t("privacy.title")}
            </ThemedText>
            <View style={styles.headerRight} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Last Updated */}
        <View style={styles.lastUpdated}>
          <ThemedText
            style={[styles.lastUpdatedText, { color: secondaryTextColor }]}
          >
            {t("privacy.lastUpdated")}
          </ThemedText>
        </View>

        <Section title={t("privacy.sections.introduction.title")}>
          <Paragraph>{t("privacy.sections.introduction.paragraph1")}</Paragraph>
          <Paragraph>{t("privacy.sections.introduction.paragraph2")}</Paragraph>
        </Section>

        <Section title={t("privacy.sections.dataCollection.title")}>
          <Paragraph>{t("privacy.sections.dataCollection.intro")}</Paragraph>
          <ListItem>
            {t("privacy.sections.dataCollection.items.registration")}
          </ListItem>
          <ListItem>
            {t("privacy.sections.dataCollection.items.location")}
          </ListItem>
          <ListItem>
            {t("privacy.sections.dataCollection.items.device")}
          </ListItem>
          <ListItem>
            {t("privacy.sections.dataCollection.items.usage")}
          </ListItem>
          <ListItem>
            {t("privacy.sections.dataCollection.items.community")}
          </ListItem>
        </Section>

        <Section title={t("privacy.sections.dataUsage.title")}>
          <Paragraph>{t("privacy.sections.dataUsage.intro")}</Paragraph>
          <ListItem>{t("privacy.sections.dataUsage.items.service")}</ListItem>
          <ListItem>
            {t("privacy.sections.dataUsage.items.experience")}
          </ListItem>
          <ListItem>
            {t("privacy.sections.dataUsage.items.communication")}
          </ListItem>
          <ListItem>{t("privacy.sections.dataUsage.items.security")}</ListItem>
          <ListItem>{t("privacy.sections.dataUsage.items.analytics")}</ListItem>
        </Section>

        <Section title={t("privacy.sections.locationData.title")}>
          <Paragraph>{t("privacy.sections.locationData.intro")}</Paragraph>
          <ListItem>
            {t("privacy.sections.locationData.items.permission")}
          </ListItem>
          <ListItem>
            {t("privacy.sections.locationData.items.processing")}
          </ListItem>
          <ListItem>
            {t("privacy.sections.locationData.items.history")}
          </ListItem>
          <ListItem>
            {t("privacy.sections.locationData.items.sharing")}
          </ListItem>
          <ListItem>
            {t("privacy.sections.locationData.items.offline")}
          </ListItem>
        </Section>

        <Section title={t("privacy.sections.dataSecurity.title")}>
          <Paragraph>{t("privacy.sections.dataSecurity.intro")}</Paragraph>
          <ListItem>
            {t("privacy.sections.dataSecurity.items.encryption")}
          </ListItem>
          <ListItem>
            {t("privacy.sections.dataSecurity.items.servers")}
          </ListItem>
          <ListItem>{t("privacy.sections.dataSecurity.items.access")}</ListItem>
          <ListItem>{t("privacy.sections.dataSecurity.items.audits")}</ListItem>
          <ListItem>{t("privacy.sections.dataSecurity.items.backup")}</ListItem>
        </Section>

        <Section title={t("privacy.sections.dataSharing.title")}>
          <Paragraph>{t("privacy.sections.dataSharing.intro")}</Paragraph>
          <ListItem>{t("privacy.sections.dataSharing.items.legal")}</ListItem>
          <ListItem>
            {t("privacy.sections.dataSharing.items.providers")}
          </ListItem>
          <ListItem>{t("privacy.sections.dataSharing.items.payment")}</ListItem>
          <ListItem>{t("privacy.sections.dataSharing.items.consent")}</ListItem>
        </Section>

        <Section title={t("privacy.sections.communityContent.title")}>
          <Paragraph>{t("privacy.sections.communityContent.intro")}</Paragraph>
          <ListItem>
            {t("privacy.sections.communityContent.items.public")}
          </ListItem>
          <ListItem>
            {t("privacy.sections.communityContent.items.username")}
          </ListItem>
          <ListItem>
            {t("privacy.sections.communityContent.items.moderation")}
          </ListItem>
          <ListItem>
            {t("privacy.sections.communityContent.items.removal")}
          </ListItem>
          <ListItem>
            {t("privacy.sections.communityContent.items.deletion")}
          </ListItem>
        </Section>

        <Section title={t("privacy.sections.cookiesTracking.title")}>
          <Paragraph>{t("privacy.sections.cookiesTracking.intro")}</Paragraph>
          <ListItem>
            {t("privacy.sections.cookiesTracking.items.session")}
          </ListItem>
          <ListItem>
            {t("privacy.sections.cookiesTracking.items.settings")}
          </ListItem>
          <ListItem>
            {t("privacy.sections.cookiesTracking.items.performance")}
          </ListItem>
          <ListItem>
            {t("privacy.sections.cookiesTracking.items.errors")}
          </ListItem>
        </Section>

        <Section title={t("privacy.sections.userRights.title")}>
          <Paragraph>{t("privacy.sections.userRights.intro")}</Paragraph>
          <ListItem>{t("privacy.sections.userRights.items.access")}</ListItem>
          <ListItem>
            {t("privacy.sections.userRights.items.rectification")}
          </ListItem>
          <ListItem>{t("privacy.sections.userRights.items.erasure")}</ListItem>
          <ListItem>
            {t("privacy.sections.userRights.items.restriction")}
          </ListItem>
          <ListItem>
            {t("privacy.sections.userRights.items.portability")}
          </ListItem>
          <ListItem>
            {t("privacy.sections.userRights.items.objection")}
          </ListItem>
        </Section>

        <Section title={t("privacy.sections.dataRetention.title")}>
          <Paragraph>{t("privacy.sections.dataRetention.intro")}</Paragraph>
          <ListItem>
            {t("privacy.sections.dataRetention.items.account")}
          </ListItem>
          <ListItem>
            {t("privacy.sections.dataRetention.items.transactions")}
          </ListItem>
          <ListItem>
            {t("privacy.sections.dataRetention.items.location")}
          </ListItem>
          <ListItem>
            {t("privacy.sections.dataRetention.items.community")}
          </ListItem>
          <ListItem>
            {t("privacy.sections.dataRetention.items.statistics")}
          </ListItem>
        </Section>

        <Section title={t("privacy.sections.minorProtection.title")}>
          <Paragraph>{t("privacy.sections.minorProtection.intro")}</Paragraph>
          <ListItem>
            {t("privacy.sections.minorProtection.items.consent")}
          </ListItem>
          <ListItem>
            {t("privacy.sections.minorProtection.items.functionality")}
          </ListItem>
          <ListItem>
            {t("privacy.sections.minorProtection.items.protection")}
          </ListItem>
          <ListItem>
            {t("privacy.sections.minorProtection.items.reporting")}
          </ListItem>
        </Section>

        <Section title={t("privacy.sections.contact.title")}>
          <Paragraph>{t("privacy.sections.contact.intro")}</Paragraph>
          <ListItem>{t("privacy.sections.contact.items.email")}</ListItem>
          <ListItem>{t("privacy.sections.contact.items.address")}</ListItem>
          <ListItem>{t("privacy.sections.contact.items.phone")}</ListItem>
          <ListItem>{t("privacy.sections.contact.items.response")}</ListItem>
        </Section>

        <Section title={t("privacy.sections.policyChanges.title")}>
          <Paragraph>{t("privacy.sections.policyChanges.intro")}</Paragraph>
          <ListItem>
            {t("privacy.sections.policyChanges.items.notification")}
          </ListItem>
          <ListItem>
            {t("privacy.sections.policyChanges.items.display")}
          </ListItem>
          <ListItem>
            {t("privacy.sections.policyChanges.items.acceptance")}
          </ListItem>
          <ListItem>
            {t("privacy.sections.policyChanges.items.effective")}
          </ListItem>
        </Section>

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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
    marginRight: 32,
  },
  headerRight: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  lastUpdated: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: "center",
  },
  lastUpdatedText: {
    fontSize: 12,
    fontStyle: "italic",
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  sectionContent: {
    gap: 12,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
  },
  listItem: {
    flexDirection: "row",
    marginBottom: 8,
  },
  bullet: {
    fontSize: 14,
    marginRight: 8,
    fontWeight: "600",
    marginTop: 1,
  },
  listItemText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  bottomSpacing: {
    height: 100,
  },
});
