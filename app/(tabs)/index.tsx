import { Image } from 'expo-image';
import { Platform, StyleSheet } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Fonts } from '@/constants/Fonts';

export default function HomeScreen() {
  return (
    <ThemedText style={Fonts.test}>Főoldal</ThemedText>
  );
}

const styles = StyleSheet.create({

});
