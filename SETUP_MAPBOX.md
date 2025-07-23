# Mapbox Setup Guide

## Quick Fix for "Mapbox Setup Required"

The map isn't showing because the Mapbox access token is missing. Here's how to fix it:

### Step 1: Get a Mapbox Token

1. Go to [Mapbox Account](https://account.mapbox.com/access-tokens/)
2. Sign up or log in
3. Create a new token or use the default public token
4. Copy the token (it should start with `pk.`)

### Step 2: Add Token to Environment

Create or update your `.env` file in the project root:

```bash
EXPO_PUBLIC_MAPBOX_PUBLIC_KEY=pk.your_actual_token_here
```

### Step 3: Restart the App

```bash
npx expo start --clear
```

### Step 4: Test

The map should now show:
- ✅ User location
- ✅ Markers for parking, services, etc.
- ✅ Debug overlay with marker counts

## Troubleshooting

If you still see issues:

1. **Check token format**: Should start with `pk.`
2. **Restart Expo**: Use `--clear` flag
3. **Check console logs**: Look for Mapbox token messages
4. **Verify .env file**: Make sure it's in the project root

## Alternative: Use Google Maps

If Mapbox continues to have issues, we can switch back to Google Maps temporarily.

---

**Note**: The app is currently showing a fallback screen because the Mapbox token is missing. Once you add the token, the full map will appear! 