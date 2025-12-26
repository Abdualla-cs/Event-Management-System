import React, { useState } from 'react';

function LoginPage({ onLogin, setPage }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await onLogin(email, password);

        if (!result.success) {
            setError(result.error);
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">YallaEvent Admin</h1>
                    <p className="text-gray-600">Sign in to manage your events</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FC350B] focus:border-transparent transition-all"
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FC350B] focus:border-transparent transition-all"
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800 font-medium">Demo Credentials:</p>
                        <p className="text-sm text-blue-800 mt-1">
                            Email: abdalla@ems.org<br />
                            Password: adminabdalla
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#FC350B] text-white py-3 rounded-lg font-semibold hover:bg-[#D92B0A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            User interface available at{' '}
                            <button
                                type="button"
                                onClick={() => window.open('http://localhost:3000', '_blank')}
                                className="text-[#FC350B] hover:underline font-medium"
                            >
                                http://localhost:3000
                            </button>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;