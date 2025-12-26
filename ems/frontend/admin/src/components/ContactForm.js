import React, { useState } from 'react';

function ContactForm() {
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [messageSent, setMessageSent] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Contact form submitted:", formData);
        setMessageSent(true);
        setFormData({ name: '', email: '', message: '' });
    };

    if (messageSent) {
        return (
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md max-w-md mx-auto text-center w-full">
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-green-600">Message Sent!</h3>
                <p className="text-gray-700 text-sm sm:text-base mb-4">Thank you for contacting us. We'll get back to you soon.</p>
                <button
                    onClick={() => setMessageSent(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors text-sm sm:text-base"
                >
                    Send Another
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-lg shadow-md max-w-md mx-auto w-full">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800">Contact Us</h2>
            <div className="mb-4">
                <label className="block text-gray-700 text-sm sm:text-base mb-1">Name</label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-md text-sm sm:text-base"
                    required
                />
            </div>
            <div className="mb-4">
                <label className="block text-gray-700 text-sm sm:text-base mb-1">Email</label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-md text-sm sm:text-base"
                    required
                />
            </div>
            <div className="mb-4">
                <label className="block text-gray-700 text-sm sm:text-base mb-1">Message</label>
                <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full p-3 border rounded-md text-sm sm:text-base"
                    rows="4"
                    required
                ></textarea>
            </div>
            <button
                type="submit"
                className="bg-[#FC350B] text-white px-4 py-3 rounded-md hover:bg-[#D92B0A] transition-colors w-full text-sm sm:text-base"
            >
                Send Message
            </button>
        </form>
    );
}

export default ContactForm;