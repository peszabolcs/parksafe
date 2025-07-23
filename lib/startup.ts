import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/stores/authStore';
import { useLocationStore } from '@/stores/locationStore';

export class AppStartup {
  private static instance: AppStartup;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  static getInstance(): AppStartup {
    if (!AppStartup.instance) {
      AppStartup.instance = new AppStartup();
    }
    return AppStartup.instance;
  }

  async initialize(): Promise<void> {
    // Prevent multiple concurrent initializations
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    if (this.isInitialized) {
      return;
    }

    this.initializationPromise = this._doInitialize();
    return this.initializationPromise;
  }

  private async _doInitialize(): Promise<void> {
    try {
      console.log('App startup: Beginning initialization');
      
      // Step 1: Check if user has seen onboarding
      const hasSeenOnboarding = await this.checkOnboardingStatus();
      
      if (!hasSeenOnboarding) {
        console.log('App startup: First time user, showing onboarding');
        router.replace('/onboarding');
        this.isInitialized = true;
        return;
      }
      
      // Step 2: Check authentication
      const hasValidSession = await this.checkAuthentication();

      if (!hasValidSession) {
        console.log('App startup: No valid session, redirecting to login');
        // No user - redirect to login
        router.replace('/login');
        this.isInitialized = true;
        return;
      }

      console.log('App startup: Valid session found, proceeding to home');
      
      // Step 3: User exists - start data fetching in background
      this.startDataFetching();
      
      // Step 4: Navigate to home (data will load in background)
      router.replace('/(tabs)');
      
      this.isInitialized = true;
      console.log('App startup: Initialization complete');
    } catch (error) {
      console.error('Startup initialization failed:', error);
      router.replace('/login');
      this.isInitialized = true;
    } finally {
      this.initializationPromise = null;
    }
  }

  private async checkOnboardingStatus(): Promise<boolean> {
    try {
      // First check if user is authenticated to get user-specific onboarding status
      const authStore = useAuthStore.getState();
      await authStore.initializeAuth();
      
      const currentState = useAuthStore.getState();
      const userId = currentState.user?.id;
      
      if (userId) {
        // User is logged in - check user-specific onboarding status
        const userOnboardingKey = `hasSeenOnboarding_${userId}`;
        const hasSeenOnboarding = await AsyncStorage.getItem(userOnboardingKey);
        return hasSeenOnboarding === 'true';
      } else {
        // No user logged in - check global onboarding status for first-time app users
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding_global');
        return hasSeenOnboarding === 'true';
      }
    } catch (error) {
      console.error('Onboarding check failed:', error);
      return false;
    }
  }

  private async checkAuthentication(): Promise<boolean> {
    try {
      const authStore = useAuthStore.getState();
      
      // Initialize auth if not already done
      await authStore.initializeAuth();
      
      // Check if we have a valid session after initialization
      const currentState = useAuthStore.getState();
      const hasSession = !!(currentState.session && currentState.user);
      
      console.log('Authentication check:', hasSession ? 'Valid session' : 'No session');
      return hasSession;
    } catch (error) {
      console.error('Authentication check failed:', error);
      return false;
    }
  }

  // Public method to start data fetching (can be called after login)
  async startDataFetching(): Promise<void> {
    return new Promise((resolve) => {
      // Start location and marker fetching in background
      setTimeout(async () => {
        try {
          console.log('Data fetching: Starting location and markers');
          const locationStore = useLocationStore.getState();
          await locationStore.initialize();
          console.log('Data fetching: Location and markers complete');
          resolve();
        } catch (error) {
          console.error('Data fetching failed:', error);
          resolve(); // Don't throw, just log error
        }
      }, 100); // Small delay to ensure any navigation completes first
    });
  }

  // Reset state for logout
  reset(): void {
    console.log('App startup: Resetting state');
    this.isInitialized = false;
    this.initializationPromise = null;
  }
}

// Export singleton instance
export const appStartup = AppStartup.getInstance(); 