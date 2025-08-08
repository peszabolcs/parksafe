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
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` - Google OAuth iOS client ID (optional, for future native auth)
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` - Google OAuth web client ID (optional, for reference)

### Google OAuth Setup
For Google authentication to work, you need to configure both Google Cloud Console and Supabase:

#### 1. Google Cloud Console Setup
Create **two** OAuth 2.0 clients:

**iOS Client:**
- Application type: **iOS**  
- Bundle ID: `com.parksafe.app`
- Result: iOS Client ID (no secret provided)

**Web Client (for Supabase):**
- Application type: **Web application**
- Authorized redirect URIs: `https://xkboeigznjtpdycqfzyq.supabase.co/auth/v1/callback`
- Result: Web Client ID + Client Secret

#### 2. Supabase Configuration
- Go to Authentication → Providers → Google
- Enable Google provider
- Use the **Web Client ID** and **Web Client Secret** from above
- **Important**: Use the WEB credentials, not iOS credentials

#### 3. Supabase Redirect URLs Setup  
Add these redirect URLs in Supabase Authentication → URL Configuration:
- `parksafe://auth/callback` (for mobile app deep linking)
- `https://parksafe.hu/success` (for web fallback)
- `https://parksafe.hu/error` (for web error handling)

#### 4. Deep Link Setup
The app uses `parksafe://` scheme for OAuth callbacks:
- Defined in `app.json` under `scheme`
- iOS Bundle ID: `com.parksafe.app`  
- Auth callback route: `/auth/callback`
- Deep link URL: `parksafe://auth/callback`

#### 5. Google OAuth Flow
1. User clicks "Bejelentkezés Google-lel"
2. Opens Google OAuth in WebBrowser
3. After successful auth, redirects to `parksafe://auth/callback`
4. App checks if profile is complete (username, phone)
5. If incomplete → `/complete-profile` screen
6. If complete → `/(tabs)` main app

#### 6. Profile Completion
Google OAuth provides limited data:
- ✅ Email, Name, Avatar URL
- ❌ Phone number, Date of birth, Username

The `/complete-profile` screen collects missing required fields:
- Username (unique, min 3 chars)
- Phone number (international format)  
- Date of birth (min age 13)

## Architecture Overview

### State Management
The app uses **Zustand** for state management with these key stores:
- `authStore.ts` - Authentication state and session management
- `locationStore.ts` - User location and nearby markers
- `themeStore.ts` - Theme preferences (light/dark/system)
- `languageStore.ts` - Language preferences (Hungarian/English/System)
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
├── languageStore.ts   # Language preferences
└── favouritesStore.ts # User favorites

lib/                   # Core utilities
├── startup.ts         # App initialization logic
├── supabase.ts        # Database client
├── markers.ts         # Location marker fetching
└── i18n.ts            # Internationalization setup

locales/               # Translation files
├── hu/                # Hungarian translations
│   └── translation.json
└── en/                # English translations
    └── translation.json

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

### Multilingual Support
The app supports **Hungarian** and **English** languages with system language detection:

**⚠️ Important**: After installing multilingual support, you need to rebuild the native app:
```bash
npx expo run:ios     # For iOS
npx expo run:android # For Android
```
This is required because `react-native-localize` needs native module registration.

#### Core Implementation
- **react-i18next**: Main internationalization framework
- **react-native-localize**: Device language detection
- **AsyncStorage persistence**: Language preferences saved locally
- **Real-time switching**: Language changes apply immediately without app restart

#### Language System (`stores/languageStore.ts`)
- **System detection**: Automatically detects device language on first launch
- **Manual override**: Users can select specific language in settings
- **Fallback**: Defaults to English if device language is not supported
- **Persistence**: User preference saved across app restarts

#### Translation Structure (`locales/`)
```
locales/
├── hu/translation.json    # Hungarian translations
└── en/translation.json    # English translations
```

#### Translation Key Structure
```json
{
  "common": { "loading", "error", "success", "cancel", "ok", ... },
  "auth": {
    "login": { "title", "subtitle", "emailLabel", ... },
    "register": { "title", "subtitle", ... },
    "validation": { "emailRequired", "passwordTooShort", ... }
  },
  "settings": { "title", "profile", "theme", "language", ... },
  "theme": { "light", "dark", "system", "selection", ... },
  "language": { "hungarian", "english", "system", ... },
  "tabs": { "home", "map", "favourite", "profile" }
}
```

#### Usage in Components
```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <Text>{t('auth.login.title')}</Text>
  );
}
```

#### Language Options
- **Hungarian (hu)**: Full translation for Hungarian users
- **English (en)**: Full translation for international users  
- **System**: Follows device language preference (hu/en)

#### Adding New Translations
1. Add translation keys to both `locales/hu/translation.json` and `locales/en/translation.json`
2. Use `t('category.subcategory.key')` in components
3. Always provide both Hungarian and English translations
4. Follow the existing hierarchical structure for consistency

### Common Issues
- **Location timeout**: Default timeout is 10 seconds, falls back to lower accuracy
- **Token refresh**: Automatic every 23 hours, can be manually triggered
- **Marker loading**: Uses cached results while fetching fresh data
- **Authentication**: Sessions persist for 14 days with automatic refresh

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

## Multilingual Implementation Guidelines
CRITICAL: When creating new components or screens, ALWAYS implement proper multilingual support:

1. **NEVER use hardcoded strings** - Always use `t('translation.key')` from react-i18next
2. **Add translations to BOTH language files** - Update both `locales/hu/translation.json` and `locales/en/translation.json`
3. **Import useTranslation hook** - Add `const { t } = useTranslation();` to every component with text
4. **Follow naming convention** - Use hierarchical keys like `auth.login.title` or `settings.profile.subtitle`
5. **Test in both languages** - Verify text displays correctly in Hungarian and English
6. **Include all text elements** - Labels, placeholders, buttons, alerts, error messages, etc.