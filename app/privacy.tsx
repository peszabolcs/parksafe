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

export default function PrivacyScreen() {
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
              Adatvédelmi szabályzat
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

          <Section title="1. Bevezetés">
            <Paragraph>
              A Premiumtex Kft. (székhely: 6792 Zsombó, Dózsa dűlő 55.; cégjegyzékszám: 06-09-013323; adószám: 14559253-2-06) elkötelezett a felhasználók személyes adatainak védelmében. Jelen adatvédelmi szabályzat részletezi, hogyan gyűjtjük, használjuk és védjük az Ön személyes adatait a ParkSafe alkalmazás használata során.
            </Paragraph>
            <Paragraph>
              Az alkalmazás használatával Ön elfogadja jelen adatvédelmi szabályzatban foglalt feltételeket és hozzájárul adatainak az itt leírt módon történő kezeléséhez.
            </Paragraph>
          </Section>

          <Section title="2. Gyűjtött adatok">
            <Paragraph>
              A szolgáltatás nyújtása érdekében az alábbi adatokat gyűjtjük:
            </Paragraph>
            <ListItem>Regisztrációs adatok: név, e-mail cím, telefonszám</ListItem>
            <ListItem>Helyadatok: GPS koordináták, keresési helyek</ListItem>
            <ListItem>Eszközinformációk: eszköz típusa, operációs rendszer, alkalmazásverzió</ListItem>
            <ListItem>Használati adatok: alkalmazás használati statisztikák, preferenciák</ListItem>
            <ListItem>Közösségi tartalmak: értékelések, vélemények, feltöltött képek</ListItem>
          </Section>

          <Section title="3. Adatok felhasználása">
            <Paragraph>
              A gyűjtött adatokat az alábbi célokra használjuk:
            </Paragraph>
            <ListItem>Szolgáltatás nyújtása: tárolóhelyek megjelenítése, navigáció</ListItem>
            <ListItem>Felhasználói élmény javítása: személyre szabott tartalom</ListItem>
            <ListItem>Kommunikáció: értesítések, támogatás, frissítések</ListItem>
            <ListItem>Biztonság: visszaélések megelőzése, fiókbiztonság</ListItem>
            <ListItem>Statisztikák: névtelen használati adatok elemzése</ListItem>
          </Section>

          <Section title="4. Helyadatok kezelése">
            <Paragraph>
              A helyadatok kezelése különös figyelmet igényel:
            </Paragraph>
            <ListItem>Helyadatokat csak explicit engedéllyel gyűjtjük</ListItem>
            <ListItem>A pontos helyet csak a szolgáltatás használata során dolgozzuk fel</ListItem>
            <ListItem>A helytörténetet nem tároljuk hosszú távon</ListItem>
            <ListItem>A helyadatok megosztását bármikor letilthatja</ListItem>
            <ListItem>Offline használat esetén a helyadatok helyben maradnak</ListItem>
          </Section>

          <Section title="5. Adatbiztonság">
            <Paragraph>
              Az adatok védelme érdekében az alábbi biztonsági intézkedéseket alkalmazzuk:
            </Paragraph>
            <ListItem>Titkosítás: minden adat titkosítva tárolódik</ListItem>
            <ListItem>Biztonságos szerverek: SSL/TLS protokoll használata</ListItem>
            <ListItem>Hozzáférés-korlátozás: csak jogosult személyek férhetnek hozzá</ListItem>
            <ListItem>Rendszeres biztonsági auditok és frissítések</ListItem>
            <ListItem>Adatvesztés elleni védelem: rendszeres biztonsági mentések</ListItem>
          </Section>

          <Section title="6. Adatmegosztás">
            <Paragraph>
              Személyes adatait nem adjuk át harmadik félnek, kivéve az alábbi esetekben:
            </Paragraph>
            <ListItem>Jogi kötelezettség: hatósági megkeresés esetén</ListItem>
            <ListItem>Szolgáltatók: technikai szolgáltatók (hosting, analytics)</ListItem>
            <ListItem>Fizetési szolgáltatók: prémium előfizetések esetén</ListItem>
            <ListItem>Felhasználói beleegyezés: explicit engedély esetén</ListItem>
          </Section>

          <Section title="7. Közösségi tartalmak">
            <Paragraph>
              A közösségi funkciók használata során:
            </Paragraph>
            <ListItem>Értékelések és vélemények nyilvánosan láthatók</ListItem>
            <ListItem>Felhasználónév megjelenik a tartalmaknál</ListItem>
            <ListItem>Képek és kommentek moderálva vannak</ListItem>
            <ListItem>Nem megfelelő tartalmakat eltávolítjuk</ListItem>
            <ListItem>Saját tartalmait bármikor törölheti</ListItem>
          </Section>

          <Section title="8. Sütik és követés">
            <Paragraph>
              Az alkalmazás működéséhez szükséges technikai adatokat használunk:
            </Paragraph>
            <ListItem>Munkamenet-azonosítók: bejelentkezés fenntartása</ListItem>
            <ListItem>Beállítások tárolása: preferenciák megőrzése</ListItem>
            <ListItem>Teljesítménymérés: alkalmazás optimalizálása</ListItem>
            <ListItem>Hibajelentés: hibák azonosítása és javítása</ListItem>
          </Section>

          <Section title="9. Felhasználói jogok">
            <Paragraph>
              A GDPR alapján az alábbi jogokkal rendelkezik:
            </Paragraph>
            <ListItem>Hozzáférés: adatai megtekintése és lekérése</ListItem>
            <ListItem>Helyesbítés: hibás adatok javítása</ListItem>
            <ListItem>Törlés: fiók és adatok törlése</ListItem>
            <ListItem>Korlátozás: adatkezelés korlátozása</ListItem>
            <ListItem>Hordozhatóság: adatok átvitele más szolgáltatóhoz</ListItem>
            <ListItem>Tiltakozás: adatkezelés ellen való kifogás</ListItem>
          </Section>

          <Section title="10. Adatmegőrzés">
            <Paragraph>
              Az adatokat az alábbi időtartamokig őrizzük meg:
            </Paragraph>
            <ListItem>Fiókadatok: a fiók törlésig</ListItem>
            <ListItem>Tranzakciós adatok: jogi kötelezettség szerint (5 év)</ListItem>
            <ListItem>Helyadatok: 30 nap után automatikusan törlődnek</ListItem>
            <ListItem>Közösségi tartalmak: tartalom törléséig</ListItem>
            <ListItem>Statisztikai adatok: névtelenítve, korlátlan ideig</ListItem>
          </Section>

          <Section title="11. Kiskorúak védelme">
            <Paragraph>
              A 16 év alatti felhasználók védelmében:
            </Paragraph>
            <ListItem>Szülői beleegyezés szükséges 16 év alatt</ListItem>
            <ListItem>Korlátozott funkcionalitás kiskorúak számára</ListItem>
            <ListItem>Fokozott adatvédelem és moderálás</ListItem>
            <ListItem>Jelentési lehetőség nem megfelelő tartalmakra</ListItem>
          </Section>

          <Section title="12. Kapcsolat és bejelentések">
            <Paragraph>
              Adatvédelmi kérdések, kérések és panaszok esetén forduljon hozzánk:
            </Paragraph>
            <ListItem>E-mail: perjesidev@gmail.com</ListItem>
            <ListItem>Postai cím: 6792 Zsombó, Dózsa d. 55.</ListItem>
            <ListItem>Telefonos elérhetőség: +36 30 721 2524</ListItem>
            <ListItem>Válaszadási idő: 30 napon belül</ListItem>
          </Section>

          <Section title="13. Szabályzat módosítása">
            <Paragraph>
              A jelen adatvédelmi szabályzat módosítása:
            </Paragraph>
            <ListItem>Jelentős változásokról előzetesen értesítjük</ListItem>
            <ListItem>Módosítások az alkalmazásban is megjelennek</ListItem>
            <ListItem>Folyamatos használat = módosítások elfogadása</ListItem>
            <ListItem>Változások a közléstől számított 30 napon belül lépnek hatályba</ListItem>
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