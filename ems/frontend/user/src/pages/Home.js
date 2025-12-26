
import React from 'react';
import EventCard from '../components/EventCard.js';
import BKIMG from '../images/home.png';

function Home({ events, setPage, setSelectedEventId }) {
    const featuredEvents = events.slice(0, 2);

    return (
        <div className="container mx-auto px-4 py-6">
            {/* Hero Section */}
            <section className="text-center mb-8 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-2xl p-6 md:p-12 shadow-xl relative overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-20"
                    style={{
                        backgroundImage: `url(${BKIMG})`
                    }}
                ></div>

                <div className="relative z-10">
                    <h1 className="text-3xl md:text-5xl font-bold mb-4">Welcome to YallaEvent</h1>
                    <p className="text-lg md:text-xl mb-6 opacity-90">Create, manage, and register for events effortlessly</p>
                    <button
                        onClick={() => setPage('events')}
                        className="bg-white text-[#FC350B] px-6 py-3 md:px-8 md:py-4 rounded-lg hover:bg-gray-100 transition-colors text-base md:text-lg font-semibold"
                    >
                        Explore Events
                    </button>
                </div>
            </section>

            {/* Featured Events Section */}
            <section className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
                    <h2 className="text-2xl font-bold text-gray-800">Featured Events</h2>
                    <button
                        onClick={() => setPage('events')}
                        className="text-[#FC350B] hover:text-[#D92B0A] font-semibold text-sm sm:text-base self-start sm:self-auto"
                    >
                        View All Events →
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                    {featuredEvents.map(event => (
                        <EventCard
                            key={event.id}
                            event={event}
                            setPage={setPage}
                            setSelectedEventId={setSelectedEventId}
                        />
                    ))}
                </div>
            </section>
        </div>
    );
}

export default Home;