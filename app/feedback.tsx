import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  Animated,
  Dimensions
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

const { height: screenHeight } = Dimensions.get('window');

type FeedbackType = 'bug' | 'feature' | 'general' | 'improvement';
type PriorityLevel = 'low' | 'medium' | 'high';
type Category = 'ui_ux' | 'performance' | 'feature' | 'bug' | 'content' | 'other';

interface FeedbackForm {
  type: FeedbackType;
  title: string;
  description: string;
  priority: PriorityLevel;
  category: Category;
  email: string;
}

export default function FeedbackScreen() {
  const { user } = useAuthStore();
  const { currentTheme } = useThemeStore();
  const insets = useSafeAreaInsets();
  
  const [form, setForm] = useState<FeedbackForm>({
    type: 'general',
    title: '',
    description: '',
    priority: 'medium',
    category: 'other',
    email: user?.email || ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  const typeModalAnim = useRef(new Animated.Value(screenHeight)).current;
  const priorityModalAnim = useRef(new Animated.Value(screenHeight)).current;
  const categoryModalAnim = useRef(new Animated.Value(screenHeight)).current;
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = useThemeColor({ light: '#fff', dark: '#1F2937' }, 'background');
  const borderColor = useThemeColor({ light: '#E5E7EB', dark: '#374151' }, 'background');
  const secondaryTextColor = useThemeColor({ light: '#6B7280', dark: '#9CA3AF' }, 'text');
  const inputBackgroundColor = useThemeColor({ light: '#F9FAFB', dark: '#111827' }, 'background');
  const isDarkMode = currentTheme === 'dark';

  const feedbackTypes = useMemo(() => [
    { value: 'bug' as const, label: 'Hibabejelentés', icon: 'bug', description: 'Alkalmazásban talált hiba jelentése' },
    { value: 'feature' as const, label: 'Új funkció', icon: 'bulb', description: 'Új funkció kérése' },
    { value: 'improvement' as const, label: 'Fejlesztési javaslat', icon: 'trending-up', description: 'Meglévő funkció javítása' },
    { value: 'general' as const, label: 'Általános visszajelzés', icon: 'chatbubbles', description: 'Általános vélemény vagy észrevétel' }
  ], []);

  const priorityLevels = useMemo(() => [
    { value: 'low' as const, label: 'Alacsony', icon: 'arrow-down', color: '#10B981' },
    { value: 'medium' as const, label: 'Közepes', icon: 'remove', color: '#F59E0B' },
    { value: 'high' as const, label: 'Magas', icon: 'arrow-up', color: '#EF4444' }
  ], []);

  const categories = useMemo(() => [
    { value: 'ui_ux' as const, label: 'Felhasználói felület', icon: 'phone-portrait', description: 'Dizájn és használhatóság' },
    { value: 'performance' as const, label: 'Teljesítmény', icon: 'speedometer', description: 'Sebesség és válaszidő problémák' },
    { value: 'feature' as const, label: 'Új funkció', icon: 'add-circle', description: 'Hiányzó funkciók kérése' },
    { value: 'bug' as const, label: 'Hibabejelentés', icon: 'warning', description: 'Hibák és problémák' },
    { value: 'content' as const, label: 'Tartalom', icon: 'document-text', description: 'Tartalom javítási javaslatok' },
    { value: 'other' as const, label: 'Egyéb', icon: 'ellipsis-horizontal', description: 'Minden más téma' }
  ], []);

  const openModal = useCallback((type: 'type' | 'priority' | 'category') => {
    const animRef = type === 'type' ? typeModalAnim : type === 'priority' ? priorityModalAnim : categoryModalAnim;
    const setShow = type === 'type' ? setShowTypeModal : type === 'priority' ? setShowPriorityModal : setShowCategoryModal;
    
    setShow(true);
    Animated.timing(animRef, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [typeModalAnim, priorityModalAnim, categoryModalAnim]);

  const closeModal = useCallback((type: 'type' | 'priority' | 'category') => {
    const animRef = type === 'type' ? typeModalAnim : type === 'priority' ? priorityModalAnim : categoryModalAnim;
    const setShow = type === 'type' ? setShowTypeModal : type === 'priority' ? setShowPriorityModal : setShowCategoryModal;
    
    Animated.timing(animRef, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShow(false);
      animRef.setValue(screenHeight);
    });
  }, [typeModalAnim, priorityModalAnim, categoryModalAnim]);

  const validateForm = useCallback(() => {
    if (!form.title.trim()) {
      Alert.alert('Hiányzó cím', 'Kérem adjon meg egy címet a visszajelzéshez.');
      return false;
    }
    if (form.title.trim().length < 5) {
      Alert.alert('Túl rövid cím', 'A cím legalább 5 karakter hosszú legyen.');
      return false;
    }
    if (!form.description.trim()) {
      Alert.alert('Hiányzó leírás', 'Kérem adjon meg részletes leírást.');
      return false;
    }
    if (form.description.trim().length < 10) {
      Alert.alert('Túl rövid leírás', 'A leírás legalább 10 karakter hosszú legyen.');
      return false;
    }
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      Alert.alert('Érvénytelen email', 'Kérem adjon meg érvényes email címet vagy hagyja üresen.');
      return false;
    }
    return true;
  }, [form]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const feedbackData = {
        user_id: user?.id || null,
        type: form.type,
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
        category: form.category,
        contact_email: form.email || null,
        status: 'open',
        created_at: new Date().toISOString()
      };
      
      console.log('Submitting feedback:', feedbackData);
      console.log('Description length:', form.description.length);
      console.log('Description content:', form.description);
      
      const { error } = await supabase
        .from('feedback')
        .insert(feedbackData);

      if (error) throw error;

      Alert.alert(
        'Sikeres beküldés',
        'Köszönjük a visszajelzését! Csapatunk áttekinti és válaszol rá a lehető leghamarabb.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setForm({
                type: 'general',
                title: '',
                description: '',
                priority: 'medium',
                category: 'other',
                email: user?.email || ''
              });
              router.back();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Feedback submission error:', error);
      Alert.alert(
        'Hiba történt',
        'Nem sikerült elküldeni a visszajelzést. Kérem próbálja újra később.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [form, validateForm, user]);

  const OptionSelector = useCallback(({ 
    label, 
    value, 
    icon, 
    onPress 
  }: { 
    label: string; 
    value: string; 
    icon: string; 
    onPress: () => void; 
  }) => (
    <TouchableOpacity
      style={[styles.optionSelector, { backgroundColor: cardBackground, borderColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.optionLeft}>
        <Ionicons name={icon as any} size={20} color={textColor} />
        <ThemedText style={[styles.optionLabel, { color: textColor }]}>
          {label}
        </ThemedText>
      </View>
      <View style={styles.optionRight}>
        <ThemedText style={[styles.optionValue, { color: secondaryTextColor }]}>
          {value}
        </ThemedText>
        <Ionicons name="chevron-forward" size={16} color={secondaryTextColor} />
      </View>
    </TouchableOpacity>
  ), [cardBackground, borderColor, textColor, secondaryTextColor]);

  const renderModal = (
    type: 'type' | 'priority' | 'category',
    items: any[],
    selectedValue: any,
    onSelect: (value: any) => void,
    title: string
  ) => {
    const isVisible = type === 'type' ? showTypeModal : type === 'priority' ? showPriorityModal : showCategoryModal;
    const animValue = type === 'type' ? typeModalAnim : type === 'priority' ? priorityModalAnim : categoryModalAnim;
    
    console.log(`Modal ${type}: isVisible=${isVisible}, items=${items?.length || 0}`);
    
    return (
      <Modal visible={isVisible} animationType="none" transparent onRequestClose={() => closeModal(type)}>
        <Animated.View style={[styles.modalOverlay, { opacity: animValue.interpolate({ inputRange: [0, screenHeight], outputRange: [1, 0] }) }]}>
          <Pressable style={{ flex: 1 }} onPress={() => closeModal(type)} />
          <Animated.View
            style={[
              styles.modalContent,
              { backgroundColor: cardBackground, transform: [{ translateY: animValue }] }
            ]}
          >
            <View style={[styles.modalHeader, { borderBottomColor: borderColor }]}>
              <ThemedText style={[styles.modalTitle, { color: textColor }]}>{title}</ThemedText>
              <TouchableOpacity onPress={() => closeModal(type)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={textColor} />
              </TouchableOpacity>
            </View>
            <ScrollView 
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {items.map((item) => {
                const isSelected = selectedValue === item.value;
                console.log(`Rendering item: ${item.label}, isSelected: ${isSelected}`);
                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.modalOption,
                      { borderColor },
                      isSelected && { backgroundColor: borderColor }
                    ]}
                    onPress={() => {
                      onSelect(item.value);
                      closeModal(type);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.modalOptionLeft}>
                      <View style={[
                        styles.modalOptionIcon,
                        { 
                          backgroundColor: isSelected ? '#3B82F6' : borderColor,
                          ...(type === 'priority' && { backgroundColor: item.color })
                        }
                      ]}>
                        <Ionicons 
                          name={item.icon as any} 
                          size={20} 
                          color={isSelected || type === 'priority' ? '#FFFFFF' : textColor} 
                        />
                      </View>
                      <View style={styles.modalOptionText}>
                        <ThemedText style={[styles.modalOptionTitle, { color: textColor }]}>
                          {item.label}
                        </ThemedText>
                        {item.description && (
                          <ThemedText style={[styles.modalOptionDescription, { color: secondaryTextColor }]}>
                            {item.description}
                          </ThemedText>
                        )}
                      </View>
                    </View>
                    {isSelected && <Ionicons name="checkmark" size={20} color="#3B82F6" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>
    );
  };

  const selectedType = feedbackTypes.find(t => t.value === form.type);
  const selectedPriority = priorityLevels.find(p => p.value === form.priority);
  const selectedCategory = categories.find(c => c.value === form.category);

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
              Visszajelzés
            </ThemedText>
            <View style={styles.headerPlaceholder} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            {/* Form Header */}
            <View style={styles.formHeader}>
              <ThemedText style={[styles.formTitle, { color: textColor }]}>
                Ossza meg velünk véleményét
              </ThemedText>
              <ThemedText style={[styles.formSubtitle, { color: secondaryTextColor }]}>
                Visszajelzése segít nekünk fejleszteni az alkalmazást
              </ThemedText>
            </View>

            {/* Feedback Type */}
            <View style={styles.section}>
              <ThemedText style={[styles.sectionLabel, { color: textColor }]}>
                Visszajelzés típusa *
              </ThemedText>
              <OptionSelector
                label="Típus"
                value={selectedType?.label || 'Válasszon'}
                icon={selectedType?.icon || 'help-circle'}
                onPress={() => openModal('type')}
              />
            </View>

            {/* Category */}
            <View style={styles.section}>
              <ThemedText style={[styles.sectionLabel, { color: textColor }]}>
                Kategória *
              </ThemedText>
              <OptionSelector
                label="Kategória"
                value={selectedCategory?.label || 'Válasszon'}
                icon={selectedCategory?.icon || 'folder'}
                onPress={() => openModal('category')}
              />
            </View>

            {/* Title */}
            <View style={styles.section}>
              <ThemedText style={[styles.sectionLabel, { color: textColor }]}>
                Cím / Tárgy *
              </ThemedText>
              <TextInput
                style={[
                  styles.textInput,
                  { 
                    backgroundColor: inputBackgroundColor,
                    borderColor,
                    color: textColor
                  }
                ]}
                placeholder="Rövid, szemléletes cím..."
                placeholderTextColor={secondaryTextColor}
                value={form.title}
                onChangeText={(text) => setForm(prev => ({ ...prev, title: text }))}
                maxLength={100}
              />
            </View>

            {/* Description */}
            <View style={styles.section}>
              <ThemedText style={[styles.sectionLabel, { color: textColor }]}>
                Részletes leírás *
              </ThemedText>
              <TextInput
                style={[
                  styles.textArea,
                  { 
                    backgroundColor: inputBackgroundColor,
                    borderColor,
                    color: textColor
                  }
                ]}
                placeholder="Írja le részletesen a problémát, javaslatot vagy véleményét..."
                placeholderTextColor={secondaryTextColor}
                value={form.description}
                onChangeText={(text) => {
                  console.log('Description changed:', text);
                  setForm(prev => ({ ...prev, description: text }));
                }}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                maxLength={2000}
              />
              <ThemedText style={[styles.characterCount, { color: secondaryTextColor }]}>
                {form.description.length} / 2000
              </ThemedText>
            </View>

            {/* Priority */}
            <View style={styles.section}>
              <ThemedText style={[styles.sectionLabel, { color: textColor }]}>
                Prioritás
              </ThemedText>
              <OptionSelector
                label="Prioritás"
                value={selectedPriority?.label || 'Közepes'}
                icon={selectedPriority?.icon || 'remove'}
                onPress={() => openModal('priority')}
              />
            </View>

            {/* Contact Email */}
            <View style={styles.section}>
              <ThemedText style={[styles.sectionLabel, { color: textColor }]}>
                Kapcsolattartási email (opcionális)
              </ThemedText>
              <TextInput
                style={[
                  styles.textInput,
                  { 
                    backgroundColor: inputBackgroundColor,
                    borderColor,
                    color: textColor
                  }
                ]}
                placeholder="email@example.com"
                placeholderTextColor={secondaryTextColor}
                value={form.email}
                onChangeText={(text) => setForm(prev => ({ ...prev, email: text }))}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <ThemedText style={[styles.helpText, { color: secondaryTextColor }]}>
                Ha szeretne visszajelzést kapni, adja meg az email címét
              </ThemedText>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                { 
                  backgroundColor: isDarkMode ? '#16A34A' : '#22C55E',
                  opacity: isSubmitting ? 0.7 : 1
                }
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <ThemedText style={styles.submitButtonText}>
                {isSubmitting ? 'Küldés...' : 'Visszajelzés küldése'}
              </ThemedText>
            </TouchableOpacity>

            <View style={{ height: insets.bottom + 20 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modals */}
      {renderModal('type', feedbackTypes, form.type, (value) => setForm(prev => ({ ...prev, type: value })), 'Visszajelzés típusa')}
      {renderModal('priority', priorityLevels, form.priority, (value) => setForm(prev => ({ ...prev, priority: value })), 'Prioritás szint')}
      {renderModal('category', categories, form.category, (value) => setForm(prev => ({ ...prev, category: value })), 'Kategória választás')}
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  formHeader: {
    marginBottom: 32,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  optionSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionValue: {
    fontSize: 14,
    marginRight: 8,
  },
  textInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  textArea: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    height: 120,
  },
  characterCount: {
    textAlign: 'right',
    fontSize: 12,
    marginTop: 4,
  },
  helpText: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 20,
    maxHeight: '80%',
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
    maxHeight: 400,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  modalOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalOptionText: {
    flex: 1,
  },
  modalOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  modalOptionDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
});