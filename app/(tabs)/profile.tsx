import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Fonts } from '@/constants/Fonts';

export default function HomeScreen() {
  return (
    <ThemedText style={Fonts.test}>Profil</ThemedText>
  );
}

const styles = StyleSheet.create({

});
