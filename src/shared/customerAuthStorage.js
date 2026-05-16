const STORAGE_KEY = "fo_customer";

export const getStoredCustomer = () => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
};

export const setStoredCustomer = (customer) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customer));
};

export const clearStoredCustomer = () => {
    localStorage.removeItem(STORAGE_KEY);
};

export const isCustomerAuthenticated = () => {
    return getStoredCustomer() !== null;
};
