import React, { useState } from 'react';
import { ToastProvider, AuthProvider } from './context/Providers.js';
import { initialEventsData } from './data/initialEvents.js';
import useLocalStorage from './hooks/useLocalStorage.js';
import Header from './components/Header.js';
import Footer from './components/Footer.js';
import Home from './pages/Home.js';
import About from './pages/About.js';
import Events from './pages/Events.js';
import Contact from './pages/Contact.js';
import EventDetails from './pages/EventDetails.js';
import RegisterPage from './pages/RegisterPage.js';
import ManageEventsPage from './pages/ManageEventsPage.js';
import EditEventPage from './pages/EditEventPage.js';
import DashboardPage from './pages/DashboardPage.js';
import LoginModal from './components/LoginModal.js';

function App() {
  const [events, setEvents] = useLocalStorage('events', initialEventsData);
  const [page, setPage] = useState('home');
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const addEvent = (newEvent) => {
    const eventWithId = {
      ...newEvent,
      id: events.length > 0 ? Math.max(...events.map(e => e.id)) + 1 : 1,
      registrations: [],
    };
    setEvents([...events, eventWithId]);
    setPage('events');
  };

  const editEvent = (id, updatedEventData) => {
    setEvents(events.map(event =>
      event.id === id ? { ...event, ...updatedEventData } : event
    ));
  };

  const deleteEvent = (id) => {
    setEvents(events.filter(event => event.id !== id));
  };

  const addRegistration = (id, registrationInfo) => {
    setEvents(events.map(event =>
      event.id === id
        ? { ...event, registrations: [...event.registrations, registrationInfo] }
        : event
    ));
  };

  const stats = {
    totalEvents: events.length,
    upcomingEvents: events.filter(e => new Date(e.date) >= new Date()).length,
    totalRegistrations: events.reduce((sum, e) => sum + e.registrations.length, 0),
    totalRevenue: events.reduce((sum, e) => sum + (e.registrations.length * (e.ticketPrice || 0)), 0),
  };

  const renderPage = () => {
    switch (page) {
      case 'home':
        return <Home events={events} setPage={setPage} setSelectedEventId={setSelectedEventId} />;
      case 'about':
        return <About setPage={setPage} />; // ✅ Fixed: Only one 'about' case with setPage
      case 'events':
        return <Events events={events} addEvent={addEvent} setPage={setPage} setSelectedEventId={setSelectedEventId} />;
      case 'contact':
        return <Contact />;
      case 'details':
        const selectedEvent = events.find(e => e.id === selectedEventId);
        return <EventDetails event={selectedEvent} setPage={setPage} />;
      case 'register':
        const eventToRegister = events.find(e => e.id === selectedEventId);
        return <RegisterPage event={eventToRegister} addRegistration={addRegistration} setPage={setPage} />;
      case 'manage':
        return <ManageEventsPage
          events={events}
          setPage={setPage}
          setSelectedEventId={setSelectedEventId}
          deleteEvent={deleteEvent}
          updateEvent={editEvent}
          stats={stats}
        />;
      case 'edit':
        const eventToEdit = events.find(e => e.id === selectedEventId);
        return <EditEventPage event={eventToEdit} editEvent={editEvent} setPage={setPage} />;
      case 'dashboard':
        return <DashboardPage stats={stats} events={events} />;
      case 'login':
        return <div className="container mx-auto px-4 py-8 text-center">
          <button
            onClick={() => setShowLoginModal(true)}
            className="bg-[#FC350B] text-white px-6 py-3 rounded-md hover:bg-[#D92B0A] transition-colors text-lg font-semibold"
          >
            Open Login
          </button>
        </div>;
      default:
        return <Home events={events} setPage={setPage} setSelectedEventId={setSelectedEventId} />;
    }
  };

  return (
    <ToastProvider>
      <AuthProvider>
        <div className="min-h-screen bg-[#FEF1E1] text-gray-800 flex flex-col font-sans">
          <Header page={page} setPage={setPage} isAdmin={isAdmin} />
          <main className="flex-grow">
            {renderPage()}
          </main>
          <Footer isAdmin={isAdmin} setIsAdmin={setIsAdmin} />

          <LoginModal
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            setPage={setPage}
          />
        </div>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;