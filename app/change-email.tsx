import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuthStore } from "@/stores/authStore";
import { useProfileStore } from "@/stores/profileStore";
import { useThemeStore } from "@/stores/themeStore";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChangeEmailScreen() {
  const { user } = useAuthStore();
  const { updateEmail } = useProfileStore();
  const { currentTheme } = useThemeStore();

  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

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
  const errorColor = useThemeColor(
    { light: "#EF4444", dark: "#F87171" },
    "text"
  );
  const isDarkMode = currentTheme === "dark";

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!newEmail.trim()) {
      newErrors.newEmail = "Az új email cím megadása kötelező";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      newErrors.newEmail = "Érvénytelen email formátum";
    }

    if (!confirmEmail.trim()) {
      newErrors.confirmEmail = "Az email megerősítése kötelező";
    } else if (newEmail !== confirmEmail) {
      newErrors.confirmEmail = "Az email címek nem egyeznek";
    }

    if (!password.trim()) {
      newErrors.password = "A jelenlegi jelszó megadása kötelező";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangeEmail = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const success = await updateEmail(newEmail);
      if (success) {
        Alert.alert(
          "Email változtatás",
          "Megerősítő email küldve az új email címre. Kérjük, ellenőrizze postaládáját és kattintson a megerősítő linkre.",
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error changing email:", error);
      Alert.alert("Hiba", "Nem sikerült megváltoztatni az email címet.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === "newEmail") setNewEmail(value);
    if (field === "confirmEmail") setConfirmEmail(value);
    if (field === "password") setPassword(value);

    // Clear validation error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor }]}>
      <StatusBar style="light" hidden={true} />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <LinearGradient
          colors={isDarkMode ? ["#0F172A", "#1E293B"] : ["#22C55E", "#16A34A"]}
          style={styles.headerGradient}
        >
          <SafeAreaView edges={[]}>
            <View style={[styles.headerContent, { paddingTop: 60 }]}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              <ThemedText style={styles.headerTitle}>
                Email módosítás
              </ThemedText>
              <View style={styles.headerPlaceholder} />
            </View>
          </SafeAreaView>
        </LinearGradient>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Current Email */}
            <View style={[styles.section, { backgroundColor: cardBackground }]}>
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                Jelenlegi email
              </ThemedText>
              <View
                style={[
                  styles.currentEmailContainer,
                  { backgroundColor: borderColor },
                ]}
              >
                <ThemedText
                  style={[styles.currentEmail, { color: secondaryTextColor }]}
                >
                  {user?.email}
                </ThemedText>
              </View>
            </View>

            {/* New Email Form */}
            <View style={[styles.section, { backgroundColor: cardBackground }]}>
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                Új email cím
              </ThemedText>

              <View style={styles.fieldContainer}>
                <ThemedText style={[styles.label, { color: textColor }]}>
                  Új email cím
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: cardBackground,
                      borderColor: errors.newEmail ? errorColor : borderColor,
                      color: textColor,
                    },
                  ]}
                  value={newEmail}
                  onChangeText={(value) => handleInputChange("newEmail", value)}
                  placeholder="uj.email@example.com"
                  placeholderTextColor={secondaryTextColor}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {errors.newEmail && (
                  <ThemedText style={[styles.errorText, { color: errorColor }]}>
                    {errors.newEmail}
                  </ThemedText>
                )}
              </View>

              <View style={styles.fieldContainer}>
                <ThemedText style={[styles.label, { color: textColor }]}>
                  Email megerősítése
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: cardBackground,
                      borderColor: errors.confirmEmail
                        ? errorColor
                        : borderColor,
                      color: textColor,
                    },
                  ]}
                  value={confirmEmail}
                  onChangeText={(value) =>
                    handleInputChange("confirmEmail", value)
                  }
                  placeholder="uj.email@example.com"
                  placeholderTextColor={secondaryTextColor}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {errors.confirmEmail && (
                  <ThemedText style={[styles.errorText, { color: errorColor }]}>
                    {errors.confirmEmail}
                  </ThemedText>
                )}
              </View>

              <View style={styles.fieldContainer}>
                <ThemedText style={[styles.label, { color: textColor }]}>
                  Jelenlegi jelszó
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: cardBackground,
                      borderColor: errors.password ? errorColor : borderColor,
                      color: textColor,
                    },
                  ]}
                  value={password}
                  onChangeText={(value) => handleInputChange("password", value)}
                  placeholder="Jelenlegi jelszó"
                  placeholderTextColor={secondaryTextColor}
                  secureTextEntry
                />
                {errors.password && (
                  <ThemedText style={[styles.errorText, { color: errorColor }]}>
                    {errors.password}
                  </ThemedText>
                )}
              </View>
            </View>

            {/* Warning */}
            <View
              style={[
                styles.warningContainer,
                { backgroundColor: "rgba(251, 191, 36, 0.1)" },
              ]}
            >
              <View style={styles.warningHeader}>
                <Ionicons name="warning" size={20} color="#F59E0B" />
                <ThemedText style={[styles.warningTitle, { color: "#F59E0B" }]}>
                  Figyelem
                </ThemedText>
              </View>
              <ThemedText style={[styles.warningText, { color: textColor }]}>
                Az email cím megváltoztatása után egy megerősítő email érkezik
                az új címre. A változtatás csak a megerősítés után lép életbe.
              </ThemedText>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                {
                  backgroundColor: "#3B82F6",
                  opacity: loading ? 0.7 : 1,
                },
              ]}
              onPress={handleChangeEmail}
              disabled={loading}
            >
              <ThemedText style={styles.saveButtonText}>
                {loading ? "Változtatás..." : "Email módosítás"}
              </ThemedText>
            </TouchableOpacity>

            <View style={styles.bottomSpacing} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: 20,
    paddingTop: 0,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
    flex: 1,
    textAlign: "center",
  },
  headerPlaceholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  currentEmailContainer: {
    padding: 16,
    borderRadius: 12,
  },
  currentEmail: {
    fontSize: 16,
    fontWeight: "500",
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  warningContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  warningHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomSpacing: {
    height: 40,
  },
});
