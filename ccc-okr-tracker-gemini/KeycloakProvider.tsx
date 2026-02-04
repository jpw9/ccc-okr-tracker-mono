// 📁 File: KeycloakProvider.tsx

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import Keycloak, { KeycloakInitOptions, KeycloakProfile } from 'keycloak-js';
import { Loader, Shield } from 'lucide-react'; 
import * as DataService from './services/dataService'; 
import { User, Permission } from './types'; 

// --- 1. INSTANCE AND PROMISE TRACKING (External/Static) ---
const keycloakInstance = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
});

let keycloakInitializationPromise: Promise<boolean> | null = null;

const initOptions: KeycloakInitOptions = {
  onLoad: 'check-sso', 
  // silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
  pkceMethod: 'S256',
  checkLoginIframe: false, // Disable iframe to avoid CSP issues
};

// --- 2. Context Definition ---
interface AuthContextType {
  isAuthenticated: boolean;
  keycloak: Keycloak | null;
  token: string | null;
  userProfile: KeycloakProfile | null;
  currentUserLogin: string | null;
  appUser: User | null; 
  permissions: Set<Permission>; 
  loading: boolean;
  logout: () => void;
  login: () => void;
  refreshAppUser: () => Promise<void>; 
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  keycloak: null,
  token: null,
  userProfile: null,
  currentUserLogin: null,
  appUser: null,
  permissions: new Set(),
  loading: true,
  logout: () => {},
  login: () => {},
  refreshAppUser: async () => {}, 
});

export const useAuth = () => useContext(AuthContext); 

// --- 3. Provider Component ---
export const KeycloakProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState<KeycloakProfile | null>(null);
  const [appUser, setAppUser] = useState<User | null>(null); 
  const [loading, setLoading] = useState(true);
  
  // NEW STATE: A simple state change to force context consumers to update
  const [userRefreshSignal, setUserRefreshSignal] = useState(0); 

  const kc = useMemo(() => keycloakInstance, []); 

  // Function to fetch the application user
  const fetchAndSetAppUser = useCallback(async (token: string) => {
      try {
          const currentAppUser = await DataService.getCurrentAppUser(token);
          setAppUser(currentAppUser);
      } catch (error: any) {
          console.warn("Keycloak user is not defined in application database or fetching failed:", error.message);
          setAppUser(null);
      }
  }, []);

  // MODIFIED: Exposed function now refreshes data AND toggles the signal
  const refreshAppUser = useCallback(async () => {
      if (kc.token) {
          await fetchAndSetAppUser(kc.token);
          // CRITICAL FIX: Toggle a primitive state to force context consumers to re-render.
          setUserRefreshSignal(prev => prev + 1); 
      }
  }, [kc, fetchAndSetAppUser]);


  // --- Core Initialization Effect ---
  useEffect(() => {
    let isCancelled = false;
    let refreshInterval: number | undefined;

    if (!keycloakInitializationPromise) {
      keycloakInitializationPromise = kc.init(initOptions);
    }

    keycloakInitializationPromise
      .then(async (authenticated) => {
        if (isCancelled) return;

        if (!authenticated) {
            kc.login();
            return; 
        }

        // --- ONLY EXECUTE BELOW IF AUTHENTICATED ---
        setIsAuthenticated(authenticated);
        
        // Load Keycloak Profile
        const profile = await kc.loadUserProfile();
        setUserProfile(profile);
        
        // Initial Fetch of Application User (Relies on fetchAndSetAppUser which sets appUser)
        if (kc.token) {
            await fetchAndSetAppUser(kc.token);
        }

        // Setup Token Refresh
        refreshInterval = window.setInterval(() => {
          kc.updateToken(5000) 
            .then((refreshed) => {
              if (refreshed) {
                console.debug("Token successfully refreshed.");
              }
            })
            .catch(() => {
              console.error('Failed to refresh token. Forcing logout.');
              clearInterval(refreshInterval); 
              kc.logout();
            });
        }, 5000000); 
      })
      .catch((error) => {
        console.error('Keycloak initialization failed:', error);
      })
      .finally(() => {
        if (!isCancelled) {
          setLoading(false);
        }
      });
      
    // Cleanup: 
    return () => {
      isCancelled = true;
      if (refreshInterval !== undefined) {
        clearInterval(refreshInterval);
      }
    };
  }, [kc, fetchAndSetAppUser]); 

  // Derive permissions set from the fetched appUser 
  const permissions = useMemo(() => {
    const perms = new Set<Permission>();
    if (appUser && appUser.roles) {
      appUser.roles.forEach(role => {
        role.permissions.forEach((p: Permission) => perms.add(p));
      });
    }
    return perms;
  }, [appUser]);

  // --- Context Value and Handlers ---
  const contextValue = useMemo(() => ({
    isAuthenticated,
    keycloak: kc,
    token: kc.token || null,
    userProfile,
    currentUserLogin: userProfile?.preferred_username || userProfile?.email || null,
    appUser, 
    permissions, 
    loading,
    logout: () => kc.logout({ redirectUri: window.location.origin }),
    login: () => kc.login(),
    refreshAppUser, 
  }), [isAuthenticated, userProfile, appUser, permissions, loading, kc, refreshAppUser, userRefreshSignal]); // CRITICAL FIX: Add userRefreshSignal dependency here to force context re-render

  // --- Rendering Logic ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <Loader className="w-8 h-8 text-brand-600 animate-spin" />
        <p className="mt-4 text-slate-600">Checking authentication...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-4">
              <div className="bg-white p-8 rounded-xl shadow-xl max-w-sm text-center border border-slate-200">
                  <Shield className="w-12 h-12 text-brand-500 mx-auto mb-4" />
                  <h1 className="text-xl font-bold text-slate-800">Access Required</h1>
                  <p className="text-slate-500 mt-2 mb-6">You must log in to access the CCC OKR Tracker.</p>
                  <button onClick={contextValue.login} className="w-full px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium">
                      Login via Keycloak
                  </button>
              </div>
        </div>
    );
  }


  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};