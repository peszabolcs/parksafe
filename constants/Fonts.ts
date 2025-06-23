import { Platform, TextStyle } from 'react-native';

export const Fonts = {
  family: {
    regular: 'System',
    bold: 'System-Bold',
  },
  size: {
    small: 12,
    medium: 16,
    large: 20,
    header: 20,
    welcome: 24,
    subtitle: 14,
    sectionTitle: 18,
    name: 16,
    details: 14,
  },
  weight: {
    regular: '400' as TextStyle['fontWeight'],
    bold: '700' as TextStyle['fontWeight'],
    semiBold: '600' as TextStyle['fontWeight'],
    medium: '500' as TextStyle['fontWeight'],
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold' as TextStyle['fontWeight'],
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold' as TextStyle['fontWeight'],
    marginBottom: 4,
  },
  bold: {
    fontWeight: 'bold' as TextStyle['fontWeight'],
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as TextStyle['fontWeight'],
    marginBottom: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: '500' as TextStyle['fontWeight'],
  },
  details: {
    fontSize: 14,
    color: '#555',
  },
  buttonText: {
    color: '#fff',
    marginTop: 6,
  },
  test: {
    fontSize: 20,
    fontWeight: 'bold' as TextStyle['fontWeight'],
    textAlign: 'center' as TextStyle['textAlign'],
    textAlignVertical: 'center' as TextStyle['textAlignVertical'],
  },
};
