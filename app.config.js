export default ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    config: {
      ...config.android?.config,
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    },
  },
  ios: {
    ...config.ios,
    config: {
      ...config.ios?.config,
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    },
  },
}); 