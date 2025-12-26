import React, { useState } from 'react';

function AdminHeader({ page, setPage, user, onLogout }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const NavLink = ({ targetPage, children }) => {
        const isActive = page === targetPage;
        return (
            <li>
                <button
                    onClick={() => {
                        setPage(targetPage);
                        setIsMobileMenuOpen(false);
                    }}
                    className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium ${isActive
                            ? 'bg-gray-100 text-[#FC350B]'
                            : 'text-white hover:bg-white hover:bg-opacity-20'
                        } transition-colors`}
                >
                    {children}
                </button>
            </li>
        );
    };

    return (
        <header className="bg-[#FC350B] text-white shadow-md">
            <nav className="container mx-auto px-4 py-3">
                <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setPage('dashboard')}
                            className="text-xl md:text-2xl font-bold flex items-center gap-2"
                        >
                            <span>YallaEvent Admin</span>
                        </button>
                        <span className="hidden md:inline text-sm bg-white text-[#FC350B] px-2 py-1 rounded-full">
                            {user?.email || 'Admin'}
                        </span>
                    </div>

                    <ul className="hidden md:flex space-x-4 items-center">
                        <NavLink targetPage="dashboard">Dashboard</NavLink>
                        <NavLink targetPage="manage">
                            <span className="bg-yellow-300 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">
                                Manage Events
                            </span>
                        </NavLink>
                        <NavLink targetPage="contacts">Contacts</NavLink>
                        <li>
                            <button
                                onClick={() => {
                                    onLogout();
                                    setIsMobileMenuOpen(false);
                                }}
                                className="px-3 py-1 bg-white text-[#FC350B] rounded-md hover:bg-gray-100 transition-colors text-sm"
                            >
                                Logout
                            </button>
                        </li>
                    </ul>

                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden p-2 rounded-md bg-white bg-opacity-20"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {isMobileMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>

                {isMobileMenuOpen && (
                    <div className="md:hidden mt-4 pb-4 border-t border-white border-opacity-20 pt-4">
                        <ul className="space-y-2">
                            <NavLink targetPage="dashboard">Dashboard</NavLink>
                            <NavLink targetPage="manage">
                                <span className="bg-yellow-300 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">
                                    Manage Events
                                </span>
                            </NavLink>
                            <NavLink targetPage="contacts">Contacts</NavLink>
                            <li>
                                <div className="px-3 py-2 text-sm">
                                    <span className="block text-white opacity-80">Logged in as: {user?.email}</span>
                                    <button
                                        onClick={() => {
                                            onLogout();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="mt-2 w-full text-left px-3 py-2 bg-white text-[#FC350B] rounded-md font-medium"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </li>
                        </ul>
                    </div>
                )}
            </nav>
        </header>
    );
}

export default AdminHeader;