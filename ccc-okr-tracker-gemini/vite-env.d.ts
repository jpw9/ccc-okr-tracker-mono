// File: vite-env.d.ts

/// <reference types="vite/client" />

interface ImportMetaEnv {
    // Define your custom environment variables here
    readonly VITE_API_BASE_URL: string;
    readonly VITE_KEYCLOAK_URL: string;
    readonly VITE_KEYCLOAK_REALM: string;
    readonly VITE_KEYCLOAK_CLIENT_ID: string;
    // Add other VITE_ variables used in your .env files
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}