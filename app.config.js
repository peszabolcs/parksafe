import 'dotenv/config';

export default ({ config }) => {
    return {
        ...config,
        extra: {
            eas: {
                projectId: process.env.EXPO_PROJECT_ID || '47616e89-2706-4676-a83e-068bc9027f7a',
            }
        },
        ios: {
            ...config.ios,
            config: {
                googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || 'placeholder-for-dev'
            }
        },
        android: {
            ...config.android,
            config: {
                googleMaps: {
                    apiKey: process.env.GOOGLE_MAPS_API_KEY || 'placeholder-for-dev'
                }
            }
        }
    };
};