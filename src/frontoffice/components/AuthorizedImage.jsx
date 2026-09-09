import { useEffect, useState } from "react";
import { getAuthHeader } from "../../config/prestashop";

const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' fill='%23f1f5f9'/%3E%3Cpath d='M30 78l18-22 16 18 10-12 16 20H30z' fill='%2394a3b8'/%3E%3Ccircle cx='44' cy='44' r='8' fill='%2394a3b8'/%3E%3Ctext x='60' y='102' text-anchor='middle' font-size='10' font-family='Arial, sans-serif' fill='%2394a3b8'%3EImage%3C/text%3E%3C/svg%3E";

const imageBlobCache = new Map();
const MAX_IMAGE_CACHE = 200;

const normalizeImageSrc = (src) => {
  if (!src) return "";
  if (src.startsWith("/prestashop-api/")) return src;

  try {
    const url = new URL(src, window.location.origin);
    const pathname = url.pathname.replace(/^\/prestashop\//, "/");
    return `/prestashop-api${pathname}`;
  } catch (err) {
    return src;
  }
};

const setCachedImage = (src, url) => {
  if (imageBlobCache.has(src)) return;
  imageBlobCache.set(src, url);

  if (imageBlobCache.size > MAX_IMAGE_CACHE) {
    const [oldestKey, oldestUrl] = imageBlobCache.entries().next().value;
    imageBlobCache.delete(oldestKey);
    if (oldestUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(oldestUrl);
    }
  }
};

const getCachedImageUrl = async (src) => {
  if (!src) return "";
  const normalizedSrc = normalizeImageSrc(src);
  if (imageBlobCache.has(normalizedSrc)) return imageBlobCache.get(normalizedSrc);

  try {
    const response = await fetch(normalizedSrc, {
      headers: { Authorization: getAuthHeader() },
    });

    if (!response.ok) {
      setCachedImage(normalizedSrc, FALLBACK_IMAGE);
      return FALLBACK_IMAGE;
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    setCachedImage(normalizedSrc, blobUrl);
    return blobUrl;
  } catch (err) {
    setCachedImage(normalizedSrc, FALLBACK_IMAGE);
    return FALLBACK_IMAGE;
  }
};

const AuthorizedImage = ({ src, alt, style, className }) => {
  const [resolvedSrc, setResolvedSrc] = useState(src || "");

  useEffect(() => {
    let isActive = true;

    if (!src) {
      setResolvedSrc("");
      return undefined;
    }

    getCachedImageUrl(src).then((url) => {
      if (!isActive) return;
      setResolvedSrc(url);
    });

    return () => {
      isActive = false;
    };
  }, [src]);

  if (!resolvedSrc) return null;

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      style={style}
      className={className}
      onError={(event) => {
        if (event.currentTarget.dataset.fallbackApplied) return;
        event.currentTarget.dataset.fallbackApplied = "true";
        event.currentTarget.src = FALLBACK_IMAGE;
      }}
    />
  );
};

export default AuthorizedImage;
