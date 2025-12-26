import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './components/Header.js';
import Footer from './components/Footer.js';
import Home from './pages/Home.js';
import About from './pages/About.js';
import Events from './pages/Events.js';
import Contact from './pages/Contact.js';
import EventDetails from './pages/EventDetails.js';
import RegisterPage from './pages/RegisterPage.js';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('home');
  const [selectedEventId, setSelectedEventId] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);

    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);

    return () => clearTimeout(timer);
  }, [page]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/events`);
      setEvents(response.data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistration = async (eventId, registrationData) => {
    try {
      console.log('Registering for event:', eventId, registrationData);

      const response = await axios.post(`${API_BASE_URL}/api/registrations`, {
        event_id: eventId,
        ...registrationData
      });

      console.log('Registration successful:', response.data);
      return true;
    } catch (error) {
      console.error('Registration failed:', error);

      let errorMessage = 'Registration failed. Please try again.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      alert(`❌ ${errorMessage}`);
      return false;
    }
  };

  const handleContactSubmit = async (contactData) => {
    try {
      await axios.post(`${API_BASE_URL}/api/contact`, contactData);
      return true;
    } catch (error) {
      console.error('Contact submission failed:', error);
      return false;
    }
  };

  const renderPage = () => {
    switch (page) {
      case 'home':
        return <Home events={events} setPage={setPage} setSelectedEventId={setSelectedEventId} />;
      case 'about':
        return <About setPage={setPage} />;
      case 'events':
        return <Events events={events} setPage={setPage} setSelectedEventId={setSelectedEventId} />;
      case 'contact':
        return <Contact onSubmit={handleContactSubmit} />;
      case 'details':
        const selectedEvent = events.find(e => e.id === selectedEventId);
        return <EventDetails event={selectedEvent} setPage={setPage} />;
      case 'register':
        const eventToRegister = events.find(e => e.id === selectedEventId);
        return <RegisterPage event={eventToRegister} onSubmit={handleRegistration} setPage={setPage} />;
      default:
        return <Home events={events} setPage={setPage} setSelectedEventId={setSelectedEventId} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FEF1E1]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#FC350B]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FEF1E1] text-gray-800 flex flex-col font-sans">
      <Header page={page} setPage={setPage} />
      <main className="flex-grow">
        {renderPage()}
      </main>
      <Footer />
    </div>
  );
}

export default App;