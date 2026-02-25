/**
 * roni/compositor/bus/uuid.js
 * Browser-safe UUIDv4 using Web Crypto API.
 */
export const randomUUID = () => crypto.randomUUID();
