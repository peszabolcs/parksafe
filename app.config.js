export default ({ config }) => ({
  ...config,
  name: "ParkSafe",
  slug: "parksafe",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/logo.png",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    ...config.ios,
    bundleIdentifier: "com.parksafe.app",
    config: {
      ...config.ios?.config,
      // Mapbox configuration for iOS
      mapbox: {
        publicKey: process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_KEY,
      },
    },
  },
  android: {
    ...config.android,
    package: "com.parksafe.app",
    config: {
      ...config.android?.config,
      // Mapbox configuration for Android
      mapbox: {
        publicKey: process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_KEY,
      },
    },
  },
  web: {
    bundler: "metro",
    favicon: "./assets/images/favicon.png"
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        "image": "./assets/images/splash-icon.png",
        "imageWidth": 200,
        "resizeMode": "contain",
        "backgroundColor": "#ffffff"
      }
    ],
    [
      "expo-location",
      {
        "locationAlwaysAndWhenInUsePermission": "Allow ParkSafe to use your location to find nearby parking spots and repair shops."
      }
    ],
    [
      "@rnmapbox/maps",
      {
        "mapboxPublicKey": process.env.EXPO_PUBLIC_MAPBOX_PUBLIC_KEY,
      }
    ]
  ]
}); 