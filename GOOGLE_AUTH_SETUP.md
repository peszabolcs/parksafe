# Google Authentication Setup Guide

## What's Already Done ✅

1. **Dependencies installed**: `expo-auth-session` and `expo-crypto`
2. **Login screen updated**: Google sign-in button and logic added
3. **App configuration**: Scheme "parksafe" already configured in app.json

## What You Need to Do 🔧

### 1. Get Your Google Client ID

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one)
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Choose "Android" as application type
6. For Android, you'll need:
   - Package name: `com.parksafe.app` (already in your app.json)
   - SHA-1 certificate fingerprint (see step 2)

### 2. Get Your SHA-1 Certificate Fingerprint

For development, run this command in your project directory:
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

For production, you'll need the SHA-1 from your release keystore.

### 3. Update the Client ID in Your Code

In `app/login.tsx`, replace `'YOUR_GOOGLE_CLIENT_ID'` on line 35 with your actual Google Client ID:

```typescript
clientId: 'your-actual-google-client-id-here.apps.googleusercontent.com',
```

### 4. Configure Supabase

1. In your Supabase dashboard, go to Authentication → Providers
2. Enable Google provider
3. Add your Google Client ID and Client Secret
4. Set the redirect URL to: `https://your-project.supabase.co/auth/v1/callback`

### 5. Test the Integration

1. Run your app: `npm start`
2. Try the Google sign-in button
3. The OAuth flow should redirect to Google and back to your app

## Troubleshooting

- **"Invalid client" error**: Make sure your Google Client ID is correct
- **"Redirect URI mismatch"**: Verify the redirect URI in Google Cloud Console matches your app's scheme
- **"Provider not enabled"**: Ensure Google provider is enabled in Supabase dashboard

## Security Notes

- Never commit your Google Client Secret to version control
- Use environment variables for sensitive configuration in production
- The Client ID is safe to include in your app code 