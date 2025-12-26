import React from 'react';

function AdminFooter({ user }) {
    return (
        <footer className="bg-gray-800 text-white py-4 mt-12">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <p className="text-gray-400 text-sm">
                        &copy; 2024 YallaEvent Admin Panel
                    </p>
                    <div className="mt-2 md:mt-0">
                        <span className="text-sm text-gray-300">
                            {user ? `Admin: ${user.email}` : ''}
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default AdminFooter;