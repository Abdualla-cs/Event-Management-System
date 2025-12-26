import React from 'react';
import ContactForm from '../components/ContactForm.js';
import ContactBG from '../images/contact.png';

function Contact() {
    return (
        <div
            className="min-h-screen bg-cover bg-center bg-fixed py-12 relative"
            style={{
                backgroundImage: `url(${ContactBG})`
            }}
        >
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-md mx-auto">
                    <ContactForm />
                </div>
            </div>
        </div>
    );
}

export default Contact;