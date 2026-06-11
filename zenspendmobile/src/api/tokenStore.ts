// Persistent storage for JWT tokens and the cached user profile.
//
// Access/refresh tokens are sensitive, so they go in expo-secure-store
// (Keychain / Keystore). The cached user object is non-sensitive UI data and
// lives in AsyncStorage, which has no size constraints.
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../types';

const ACCESS_KEY = 'zenspend.access';
const REFRESH_KEY = 'zenspend.refresh';
const USER_KEY = 'zenspend.user';

export const tokenStore = {
  async getAccess() {
    return SecureStore.getItemAsync(ACCESS_KEY);
  },
  async getRefresh() {
    return SecureStore.getItemAsync(REFRESH_KEY);
  },
  async setTokens(access: string, refresh?: string | null) {
    await SecureStore.setItemAsync(ACCESS_KEY, access);
    if (refresh) {
      await SecureStore.setItemAsync(REFRESH_KEY, refresh);
    }
  },
  async getUser(): Promise<User | null> {
    const raw = await AsyncStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },
  async setUser(user: User) {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  async clear() {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  },
};
