import { PRESTASHOP_API_KEY } from "../config/prestashop";

const STORAGE_KEY = "prestashop_api_key";

export const getStoredApiKey = () => localStorage.getItem(STORAGE_KEY) || "";

export const setStoredApiKey = (apiKey) => {
    localStorage.setItem(STORAGE_KEY, apiKey);
};

export const clearStoredApiKey = () => {
    localStorage.removeItem(STORAGE_KEY);
};

export const verifyApiKey = (apiKey) => apiKey === PRESTASHOP_API_KEY;

export const isAuthenticated = () => verifyApiKey(getStoredApiKey());
