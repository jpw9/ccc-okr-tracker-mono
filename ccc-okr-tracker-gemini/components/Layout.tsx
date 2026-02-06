import React, { useRef, useState, useEffect } from 'react';
import { LayoutDashboard, Target, Layers, Settings, LogOut, ChevronRight, Menu as MenuIcon, Search, Filter, Check, Users, Shield, X, Network } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { Project, Permission } from '../types';
import { useAuth } from '../KeycloakProvider';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  allProjects: Project[];
  selectedProjectIds: number[];
  setSelectedProjectIds: (ids: number[]) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, activeTab, setActiveTab, 
  allProjects, selectedProjectIds, setSelectedProjectIds,
  searchQuery, setSearchQuery
}) => {
  const { theme } = useTheme();
  // NEW: Get user profile and logout function
  const { userProfile, currentUserLogin, logout, permissions } = useAuth(); 
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = React.useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 
  const projectMenuRef = useRef<HTMLDivElement>(null);

  // Derive display name and initials
  const displayName = userProfile?.firstName || userProfile?.name || 'User';
  const displayEmail = userProfile?.email || '';
  const initials = (displayName.match(/\b\w/g) || []).join('').toUpperCase().substring(0, 2) || 'AU';
  const userRole = userProfile?.realmAccess?.roles?.find(role => role.toLowerCase().includes('user')) || userProfile?.realmAccess?.roles?.[0] || 'Standard User';
  const can = (permission: Permission) => permissions.has(permission);
  // Close project menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectMenuRef.current && !projectMenuRef.current.contains(event.target as Node)) {
        setIsProjectMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const NavItem = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => {
          setActiveTab(id);
          setIsMobileMenuOpen(false);
        }}
        className={`group flex items-center w-full px-4 py-3 text-sm font-medium transition-all duration-200 rounded-lg mx-2 my-1 ${isSidebarOpen ? 'w-auto' : 'justify-center'} ${
          isActive 
            ? 'bg-brand-600 text-white shadow-md' 
            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Icon className={`w-5 h-5 mr-3 transition-transform ${isSidebarOpen ? '' : 'mr-0' } ${isActive ? '' : 'group-hover:scale-110'}`} />
        {isSidebarOpen && <span>{label}</span>}
        {isActive && isSidebarOpen && <ChevronRight className="w-4 h-4 ml-auto opacity-70" />}
      </button>
    );
  };

  const toggleProjectSelection = (id: number) => {
    if (selectedProjectIds.includes(id)) {
      setSelectedProjectIds(selectedProjectIds.filter(pid => pid !== id));
    } else {
      setSelectedProjectIds([...selectedProjectIds, id]);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar - Desktop */}
      <aside className={`hidden md:flex flex-col ${isSidebarOpen ? 'w-72' : 'w-20'} bg-slate-900 border-r border-slate-800 shadow-xl z-20 transition-all duration-300 ease-in-out`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
           <div className={`flex items-center ${isSidebarOpen ? '' : 'hidden'}`}>
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 mr-3 shadow-lg shadow-brand-500/30"></div>
             <div>
               <span className="block text-lg font-bold text-white tracking-tight leading-none">CCC OKR</span>
               <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Tracker</span>
             </div>
           </div>
           {/* Burger icon for desktop sidebar toggle */}
           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-2 rounded-md hover:bg-slate-800 ${isSidebarOpen ? 'ml-auto' : 'mx-auto'}`}>
              {isSidebarOpen ? <X className="w-5 h-5 text-slate-400" /> : <MenuIcon className="w-5 h-5 text-slate-400" />}
           </button>
        </div>
        
        <div className="px-4 py-6 overflow-y-auto">
          {isSidebarOpen && <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Main Menu</p>}
          <nav className="space-y-1">
            {/* NEW: Conditional rendering based on permission */}
            {can('VIEW_DASHBOARD') && <NavItem id="dashboard" icon={LayoutDashboard} label="Executive Dashboard" />}
            {(can('VIEW_STRATEGY') || can('MANAGE_STRATEGY')) && <NavItem id="projects" icon={Layers} label="Strategy & OKRs" />}
            {(can('VIEW_STRATEGY') || can('MANAGE_STRATEGY')) && <NavItem id="mindmap" icon={Network} label="Mindmap" />}
          </nav>

          {isSidebarOpen && <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-8">Personal</p>}
          <nav className="space-y-1">
            {/* My Objectives is generally restricted to those who can edit their own */}
            {can('EDIT_OWN_OBJECTIVES') && <NavItem id="my-objectives" icon={Target} label="My Objectives" />}
            <NavItem id="settings" icon={Settings} label="System Settings" />
          </nav>
          
          {/* NEW: Conditional rendering for Admin section wrapper */}
          {(can('MANAGE_USERS') || can('MANAGE_ROLES')) && (
            <>
              {isSidebarOpen && <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-8">Admin</p>}
              <nav className="space-y-1">
                {can('MANAGE_USERS') && <NavItem id="user-management" icon={Users} label="User Management" />}
                {can('MANAGE_ROLES') && <NavItem id="role-management" icon={Shield} label="Role Management" />}
              </nav>
            </>
          )}
        </div>

        <div className="mt-auto p-4 border-t border-slate-800">
          <div className={`flex items-center p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer border border-slate-700/50 ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0">
              {/* MODIFIED: Display user initials */}
              {initials}
            </div>
            {isSidebarOpen && (
                <div className="ml-3 overflow-hidden">
                  {/* MODIFIED: Display user name and login/email */}
                  <p className="text-sm font-medium text-white truncate">{displayName}</p>
                  <p className="text-xs text-slate-400 truncate">{currentUserLogin || displayEmail}</p>
                </div>
            )}
            {/* MODIFIED: Use logout function */}
            <button onClick={logout} className={`p-2 rounded-md hover:bg-slate-700 transition-colors ${isSidebarOpen ? 'ml-auto' : 'mx-auto'}`} title="Logout">
              <LogOut className="w-5 h-5 text-slate-500 hover:text-white" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Wrapper - adjust width based on sidebar state */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header (reusing Menu icon for mobile toggle) */}
        <header className="md:hidden flex items-center justify-between bg-slate-900 text-white p-4 shadow-md z-30">
           <div className="flex items-center">
             <div className="w-8 h-8 rounded-lg bg-brand-500 mr-3"></div>
             <span className="text-lg font-bold">CCC OKR</span>
           </div>
           <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-md hover:bg-slate-800">
             <MenuIcon className="w-6 h-6" />
           </button>
        </header>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-slate-900 border-b border-slate-800 z-40 shadow-xl p-4">
             <nav className="space-y-2">
                {/* NEW: Check permission for Dashboard and Strategy */}
                {can('VIEW_DASHBOARD') && <NavItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />}
                {can('MANAGE_STRATEGY') && <NavItem id="projects" icon={Layers} label="Projects & OKRs" />}
                
                <NavItem id="my-objectives" icon={Target} label="My Objectives" />
                <NavItem id="settings" icon={Settings} label="Settings" />
                
                {/* NEW: Conditional rendering for Admin section in mobile */}
                {(can('MANAGE_USERS') || can('MANAGE_ROLES')) && (
                   <div className="border-t border-slate-800 my-2 pt-2">
                       {can('MANAGE_USERS') && <NavItem id="user-management" icon={Users} label="User Management" />}
                       {can('MANAGE_ROLES') && <NavItem id="role-management" icon={Shield} label="Role Management" />}
                   </div>
                )}
            </nav>
            <div className="mt-4 border-t border-slate-800 pt-4">
                <button 
                    onClick={logout} 
                    className="flex items-center w-full px-4 py-3 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg"
                >
                    <LogOut className="w-5 h-5 mr-3" /> Logout
                </button>
            </div>
          </div>
        )}

        {/* Top Header for Desktop */}
        <header className="hidden md:flex items-center justify-between h-16 bg-white border-b border-slate-200 px-8 shadow-sm z-10">
            <div className="flex items-center text-sm text-slate-500">
              <button 
                onClick={() => setActiveTab('dashboard')} 
                className="font-medium text-slate-900 hover:text-brand-600 hover:underline transition-colors"
              >
                Workspace
              </button>
              <ChevronRight className="w-4 h-4 mx-2" />
              <span>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ')}</span>
            </div>

            <div className="flex items-center gap-4">
               {/* Global Search */}
               <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-64 pl-10 pr-3 py-1.5 border border-slate-200 rounded-md leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-all"
                    placeholder="Global Search..."
                  />
               </div>

               {/* Project Filter */}
               <div className="relative" ref={projectMenuRef}>
                  <button 
                    onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
                    className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border transition-colors ${selectedProjectIds.length > 0 ? 'bg-brand-50 text-brand-700 border-brand-200' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                  >
                    <Filter className="w-4 h-4" />
                    <span>
                      {selectedProjectIds.length === 0 
                        ? 'All Projects' 
                        : `${selectedProjectIds.length} Project${selectedProjectIds.length > 1 ? 's' : ''}`}
                    </span>
                  </button>

                  {isProjectMenuOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                        <div className="px-4 py-3 border-b border-slate-100 mb-1">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Filter Projects</p>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                          <button 
                            onClick={() => setSelectedProjectIds([])}
                            className="flex items-center w-full px-4 py-2.5 text-sm text-left hover:bg-slate-50 transition-colors"
                          >
                             <div className={`w-4 h-4 mr-3 border rounded flex items-center justify-center transition-all ${selectedProjectIds.length === 0 ? 'bg-brand-600 border-brand-600' : 'border-slate-300 bg-white'}`}>
                                {selectedProjectIds.length === 0 && <Check className="w-3 h-3 text-white" />}
                             </div>
                             <span className={selectedProjectIds.length === 0 ? 'font-medium text-slate-900' : 'text-slate-600'}>All Projects</span>
                          </button>
                          
                          {/* FIX: Filter out inactive (deleted/archived) projects before mapping */}
                          {allProjects
                            .filter(p => p.isActive)
                            .map(p => {
                            const isSelected = selectedProjectIds.includes(p.id);
                            return (
                              <button 
                                key={p.id}
                                onClick={() => toggleProjectSelection(p.id)}
                                className="flex items-center w-full px-4 py-2.5 text-sm text-left hover:bg-slate-50 transition-colors"
                              >
                                <div className={`w-4 h-4 mr-3 border rounded flex items-center justify-center transition-all ${isSelected ? 'bg-brand-600 border-brand-600' : 'border-slate-300 bg-white'}`}>
                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                  <span className="truncate text-slate-700 font-medium">{p.title}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                    </div>
                  )}
               </div>
            </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-4 md:p-8 bg-slate-50 scroll-smooth">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;