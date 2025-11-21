import React from 'react';

function About({ setPage }) {
    const handleStartEvent = () => {
        setPage('events');
    };

    return (
        <div
            className="min-h-screen bg-cover bg-center bg-fixed py-6 sm:py-12"
            style={{
                backgroundImage: 'url(/images/about-bg.jpg)'
            }}
        >
            <div className="container mx-auto px-4">
                <div className="bg-white bg-opacity-95 p-4 sm:p-6 md:p-8 rounded-lg shadow-xl max-w-4xl mx-auto">
                    {/* Header Section */}
                    <div className="text-center mb-8 sm:mb-12">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-4 sm:mb-6">About YallaEvent</h1>
                        <div className="w-20 sm:w-24 h-1.5 sm:h-2 bg-gradient-to-r from-orange-500 to-red-500 mx-auto mb-4 sm:mb-6 rounded-full"></div>
                        <p className="text-lg sm:text-xl text-gray-600 italic">Simplifying Events, Connecting Communities</p>
                    </div>

                    {/* Main Content */}
                    <div className="space-y-6 sm:space-y-8">
                        {/* Introduction Section */}
                        <section className="text-center">
                            <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-4 sm:mb-6">
                                At <span className="font-semibold text-[#FC350B]">YallaEvent</span>, we believe every great moment begins with connection and every unforgettable event deserves a stage that brings people together effortlessly. Born from a passion for creativity and Lebanese spirit, YallaEvent is your all-in-one digital partner for planning, organizing, and elevating events of every kind from vibrant community gatherings to professional conferences.
                            </p>
                        </section>

                        {/* Mission Section */}
                        <section className="bg-gradient-to-r from-orange-50 to-red-50 p-4 sm:p-6 rounded-xl border-l-4 border-[#FC350B]">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
                                Our Mission
                            </h2>
                            <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                                We empower businesses, schools, non-profits, and individuals to transform their ideas into experiences that inspire. Whether you're hosting a corporate summit, a charity gala, a music night, or a local workshop YallaEvent makes it simple, smart, and stylish.
                            </p>
                        </section>

                        {/* Platform Features */}
                        <section>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
                                What We Offer
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                <div className="bg-white border border-gray-200 p-4 sm:p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                    <h3 className="font-bold text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base">Complete Event Management</h3>
                                    <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                                        Our platform is designed to handle everything event creation, registration, ticketing, and engagement all through an intuitive interface that saves you time and amplifies your impact.
                                    </p>
                                </div>
                                <div className="bg-white border border-gray-200 p-4 sm:p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                    <h3 className="font-bold text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base">Lebanese Hospitality</h3>
                                    <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                                        We combine modern technology with a touch of Lebanese hospitality, ensuring your event feels both seamless and personal.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Vision Section */}
                        <section className="bg-gradient-to-r from-[#FC350B] to-red-600 text-white p-4 sm:p-6 md:p-8 rounded-xl text-center">
                            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Our Vision</h2>
                            <p className="text-base sm:text-lg leading-relaxed mb-3 sm:mb-4">
                                At YallaEvent, we're more than a management tool we're a movement that celebrates culture, collaboration, and creativity. We're here to help you organize smarter, connect deeper, and celebrate louder.
                            </p>
                        </section>

                        {/* Call to Action */}
                        <section className="text-center pt-4 sm:pt-6">
                            <div className="bg-white border-2 border-[#FC350B] p-4 sm:p-6 rounded-xl">
                                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">Ready to Create Something Amazing?</h3>
                                <p className="text-lg sm:text-xl text-[#FC350B] font-semibold mb-4 sm:mb-6">
                                    Let's make every event extraordinary. Yalla it's time to create, connect, and celebrate together!
                                </p>
                                <button
                                    onClick={handleStartEvent}
                                    className="bg-[#FC350B] text-white px-6 py-3 sm:px-8 sm:py-3 rounded-lg hover:bg-[#D92B0A] transition-colors text-base sm:text-lg font-semibold shadow-lg transform hover:scale-105 transition-transform w-full sm:w-auto"
                                >
                                    Start Your Event Journey
                                </button>
                            </div>
                        </section>
                    </div>

                    {/* Cultural Touch */}
                    <div className="text-center mt-8 sm:mt-12 pt-4 sm:pt-6 border-t border-gray-200">
                        <p className="text-gray-500 text-xs sm:text-sm">
                            Built with ❤️ and Lebanese spirit
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default About;