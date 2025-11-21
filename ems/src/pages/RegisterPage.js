import React, { useState } from 'react';

function RegisterPage({ event, addRegistration, setPage }) {
    const [formData, setFormData] = useState({ name: '', email: '' });
    const [isSubmitted, setIsSubmitted] = useState(false);

    if (!event) return <div className="container mx-auto px-4 py-8">Event not found.</div>;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        addRegistration(event.id, formData);
        setIsSubmitted(true);
    };

    if (isSubmitted) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto text-center">
                    <h2 className="text-2xl font-bold mb-4 text-green-600">Registration Successful!</h2>
                    <p className="text-gray-700 mb-4">You are registered for <strong>{event.name}</strong>.</p>
                    <button
                        onClick={() => setPage('details')}
                        className="bg-[#FC350B] text-white px-4 py-2 rounded-md hover:bg-[#D92B0A] transition-colors"
                    >
                        Back to Event
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
                <h2 className="text-2xl font-bold mb-2 text-gray-800">Register for</h2>
                <h3 className="text-xl font-semibold mb-6 text-[#FC350B]">{event.name}</h3>

                {event.ticketPrice > 0 && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <p className="text-yellow-800 font-semibold">
                            Ticket Price: ${event.ticketPrice}
                        </p>
                    </div>
                )}

                <div className="mb-4">
                    <label className="block text-gray-700">Name</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded-md" required />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded-md" required />
                </div>
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors w-full">
                    Confirm Registration
                </button>
            </form>
        </div>
    );
}

export default RegisterPage;