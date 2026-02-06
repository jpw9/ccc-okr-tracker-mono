import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import HierarchyManager from './components/Hierarchy';
import MyObjectives from './components/MyObjectives';
import Mindmap from './components/Mindmap';
import Settings from './components/Settings';
import { UserManagement } from './components/Admin/UserManagement';
import { RoleManagement } from './components/Admin/RoleManagement';
import { ThemeProvider } from './components/ThemeContext';
import * as DataService from './services/dataService';
import { Project } from './types';
import { KeycloakProvider, useAuth } from './KeycloakProvider';

// New protected content wrapper, previously the default export of App.tsx
const ProtectedAppContent: React.FC = () => {
  // MODIFIED: Destructure appUser
  const { token, currentUserLogin, appUser } = useAuth(); 
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Global Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);

  // MODIFIED: refreshData now uses token
  const refreshData = useCallback(async () => {
    if (!token) return; // Should not happen if authenticated, but for safety
    try {
        const data = await DataService.getProjects(token);
        setProjects([...data]); 
    } catch (error) {
        console.error("Failed to fetch projects with token:", error);
    }
  }, [token]);

  useEffect(() => {
    // Only fetch data once token is available and authenticated state is confirmed
    if (token) {
        (async () => {
            await refreshData();
            setLoading(false);
        })();
    }
  }, [token, refreshData]);

  // --- Filtering Logic (Remains mostly unchanged) ---
  const filteredProjects = useMemo(() => {
    // 1. Filter by Project ID first
    let result = selectedProjectIds.length > 0 
      ? projects.filter(p => selectedProjectIds.includes(p.id))
      : projects;

    // 2. Deep Search Filter
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();

      const searchRecursive = (node: any): any | null => {
        const newNode = { ...node };
        
        // Match on Title or Description
        const matchesSelf = (node.title?.toLowerCase().includes(lowerQuery)) || 
                            (node.description?.toLowerCase().includes(lowerQuery));

        let hasMatchingChild = false;

        // Process children
        const childrenKeys = ['initiatives', 'goals', 'objectives', 'keyResults', 'actionItems'];
        
        for (const key of childrenKeys) {
          if (newNode[key] && Array.isArray(newNode[key])) {
             const filteredChildren = newNode[key]
                .map(searchRecursive)
                .filter((n: any) => n !== null);
             
             if (filteredChildren.length > 0) {
               hasMatchingChild = true;
               newNode[key] = filteredChildren;
             } else {
               newNode[key] = [];
             }
          }
        }

        // Return node if it matches OR has matching descendants
        return (matchesSelf || hasMatchingChild) ? newNode : null;
      };

      result = result.map(searchRecursive).filter(p => p !== null);
    }

    return result;
  }, [projects, selectedProjectIds, searchQuery]);

  const renderContent = () => {
    if (loading) return <div className="flex h-full items-center justify-center text-gray-500">Loading Application Data...</div>;

    // Pass the token to components that perform data modifications/fetches
    const tokenProp = { token: token || '' }; 
    
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard projects={filteredProjects} />;
      case 'projects':
        return (
          <HierarchyManager 
            projects={filteredProjects} 
            refreshData={refreshData} 
            isSearchActive={!!searchQuery}
            {...tokenProp}
          />
        );
      case 'mindmap':
        return <Mindmap projects={projects} />;
      case 'my-objectives':
        // FIX: Use the application user's login ID (e.g., "admin_user") if available, otherwise fallback to the Keycloak login/email.
        const assignedLogin = appUser?.login || currentUserLogin || '';
        return <MyObjectives projects={filteredProjects} currentUserLogin={assignedLogin} />;
      case 'user-management':
        return <UserManagement searchQuery={searchQuery} {...tokenProp} />;
      case 'role-management':
        return <RoleManagement searchQuery={searchQuery} {...tokenProp} />;
      case 'settings':
        // MODIFIED: Pass the token to SettingsView
        return <Settings refreshData={refreshData} {...tokenProp} />;
      default:
        return <Dashboard projects={filteredProjects} />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      allProjects={projects}
      selectedProjectIds={selectedProjectIds}
      setSelectedProjectIds={setSelectedProjectIds}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
    >
      {renderContent()}
    </Layout>
  );
};


const App: React.FC = () => (
    <ThemeProvider>
        {/* NEW: Wrap the entire app with KeycloakProvider */}
        <KeycloakProvider>
            <ProtectedAppContent />
        </KeycloakProvider>
    </ThemeProvider>
);

export default App;