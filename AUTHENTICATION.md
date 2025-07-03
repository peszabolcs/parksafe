# Authentication System

## Overview

The ParkSafe app now implements a robust authentication system with persistent login functionality. Users will remain logged in for up to 14 days, and tokens are automatically refreshed to maintain the session.

## Features

### Persistent Login
- **14-day session duration**: Users stay logged in for 14 days without needing to re-authenticate
- **Automatic token refresh**: Tokens are refreshed every 23 hours to prevent expiration
- **App state awareness**: Tokens are refreshed when the app comes to the foreground
- **AsyncStorage persistence**: Sessions are stored locally using AsyncStorage

### Security
- **Secure token storage**: All authentication tokens are stored securely in AsyncStorage
- **Automatic session validation**: Sessions are validated on app startup and state changes
- **Graceful error handling**: Proper error handling for authentication failures

## Implementation Details

### AuthStore (`stores/authStore.ts`)
The main authentication store using Zustand that manages:
- Session state
- User information
- Automatic token refresh
- Sign out functionality

### Supabase Configuration (`lib/supabase.ts`)
Updated Supabase client with:
- AsyncStorage for session persistence
- Automatic token refresh enabled
- Session persistence enabled

### App State Management (`hooks/useAppState.ts`)
Handles app state changes to:
- Refresh tokens when app becomes active
- Ensure session validity after background/foreground transitions

### AuthGate (`app/_layout.tsx`)
Manages authentication flow:
- Redirects unauthenticated users to login
- Redirects authenticated users away from auth pages
- Integrates with app state management

## Usage

### In Components
```typescript
import { useAuthStore } from '@/stores/authStore';

function MyComponent() {
  const { user, session, signOut, refreshSession } = useAuthStore();
  
  // Access user data
  const userEmail = user?.email;
  const username = user?.user_metadata?.username;
  
  // Sign out
  const handleLogout = async () => {
    await signOut();
  };
  
  // Manually refresh session
  const handleRefresh = async () => {
    await refreshSession();
  };
}
```

### Authentication Flow
1. **Login**: User enters credentials → Session created → Stored in AsyncStorage
2. **App Restart**: Session retrieved from AsyncStorage → User stays logged in
3. **Token Refresh**: Automatic refresh every 23 hours → Session extended
4. **App Foreground**: Token refreshed when app becomes active → Session validated
5. **Logout**: Session cleared from AsyncStorage → User redirected to login

## Configuration

### Environment Variables
Make sure to set up your Supabase environment variables:
```
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Supabase Project Settings
In your Supabase project dashboard:
1. Go to Authentication → Settings
2. Set JWT expiry to 14 days (or your preferred duration)
3. Enable email confirmation if required
4. Configure any additional auth providers as needed

## Troubleshooting

### Common Issues

1. **Session not persisting**
   - Check that AsyncStorage is properly configured
   - Verify Supabase client configuration
   - Check for any console errors

2. **Token refresh failures**
   - Verify network connectivity
   - Check Supabase project settings
   - Review authentication logs

3. **App state not detected**
   - Ensure AppState listener is properly set up
   - Check for any React Native version compatibility issues

### Debug Mode
Enable debug logging by checking the console for:
- "Auth state changed" messages
- "Token refreshed automatically" messages
- "App has come to the foreground" messages

## Security Considerations

- Tokens are stored securely in AsyncStorage
- Automatic refresh prevents token expiration
- Session validation on app state changes
- Proper error handling for authentication failures
- No sensitive data logged to console in production

## Future Enhancements

- Biometric authentication support
- Multi-factor authentication
- Session analytics and monitoring
- Offline authentication support 