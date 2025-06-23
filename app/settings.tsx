import { StyleSheet, ScrollView } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function SettingsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <ThemeToggle />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
});
