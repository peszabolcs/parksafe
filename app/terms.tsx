import React from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useThemeStore } from '@/stores/themeStore';
import { router } from 'expo-router';

export default function TermsScreen() {
  const { currentTheme } = useThemeStore();
  const isDarkMode = currentTheme === 'dark';
  
  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = useThemeColor({ light: '#fff', dark: '#1F2937' }, 'background');
  const borderColor = useThemeColor({ light: '#E5E7EB', dark: '#374151' }, 'background');
  const secondaryTextColor = useThemeColor({ light: '#6B7280', dark: '#9CA3AF' }, 'text');
  const primaryColor = useThemeColor({ light: '#3B82F6', dark: '#60A5FA' }, 'tint');

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={[styles.section, { backgroundColor: cardBackground, borderColor }]}>
      <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
        {title}
      </ThemedText>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  const Paragraph = ({ children }: { children: React.ReactNode }) => (
    <ThemedText style={[styles.paragraph, { color: secondaryTextColor }]}>
      {children}
    </ThemedText>
  );

  const ListItem = ({ children }: { children: React.ReactNode }) => (
    <View style={styles.listItem}>
      <ThemedText style={[styles.bullet, { color: primaryColor }]}>•</ThemedText>
      <ThemedText style={[styles.listItemText, { color: secondaryTextColor }]}>
        {children}
      </ThemedText>
    </View>
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
              Felhasználási feltételek
            </ThemedText>
            <View style={styles.headerRight} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Last Updated */}
          <View style={styles.lastUpdated}>
            <ThemedText style={[styles.lastUpdatedText, { color: secondaryTextColor }]}>
              Utolsó frissítés: 2024. július 16.
            </ThemedText>
          </View>

          <Section title="1. Általános rendelkezések">
            <Paragraph>
              Jelen Általános Szerződési Feltételek (a továbbiakban: ÁSZF) a Premiumtex Kft. (székhely: 6792 Zsombó, Dózsa dűlő 55.; cégjegyzékszám: 06-09-013323; adószám: 14559253-2-06) által üzemeltetett ParkSafe alkalmazás és szolgáltatások használatára vonatkoznak.
            </Paragraph>
            <Paragraph>
              Az alkalmazás használatával Ön elfogadja jelen ÁSZF-ben foglalt feltételeket. Kérjük, hogy a regisztráció előtt figyelmesen olvassa el az alábbi feltételeket.
            </Paragraph>
          </Section>

          <Section title="2. A szolgáltatás leírása">
            <Paragraph>
              A ParkSafe egy mobilalkalmazás és webes platform, amely segít a felhasználóknak biztonságos kerékpár- és roller-tárolóhelyek megtalálásában. A szolgáltatás keretében a következő funkciókat biztosítjuk:
            </Paragraph>
            <ListItem>Tárolóhelyek térképes megjelenítése</ListItem>
            <ListItem>Valós idejű elérhetőségi információk</ListItem>
            <ListItem>Közösségi értékelések és vélemények</ListItem>
            <ListItem>Biztonsági információk és kamerarendszer adatok</ListItem>
            <ListItem>Szerviz- és kiegészítő szolgáltatások keresése</ListItem>
          </Section>

          <Section title="3. Regisztráció és felhasználói fiók">
            <Paragraph>
              A szolgáltatás teljes körű használatához regisztráció szükséges. A regisztráció során megadott adatok valódiságáért a felhasználó felel. A felhasználó köteles:
            </Paragraph>
            <ListItem>Valós adatokat megadni a regisztráció során</ListItem>
            <ListItem>Fiókadatait biztonságban tartani</ListItem>
            <ListItem>Jelszavát rendszeresen megváltoztatni</ListItem>
            <ListItem>Haladéktalanul jelenteni bármilyen visszaélést</ListItem>
          </Section>

          <Section title="4. Díjak és fizetés">
            <Paragraph>
              Az alkalmazás alapfunkciói ingyenesen használhatók. A prémium szolgáltatásokért havonta 990 Ft díjat számítunk fel. A díjfizetés automatikus megújítással történik, amelyet a felhasználó bármikor lemondhat.
            </Paragraph>
            <Paragraph>
              Az első hónapban a prémium szolgáltatások ingyenesen kipróbálhatók. A lemondás elmulasztása esetén automatikusan megújul a prémium előfizetés.
            </Paragraph>
          </Section>

          <Section title="5. Szellemi tulajdonjogok">
            <Paragraph>
              Az alkalmazás és annak tartalma (szoftver, grafika, szövegek, adatbázis) a Premiumtex Kft. szellemi tulajdonát képezi. A felhasználó kizárólag a szolgáltatás rendeltetésszerű használatára jogosult.
            </Paragraph>
            <Paragraph>
              Tilos az alkalmazás tartalmának másolása, terjesztése, módosítása vagy kereskedelmi célú felhasználása a Premiumtex Kft. írásos engedélye nélkül.
            </Paragraph>
          </Section>

          <Section title="6. Felelősség korlátozása">
            <Paragraph>
              A Premiumtex Kft. nem vállal felelősséget a tárolóhelyek tényleges biztonságáért vagy elérhetőségéért. Az alkalmazásban megjelenő információk tájékoztató jellegűek.
            </Paragraph>
            <Paragraph>
              A társaság nem felel a felhasználó által a tárolóhelyeken elszenvedett károkért, lopásokért vagy bármilyen egyéb veszteségért.
            </Paragraph>
          </Section>

          <Section title="7. Közösségi tartalmak">
            <Paragraph>
              A felhasználók által közzétett értékelések, vélemények és egyéb tartalmak szerzői jogaiért a feltöltő felhasználó felel. A társaság fenntartja a jogot a nem megfelelő tartalmak eltávolítására.
            </Paragraph>
            <Paragraph>
              Tilos trágár, sértő, jogellenes vagy valótlan tartalmak közzététele. Az ilyen tartalmak közzétevőjének fiókját felfüggesztjük.
            </Paragraph>
          </Section>

          <Section title="8. Szolgáltatás felfüggesztése">
            <Paragraph>
              A Premiumtex Kft. fenntartja a jogot a szolgáltatás ideiglenes vagy végleges felfüggesztésére karbantartás, fejlesztés vagy egyéb műszaki okok miatt.
            </Paragraph>
            <Paragraph>
              Súlyos szerződésszegés esetén a társaság jogosult a felhasználói fiók azonnali felfüggesztésére vagy törlésére előzetes értesítés nélkül.
            </Paragraph>
          </Section>

          <Section title="9. Jogviták rendezése">
            <Paragraph>
              A jelen ÁSZF-fel kapcsolatos jogviták rendezésére a magyar jog irányadó. A felek elsősorban békés úton kísérlik meg rendezni a vitákat.
            </Paragraph>
            <Paragraph>
              Amennyiben a békés rendezés nem vezet eredményre, a jogviták elbírálására a Budapesti Törvényszék kizárólagosan illetékes.
            </Paragraph>
          </Section>

          <Section title="10. Az ÁSZF módosítása">
            <Paragraph>
              A Premiumtex Kft. fenntartja a jogot jelen ÁSZF egyoldalú módosítására. A módosításokról a felhasználókat e-mail útján vagy az alkalmazásban megjelenő értesítéssel tájékoztatjuk.
            </Paragraph>
            <Paragraph>
              A módosítások a közléstől számított 15 napon belül lépnek hatályba. A szolgáltatás további használatával a felhasználó elfogadja a módosított feltételeket.
            </Paragraph>
          </Section>

          <Section title="11. Kapcsolat">
            <Paragraph>
              Jelen ÁSZF-fel kapcsolatos kérdésekkel, panaszokkal a következő elérhetőségeken fordulhat hozzánk:
            </Paragraph>
            <ListItem>E-mail: perjesidev@gmail.com</ListItem>
            <ListItem>Postai cím: 6792 Zsombó, Dózsa d. 55.</ListItem>
            <ListItem>Telefonos ügyfélszolgálat: +36 30 721 2524</ListItem>
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
  lastUpdated: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  lastUpdatedText: {
    fontSize: 12,
    fontStyle: 'italic',
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
    fontWeight: '600',
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
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    fontSize: 14,
    marginRight: 8,
    fontWeight: '600',
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