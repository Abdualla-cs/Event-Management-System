import React, { useState } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function RegisterPage({ event, onSubmit, setPage }) {
    const [formData, setFormData] = useState({ name: '', email: '' });
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!event) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <h2 className="text-2xl font-bold text-red-600">Event not found</h2>
                <button
                    onClick={() => setPage('events')}
                    className="mt-4 bg-[#FC350B] text-white px-6 py-2 rounded-md hover:bg-[#D92B0A] transition-colors"
                >
                    Back to Events
                </button>
            </div>
        );
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await onSubmit(event.id, formData);
            if (result) {
                setIsSubmitted(true);
            } else {
                setError('Registration failed. Please try again.');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
            console.error('Registration error:', err);
        } finally {
            setLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg text-center">
                    <div className="text-green-500 text-5xl mb-4">✓</div>
                    <h2 className="text-2xl font-bold mb-4 text-green-600">Registration Successful!</h2>
                    <p className="text-gray-600 mb-6">
                        You are registered for <strong>{event.name}</strong>.
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={() => setPage('details')}
                            className="w-full bg-[#FC350B] text-white px-6 py-3 rounded-md hover:bg-[#D92B0A] transition-colors"
                        >
                            Back to Event Details
                        </button>
                        <button
                            onClick={() => setPage('events')}
                            className="w-full bg-gray-500 text-white px-6 py-3 rounded-md hover:bg-gray-600 transition-colors"
                        >
                            Browse More Events
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-md mx-auto">
                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold mb-2 text-gray-800">Register for</h2>
                    <h3 className="text-xl font-semibold mb-6 text-[#FC350B]">{event.name}</h3>

                    {event.ticket_price > 0 && (
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                            <p className="text-yellow-800 font-semibold">
                                Ticket Price: ${event.ticket_price || event.ticketPrice || 0}
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-red-600">{error}</p>
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block text-gray-700 mb-2">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC350B] focus:border-transparent"
                            placeholder="Enter your full name"
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-700 mb-2">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FC350B] focus:border-transparent"
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                    >
                        {loading ? 'Processing...' : 'Confirm Registration'}
                    </button>

                    <div className="mt-4 text-center">
                        <button
                            type="button"
                            onClick={() => setPage('details')}
                            className="text-[#FC350B] hover:text-[#D92B0A] font-medium"
                        >
                            ← Back to Event Details
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default RegisterPage;