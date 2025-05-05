import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, useColorScheme, ImageBackground } from 'react-native';
import { DrawerContentScrollView, DrawerItem, DrawerContentComponentProps } from '@react-navigation/drawer';
import { Feather } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';

function CustomDrawerContent(props: DrawerContentComponentProps) {
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';

    const userData = {
        name: 'Felhasználó',
        email: 'felhasznalo@email.com',
        avatar: 'https://via.placeholder.com/60',
    };
    
    const themeColors = Colors[colorScheme];
    const styles = createStyles(themeColors);

    // Define menu items with special handling for reviews
    const menuItems = [
        { label: 'Profilom', icon: 'user', screen: '(tabs)/profile', params: {} },
        { label: 'Mentett helyek', icon: 'map-pin', screen: 'saved-places', params: {} },
        { 
            label: 'Értékeléseim', 
            icon: 'star', 
            screen: '(tabs)/profile', 
            params: { activeTab: 'reviews' } 
        },
        { label: 'Beállítások', icon: 'settings', screen: 'settings', params: {} },
    ];

    const handleLogout = () => {
        console.log('Logout pressed');
        props.navigation.dispatch(DrawerActions.closeDrawer());
        // ... (logout logic)
    };

    // Navigate with parameters function - with reliable reviews tab handling
    const navigateWithParams = (screen: string, params: any = {}) => {
        props.navigation.dispatch(DrawerActions.closeDrawer());
        
        // Special handling for reviews tab
        if (screen === '(tabs)/profile' && params.activeTab === 'reviews') {
            // First reset to profile tab (to guarantee fresh state)
            router.replace('/(tabs)');
            
            // Short timeout to ensure the navigation system has time to process
            setTimeout(() => {
                // Force navigation to profile with reviews tab active
                router.push({
                    pathname: '/(tabs)/profile',
                    params: { 
                        activeTab: 'reviews',
                        _t: new Date().getTime() // Add timestamp to force refresh
                    }
                });
            }, 10);
        } else {
            // Normal navigation for other menu items
            const targetPath = screen.startsWith('(') ? `/${screen}` : `/${screen}`;
            router.push({
                pathname: targetPath as any,
                params: params
            });
        }
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['right', 'bottom', 'left']}>
            <View style={styles.container}>
                {/* Header Section with Gradient Background */}
                <LinearGradient
                    colors={colorScheme === 'dark' 
                        ? ['#2A2E43', '#1E1E2E'] 
                        : ['#4A90E2', '#5EAEF5']}
                    style={styles.headerContainer}
                >
                    <Pressable 
                        onPress={() => props.navigation.dispatch(DrawerActions.closeDrawer())} 
                        style={styles.closeButton}
                        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                    >
                        <Feather name="x" size={24} color="#FFFFFF" />
                    </Pressable>
                    
                    <View style={styles.avatarContainer}>
                        <Image source={{ uri: userData.avatar }} style={styles.avatar} />
                    </View>
                    
                    <View style={styles.userInfoContainer}>
                        <Text style={styles.userName}>{userData.name}</Text>
                        <Text style={styles.userEmail}>{userData.email}</Text>
                    </View>
                </LinearGradient>

                {/* Menu Items with Better Spacing and Styling */}
                <DrawerContentScrollView 
                    {...props} 
                    contentContainerStyle={styles.scrollContent}
                >
                    {menuItems.map((item) => (
                        <DrawerItem
                            key={item.label}
                            label={item.label}
                            labelStyle={styles.drawerLabel}
                            icon={({ size }) => (
                                <View style={styles.iconContainer}>
                                    <Feather 
                                        name={item.icon as any} 
                                        size={size} 
                                        color={themeColors.tint} 
                                    />
                                </View>
                            )}
                            style={styles.drawerItem}
                            activeBackgroundColor={colorScheme === 'dark' ? '#363A4F' : '#E6F0FD'}
                            onPress={() => navigateWithParams(item.screen, item.params)}
                        />
                    ))}
                </DrawerContentScrollView>

                {/* Footer with Enhanced Logout Button */}
                <View style={styles.footer}>
                    <Pressable 
                        style={({pressed}) => [
                            styles.logoutButton,
                            pressed && styles.logoutButtonPressed
                        ]} 
                        onPress={handleLogout}
                    >
                        <Feather 
                            name="log-out" 
                            size={22} 
                            color={colorScheme === 'dark' ? '#FF6961' : '#E53935'} 
                            style={styles.logoutIcon} 
                        />
                        <Text style={[
                            styles.logoutText,
                            {color: colorScheme === 'dark' ? '#FF6961' : '#E53935'}
                        ]}>
                            Kijelentkezés
                        </Text>
                    </Pressable>
                </View>
            </View>
        </SafeAreaView>
    );
}

const createStyles = (themeColors: typeof Colors.light) => StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: themeColors.background,
    },
    container: {
        flex: 1,
        flexDirection: 'column',
    },
    headerContainer: {
        paddingHorizontal: 20,
        paddingTop: 30,
        paddingBottom: 30,
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: 15,
        right: 15,
        zIndex: 1,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 15,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: 'white',
    },
    userInfoContainer: {
        alignItems: 'center',
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    scrollContent: {
        paddingTop: 15,
    },
    drawerItem: {
        borderRadius: 8,
        marginHorizontal: 12,
        marginVertical: 4,
    },
    iconContainer: {
        width: 30,
        marginRight: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    drawerLabel: {
        marginLeft: -16,
        fontSize: 16,
        fontWeight: '500',
        color: themeColors.text,
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.1)',
        paddingVertical: 15,
        paddingHorizontal: 20,
        marginTop: 'auto',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: 'rgba(229, 57, 53, 0.1)',
    },
    logoutButtonPressed: {
        opacity: 0.7,
    },
    logoutIcon: {
        marginRight: 15,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default CustomDrawerContent;