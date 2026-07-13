import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '../constants/api';

export type UsuarioData = {
    idUsuario: number;
    email: string;
    rol: string;
    permisos: string[];
};

export async function saveSession(token: string, usuario: UsuarioData) {
    await SecureStore.setItemAsync(STORAGE_KEYS.TOKEN, token);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(usuario));
}

export async function getToken(): Promise<string | null> {
    return SecureStore.getItemAsync(STORAGE_KEYS.TOKEN);
}

export async function getUsuario(): Promise<UsuarioData | null> {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return raw ? JSON.parse(raw) : null;
}

export async function clearSession() {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
}