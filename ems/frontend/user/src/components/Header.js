import React, { useState } from 'react';

function Header({ page, setPage }) {
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
                    <button
                        onClick={() => setPage('home')}
                        className="text-xl md:text-2xl font-bold flex items-center gap-2"
                    >
                        <span className="hidden sm:inline">YallaEvent</span>
                        <span className="sm:hidden">YE</span>
                    </button>

                    <ul className="hidden md:flex space-x-4 items-center">
                        <NavLink targetPage="home">Home</NavLink>
                        <NavLink targetPage="about">About</NavLink>
                        <NavLink targetPage="events">Events</NavLink>
                        <NavLink targetPage="contact">Contact</NavLink>
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
                            <NavLink targetPage="home">Home</NavLink>
                            <NavLink targetPage="about">About</NavLink>
                            <NavLink targetPage="events">Events</NavLink>
                            <NavLink targetPage="contact">Contact</NavLink>
                        </ul>
                    </div>
                )}
            </nav>
        </header>
    );
}

export default Header;