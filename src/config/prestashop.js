import { getStoredApiKey } from "../shared/authStorage";

export const PRESTASHOP_BASE_URL = "/prestashop-api";
export const PRESTASHOP_API_KEY = "HTWWZAQGS91LQK2NA67DBS4LZ5EGRNFK";


const getActiveApiKey = () => getStoredApiKey() || PRESTASHOP_API_KEY;

export const getAuthHeader = () =>
  `Basic ${btoa(`${getActiveApiKey()}:`)}`;
