import { SESSION_TTL_MINUTES } from "../config/prestashop";

const STORAGE_KEY = "fo_customer";
const STORAGE_EXP_KEY = "fo_customer_exp";

const getExpiryMs = () =>
    SESSION_TTL_MINUTES > 0 ? SESSION_TTL_MINUTES * 60 * 1000 : 0;

const isExpired = () => {
    const exp = Number(localStorage.getItem(STORAGE_EXP_KEY) || 0);
    return exp > 0 && Date.now() > exp;
};

export const getStoredCustomer = () => {
    if (isExpired()) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_EXP_KEY);
        return null;
    }
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
};

export const setStoredCustomer = (customer) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customer));
    const ttl = getExpiryMs();
    if (ttl > 0) {
        localStorage.setItem(STORAGE_EXP_KEY, String(Date.now() + ttl));
    } else {
        localStorage.removeItem(STORAGE_EXP_KEY);
    }
};

export const clearStoredCustomer = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_EXP_KEY);
};

export const isCustomerAuthenticated = () => {
    return getStoredCustomer() !== null;
};
