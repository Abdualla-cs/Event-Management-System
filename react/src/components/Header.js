import React, { useState } from 'react';
import { useAuth } from '../context/Providers.js';
import Logo from '../images/logo.png';

function Header({ page, setPage, isAdmin }) {
    const { user, logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        setPage('home');
        setIsMobileMenuOpen(false);
    };

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
                {/* Desktop Header */}
                <div className="flex justify-between items-center">
                    <button
                        onClick={() => setPage('home')}
                        className="text-xl md:text-2xl font-bold flex items-center gap-2"
                    >
                        <img
                            src={Logo}
                            alt="YallaEvent Logo"
                            className="w-8 h-8 md:w-10 md:h-10 rounded-full"
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                        <span className="hidden sm:inline">YallaEvent</span>
                    </button>

                    {/* Desktop Navigation - Hidden on mobile */}
                    <ul className="hidden md:flex space-x-4 items-center">
                        <NavLink targetPage="home">Home</NavLink>
                        <NavLink targetPage="about">About</NavLink>
                        <NavLink targetPage="events">Events</NavLink>
                        <NavLink targetPage="contact">Contact</NavLink>

                        {user && isAdmin && (
                            <>
                                <NavLink targetPage="dashboard">Dashboard</NavLink>
                                <NavLink targetPage="manage">
                                    <span className="bg-yellow-300 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">
                                        Manage
                                    </span>
                                </NavLink>
                            </>
                        )}
                    </ul>

                    {/* Mobile Menu Button */}
                    <div className="flex items-center space-x-2">
                        {user ? (
                            <div className="hidden sm:flex items-center space-x-2">
                                <span className="text-sm">Welcome, {user.username}</span>
                                <button
                                    onClick={handleLogout}
                                    className="px-3 py-1 bg-white text-[#FC350B] rounded-md hover:bg-gray-100 transition-colors text-sm"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setPage('login')}
                                className="hidden sm:block px-4 py-2 bg-white text-[#FC350B] rounded-md hover:bg-gray-100 transition-colors font-medium"
                            >
                                Login
                            </button>
                        )}

                        {/* Mobile Menu Toggle */}
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
                </div>

                {/* Mobile Navigation Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden mt-4 pb-4 border-t border-white border-opacity-20 pt-4">
                        <ul className="space-y-2">
                            <NavLink targetPage="home">Home</NavLink>
                            <NavLink targetPage="about">About</NavLink>
                            <NavLink targetPage="events">Events</NavLink>
                            <NavLink targetPage="contact">Contact</NavLink>

                            {user && isAdmin && (
                                <>
                                    <NavLink targetPage="dashboard">Dashboard</NavLink>
                                    <NavLink targetPage="manage">
                                        <span className="bg-yellow-300 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">
                                            Manage Events
                                        </span>
                                    </NavLink>
                                </>
                            )}

                            {/* Mobile Auth Buttons */}
                            {user ? (
                                <li>
                                    <div className="px-3 py-2 text-sm">
                                        <span className="block text-white opacity-80">Welcome, {user.username}</span>
                                        <button
                                            onClick={handleLogout}
                                            className="mt-2 w-full text-left text-red-200 hover:text-white"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                </li>
                            ) : (
                                <li>
                                    <button
                                        onClick={() => {
                                            setPage('login');
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="w-full text-left px-3 py-2 bg-white text-[#FC350B] rounded-md font-medium"
                                    >
                                        Login
                                    </button>
                                </li>
                            )}
                        </ul>
                    </div>
                )}
            </nav>
        </header>
    );
}

export default Header;