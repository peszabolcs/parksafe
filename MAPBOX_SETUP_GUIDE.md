# 🗺️ Mapbox Setup Guide

## Step 1: Get Mapbox Public Key

1. Go to [Mapbox Account](https://account.mapbox.com/access-tokens/)
2. Sign in or create an account
3. Copy your **Public Key** (starts with `pk.`)

## Step 2: Create .env File

Create a file called `.env` in your project root with:

```env
EXPO_PUBLIC_MAPBOX_PUBLIC_KEY=pk.your_actual_public_key_here
```

**Replace `pk.your_actual_public_key_here` with your real Mapbox public key**

## Step 3: Restart the App

1. Stop the Expo development server (Ctrl+C)
2. Run: `npx expo start --clear`
3. Rebuild the app

## Step 4: Verify Setup

The debug overlay should show:
- ✅ "Mapbox: Token OK"
- 🔴 "RED TEST MARKER should be visible"
- A red circle in Szeged center

## Troubleshooting

If you still don't see markers:

1. **Check .env file exists** in project root
2. **Verify public key format**: Should start with `pk.`
3. **Restart with cache clear**: `npx expo start --clear`
4. **Check console logs** for Mapbox errors

## Example .env File

```env
EXPO_PUBLIC_MAPBOX_PUBLIC_KEY=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNrZXhhbXBsZSJ9.example
```

**Note**: Never commit your `.env` file to git (it's already in .gitignore) 