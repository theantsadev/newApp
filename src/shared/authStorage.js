import { PRESTASHOP_API_KEY, SESSION_TTL_MINUTES } from "../config/prestashop";

const STORAGE_KEY = "prestashop_api_key";
const STORAGE_EXP_KEY = "prestashop_api_key_exp";

const getExpiryMs = () =>
    SESSION_TTL_MINUTES > 0 ? SESSION_TTL_MINUTES * 60 * 1000 : 0;

const isExpired = () => {
    const exp = Number(localStorage.getItem(STORAGE_EXP_KEY) || 0);
    return exp > 0 && Date.now() > exp;
};

export const getStoredApiKey = () => {
    if (isExpired()) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_EXP_KEY);
        return "";
    }
    return localStorage.getItem(STORAGE_KEY) || "";
};

export const setStoredApiKey = (apiKey) => {
    localStorage.setItem(STORAGE_KEY, apiKey);
    const ttl = getExpiryMs();
    if (ttl > 0) {
        localStorage.setItem(STORAGE_EXP_KEY, String(Date.now() + ttl));
    } else {
        localStorage.removeItem(STORAGE_EXP_KEY);
    }
};

export const clearStoredApiKey = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_EXP_KEY);
};

export const verifyApiKey = (apiKey) => apiKey === PRESTASHOP_API_KEY;

export const isAuthenticated = () => verifyApiKey(getStoredApiKey());
