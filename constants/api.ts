import { Platform } from 'react-native';

export const API_BASE_URL = Platform.OS === 'web' ? '' : 'http://74.208.127.250/';

export const STORAGE_KEYS = {
    TOKEN: 'userToken',
    USER_DATA: 'userData',
} as const;