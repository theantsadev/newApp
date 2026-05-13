export const PRESTASHOP_BASE_URL = "/prestashop-api";
export const PRESTASHOP_API_KEY = "HTWWZAQGS91LQK2NA67DBS4LZ5EGRNFK";

export const getAuthHeader = () =>
  `Basic ${btoa(`${PRESTASHOP_API_KEY}:`)}`;
