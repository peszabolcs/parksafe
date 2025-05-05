import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useColorScheme } from '@/hooks/useColorScheme';
import CustomDrawerContent from '@/components/CustomDrawerContent'; // Import the custom drawer component

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return null; // Or a loading indicator
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        {/* Configure the Drawer navigator */}
        <Drawer
          screenOptions={{
            headerShown: false, // Hide header globally by default
            drawerStyle: {
              backgroundColor: '#fff', // Set drawer background color
            },
            swipeEnabled: true, // Allow opening drawer via swipe
            drawerType: 'front', // Drawer slides over the content
          }}
          drawerContent={(props) => <CustomDrawerContent {...props} />} // Use the custom component for drawer's content
        >
          {/* Screen for the tab navigator layout */}
          <Drawer.Screen
            name="(tabs)" // Refers to the app/(tabs) directory
            options={{
              // No specific options needed here as it's handled by the tabs layout itself
              // and the drawer item is managed in CustomDrawerContent
            }}
          />
          {/* Define screens accessible from the drawer but outside the tabs */}
          {/* These correspond to files like app/settings.tsx, app/saved-places.tsx etc. */}
          <Drawer.Screen
             name="settings" // Corresponds to app/settings.tsx
             options={{
               title: 'Beállítások', // Set the header title
             }}
           />
           <Drawer.Screen
             name="saved-places" // Corresponds to app/saved-places.tsx
             options={{
                title: 'Mentett helyek' // Set header title
             }}
           />
           <Drawer.Screen
             name="my-reviews" // Corresponds to app/my-reviews.tsx
             options={{
                title: 'Értékeléseim' // Set header title
             }}
           />
                    {/* Add more Drawer.Screen components here if you have other top-level screens */}
        </Drawer>
        {/* Configure the status bar style based on the color scheme */}
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}