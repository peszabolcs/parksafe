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

export default function TermsScreen() {
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
              {t("terms.title")}
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
            {t("terms.lastUpdated")}
          </ThemedText>
        </View>

        <Section title={t("terms.sections.generalProvisions.title")}>
          <Paragraph>
            {t("terms.sections.generalProvisions.paragraph1")}
          </Paragraph>
          <Paragraph>
            {t("terms.sections.generalProvisions.paragraph2")}
          </Paragraph>
        </Section>

        <Section title={t("terms.sections.serviceDescription.title")}>
          <Paragraph>{t("terms.sections.serviceDescription.intro")}</Paragraph>
          <ListItem>
            {t("terms.sections.serviceDescription.items.mapDisplay")}
          </ListItem>
          <ListItem>
            {t("terms.sections.serviceDescription.items.realTimeInfo")}
          </ListItem>
          <ListItem>
            {t("terms.sections.serviceDescription.items.communityReviews")}
          </ListItem>
          <ListItem>
            {t("terms.sections.serviceDescription.items.securityInfo")}
          </ListItem>
          <ListItem>
            {t("terms.sections.serviceDescription.items.serviceSearch")}
          </ListItem>
        </Section>

        <Section title={t("terms.sections.registrationAccount.title")}>
          <Paragraph>{t("terms.sections.registrationAccount.intro")}</Paragraph>
          <ListItem>
            {t("terms.sections.registrationAccount.items.realData")}
          </ListItem>
          <ListItem>
            {t("terms.sections.registrationAccount.items.secureAccount")}
          </ListItem>
          <ListItem>
            {t("terms.sections.registrationAccount.items.changePassword")}
          </ListItem>
          <ListItem>
            {t("terms.sections.registrationAccount.items.reportAbuse")}
          </ListItem>
        </Section>

        <Section title={t("terms.sections.feesPayment.title")}>
          <Paragraph>{t("terms.sections.feesPayment.intro")}</Paragraph>
          <Paragraph>{t("terms.sections.feesPayment.freeTrialInfo")}</Paragraph>
        </Section>

        <Section title={t("terms.sections.intellectualProperty.title")}>
          <Paragraph>
            {t("terms.sections.intellectualProperty.paragraph1")}
          </Paragraph>
          <Paragraph>
            {t("terms.sections.intellectualProperty.paragraph2")}
          </Paragraph>
        </Section>

        <Section title={t("terms.sections.limitationLiability.title")}>
          <Paragraph>
            {t("terms.sections.limitationLiability.paragraph1")}
          </Paragraph>
          <Paragraph>
            {t("terms.sections.limitationLiability.paragraph2")}
          </Paragraph>
        </Section>

        <Section title={t("terms.sections.communityContent.title")}>
          <Paragraph>
            {t("terms.sections.communityContent.paragraph1")}
          </Paragraph>
          <Paragraph>
            {t("terms.sections.communityContent.paragraph2")}
          </Paragraph>
        </Section>

        <Section title={t("terms.sections.serviceSuspension.title")}>
          <Paragraph>
            {t("terms.sections.serviceSuspension.paragraph1")}
          </Paragraph>
          <Paragraph>
            {t("terms.sections.serviceSuspension.paragraph2")}
          </Paragraph>
        </Section>

        <Section title={t("terms.sections.disputeResolution.title")}>
          <Paragraph>
            {t("terms.sections.disputeResolution.paragraph1")}
          </Paragraph>
          <Paragraph>
            {t("terms.sections.disputeResolution.paragraph2")}
          </Paragraph>
        </Section>

        <Section title={t("terms.sections.termsModification.title")}>
          <Paragraph>
            {t("terms.sections.termsModification.paragraph1")}
          </Paragraph>
          <Paragraph>
            {t("terms.sections.termsModification.paragraph2")}
          </Paragraph>
        </Section>

        <Section title={t("terms.sections.contact.title")}>
          <Paragraph>{t("terms.sections.contact.intro")}</Paragraph>
          <ListItem>{t("terms.sections.contact.items.email")}</ListItem>
          <ListItem>{t("terms.sections.contact.items.address")}</ListItem>
          <ListItem>{t("terms.sections.contact.items.phone")}</ListItem>
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
