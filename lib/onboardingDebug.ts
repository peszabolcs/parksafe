import AsyncStorage from '@react-native-async-storage/async-storage';

export const onboardingDebug = {
  // Reset all onboarding flags - use this for testing
  async resetAllOnboardingFlags() {
    try {
      // Get all keys
      const keys = await AsyncStorage.getAllKeys();
      
      // Find onboarding keys
      const onboardingKeys = keys.filter(key => 
        key.startsWith('hasSeenOnboarding')
      );
      
      // Remove them
      await AsyncStorage.multiRemove(onboardingKeys);
      
      console.log('🧹 All onboarding flags cleared:', onboardingKeys);
      return true;
    } catch (error) {
      console.error('Error clearing onboarding flags:', error);
      return false;
    }
  },

  // Reset onboarding for specific user
  async resetUserOnboarding(userId: string) {
    try {
      const userKey = `hasSeenOnboarding_${userId}`;
      await AsyncStorage.removeItem(userKey);
      console.log(`🧹 Onboarding flag cleared for user: ${userId}`);
      return true;
    } catch (error) {
      console.error('Error clearing user onboarding flag:', error);
      return false;
    }
  },

  // Check current onboarding status
  async checkOnboardingStatus() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const onboardingKeys = keys.filter(key => 
        key.startsWith('hasSeenOnboarding')
      );
      
      const status: Record<string, string | null> = {};
      
      for (const key of onboardingKeys) {
        status[key] = await AsyncStorage.getItem(key);
      }
      
      console.log('📊 Current onboarding status:', status);
      return status;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return {};
    }
  }
};

// Add to global scope for easy access in development
if (__DEV__) {
  (global as any).onboardingDebug = onboardingDebug;
}