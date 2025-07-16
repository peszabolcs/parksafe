# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ParkSafe is a React Native app built with Expo that helps users find parking spots and repair stations. The app uses Supabase for authentication and database management, with location-based services for finding nearby services.

## Essential Development Commands

### Start Development
```bash
npm install              # Install dependencies
npm run start           # Start Expo development server
npm run android         # Run on Android device/emulator
npm run ios            # Run on iOS device/simulator
npm run web            # Run on web browser
```

### Code Quality
```bash
npm run lint           # Run ESLint for code quality checks
```

### Environment Setup
The app requires these environment variables:
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key for location services

## Architecture Overview

### State Management
The app uses **Zustand** for state management with these key stores:
- `authStore.ts` - Authentication state and session management
- `locationStore.ts` - User location and nearby markers
- `themeStore.ts` - Theme preferences (light/dark/system)
- `favouritesStore.ts` - User's favorite locations

### Core Systems

#### Startup System (`lib/startup.ts`)
Centralized app initialization flow:
1. Check authentication status
2. Route user to login or main app
3. Start background data fetching (location/markers)
4. Singleton pattern ensures single initialization

#### Authentication (`stores/authStore.ts`)
- **Persistent sessions**: 14-day login duration with automatic token refresh
- **Background refresh**: Tokens refresh every 23 hours
- **App state awareness**: Refreshes when app becomes active
- **AsyncStorage integration**: Secure local session storage

#### Location Services (`stores/locationStore.ts`)
- **Smart location fetching**: Uses last known location for speed, falls back to current location
- **Marker caching**: Caches home markers for instant display
- **Search functionality**: Allows searching at specific locations
- **Fallback location**: Uses Szeged city center (46.2530, 20.1484) if GPS fails

#### Database Integration (`lib/supabase.ts`)
- **Supabase client** with AsyncStorage for persistence
- **Auto-refresh tokens** enabled
- **1-hour cache** for database responses
- **PostGIS optimization** for location-based queries

### File Structure
```
app/                    # Expo Router pages
├── (tabs)/            # Bottom tab navigation
├── _layout.tsx        # Root layout with auth guard
├── login.tsx          # Login screen
├── register.tsx       # Registration screen
└── settings.tsx       # User settings

stores/                # Zustand state management
├── authStore.ts       # Authentication state
├── locationStore.ts   # Location and markers
├── themeStore.ts      # Theme management
└── favouritesStore.ts # User favorites

lib/                   # Core utilities
├── startup.ts         # App initialization logic
├── supabase.ts        # Database client
└── markers.ts         # Location marker fetching

components/            # Reusable UI components
hooks/                 # Custom React hooks
constants/             # App constants (colors, fonts, etc.)
database/              # SQL setup scripts
```

### Navigation Flow
1. **App Launch**: `_layout.tsx` initializes `appStartup.initialize()`
2. **Auth Check**: Determines if user has valid session
3. **Routing**: No session → `/login`, Valid session → `/(tabs)`
4. **Data Loading**: Background fetching of location and markers

### Key Patterns

#### Error Handling
- All async operations include try-catch blocks
- Fallback mechanisms for location services
- Graceful degradation when services are unavailable

#### Performance Optimizations
- **Marker caching**: Instant display of previously fetched markers
- **Background loading**: Data fetches while UI remains responsive
- **Timeout handling**: Prevents indefinite waiting for location/network services
- **Smart location**: Uses last known position before requesting current

#### Authentication Flow
1. User logs in → Session stored in AsyncStorage
2. App restart → Session retrieved and validated
3. Auto-refresh → Tokens renewed every 23 hours
4. App foreground → Session refreshed if needed

## Development Notes

### Testing Location Services
- Location services fall back to Szeged coordinates (46.2530, 20.1484) if GPS fails
- Use device location simulator for testing different locations
- Location permissions are requested on app startup

### Database Schema
- Uses PostGIS for location-based queries
- Marker data includes parking spots and repair stations
- See `database/` folder for SQL setup scripts

### Theme System
- Supports light/dark/system themes
- Theme preference persists across app restarts
- Automatically updates when system theme changes

### Common Issues
- **Location timeout**: Default timeout is 10 seconds, falls back to lower accuracy
- **Token refresh**: Automatic every 23 hours, can be manually triggered
- **Marker loading**: Uses cached results while fetching fresh data
- **Authentication**: Sessions persist for 14 days with automatic refresh