import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, FileText, Package, Users, PieChart,
    ChevronRight, Zap, Menu, X, Bell, AlertTriangle
} from 'lucide-react';

const navItems = [
    {
        label: 'Dashboard',
        to: '/',
        icon: LayoutDashboard,
        exact: true,
    },
    { type: 'divider', label: 'Business' },
    { label: 'Invoices', to: '/invoices', icon: FileText },
    { label: 'Customers', to: '/customers', icon: Users },
    { label: 'Inventory', to: '/add-product', icon: Package },
    { label: 'Low Stock', to: '/low-stock', icon: AlertTriangle },
    { label: 'Reports', to: '/summary', icon: PieChart },
];

const Sidebar = ({ collapsed, location }) => {
    return (
        <aside
            className="flex flex-col h-full"
            style={{ background: 'var(--sidebar-bg)', width: collapsed ? 72 : 252, transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)' }}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
                <div
                    className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-lg"
                    style={{ background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)' }}
                >
                    A
                </div>
                {!collapsed && (
                    <div className="overflow-hidden">
                        <p className="text-white font-bold text-sm leading-tight truncate">Ambika Sales</p>
                        <p className="text-slate-500 text-xs font-medium">Invoice Manager</p>
                    </div>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                {navItems.map((item, idx) => {
                    if (item.type === 'divider') {
                        return collapsed ? null : (
                            <p key={idx} className="text-slate-600 text-[10px] font-bold uppercase tracking-widest px-3 pt-5 pb-1">
                                {item.label}
                            </p>
                        );
                    }

                    const Icon = item.icon;
                    const isActive = item.exact
                        ? location.pathname === item.to
                        : location.pathname.startsWith(item.to);

                    return (
                        <Link
                            key={item.to}
                            to={item.to}
                            className={`sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center' : ''}`}
                            title={collapsed ? item.label : undefined}
                        >
                            <Icon size={18} className="flex-shrink-0" />
                            {!collapsed && <span>{item.label}</span>}
                            {!collapsed && isActive && (
                                <ChevronRight size={14} className="ml-auto opacity-50" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom CTA */}
            {!collapsed && (
                <div className="m-3 p-4 rounded-xl" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)' }}>
                    <div className="flex items-center gap-2 mb-1">
                        <Zap size={14} className="text-yellow-300" />
                        <p className="text-white text-xs font-bold">Quick Invoice</p>
                    </div>
                    <p className="text-indigo-200 text-xs mb-3 leading-relaxed">Generate and print a new bill</p>
                    <Link
                        to="/invoices"
                        className="block w-full text-center bg-white/20 hover:bg-white/30 text-white text-xs font-bold py-2 rounded-lg transition-all"
                    >
                        Create Now →
                    </Link>
                </div>
            )}
        </aside>
    );
};

const Layout = ({ children, pageTitle, pageSubtitle, headerRight }) => {
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: '#f1f5f9' }}>
            {/* Sidebar */}
            <div className="hidden md:flex flex-col flex-shrink-0 h-full" style={{ width: collapsed ? 72 : 252, transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)' }}>
                <Sidebar collapsed={collapsed} location={location} />
            </div>

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top Header */}
                <header className="flex-shrink-0 flex items-center justify-between gap-4 px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200/70 z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setCollapsed(c => !c)}
                            className="hidden md:flex w-8 h-8 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            <Menu size={18} />
                        </button>
                        <div>
                            {pageTitle && (
                                <h1 className="text-lg font-bold text-slate-800 leading-tight">{pageTitle}</h1>
                            )}
                            {pageSubtitle && (
                                <p className="text-xs text-slate-500 font-medium mt-0.5">{pageSubtitle}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {headerRight}
                        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                            <Bell size={16} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-white" />
                        </button>
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                            A
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;
