import 'dotenv/config';

export default ({ config }) => {
    return {
        ...config,
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