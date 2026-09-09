import { getStoredApiKey } from "../shared/authStorage";

export const PRESTASHOP_BASE_URL =
  import.meta.env.VITE_PRESTASHOP_BASE_URL || "/prestashop-api";
export const PRESTASHOP_API_KEY =
  import.meta.env.VITE_PRESTASHOP_API_KEY || "HTWWZAQGS91LQK2NA67DBS4LZ5EGRNFK";
export const SESSION_TTL_MINUTES = Number(
  import.meta.env.VITE_SESSION_TTL_MINUTES || "0",
);

const getActiveApiKey = () => getStoredApiKey() || PRESTASHOP_API_KEY;

export const getAuthHeader = () =>
  `Basic ${btoa(`${getActiveApiKey()}:`)}`;
