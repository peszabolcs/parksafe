# Mapbox Setup Guide

## Quick Setup

1. **Get a Mapbox Token**:
   - Go to [Mapbox Account](https://account.mapbox.com/access-tokens/)
   - Create a new token or use the default public token
   - Copy the token (it should start with `pk.`)

2. **Add to Environment**:
   Create or update your `.env` file:
   ```bash
   EXPO_PUBLIC_MAPBOX_PUBLIC_KEY=pk.your_actual_token_here
   ```

3. **Rebuild the App**:
   ```bash
   npx expo prebuild --clean
   ```

4. **Run the App**:
   ```bash
   # For iOS
   npx expo run:ios
   
   # For Android
   npx expo run:android
   ```

## Features

- ✅ Full Mapbox map with theme support
- ✅ Colored markers by type (parking, bicycle service, repair stations)
- ✅ Automatic clustering
- ✅ Search functionality
- ✅ Recenter to user location
- ✅ List view with filtering
- ✅ Favourite management
- ✅ Navigation integration

## Troubleshooting

If you see "native code not available" error:
1. Make sure you have a valid Mapbox token
2. Run `npx expo prebuild --clean`
3. Rebuild and run the app

## Files

- `components/MapboxMap.tsx` - Main map component
- `lib/mapbox.ts` - Configuration and utilities
- `app/(tabs)/map.tsx` - Map screen using MapboxMap

The implementation is clean, simple, and ready to use! 