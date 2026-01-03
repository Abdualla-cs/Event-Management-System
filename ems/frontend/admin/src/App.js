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
import DashboardPage from './pages/DashboardPage.js';
import ManageEventPage from './pages/ManageEventPage.js';
import EditEventPage from './pages/EditEventPage.js';
import ContactsPage from './pages/ContactsPage.js';
import LoginPage from './pages/LoginPage.js';
import LoginModal from './components/LoginModal.js';

const API_BASE_URL = 'https://ems-backend-e1vd.onrender.com';

function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('home');
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchEvents();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
    return () => clearTimeout(timer);
  }, [page]);

  const checkAuth = async () => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        if (decoded.exp * 1000 > Date.now()) {
          setIsAuthenticated(true);
          setUser({ email: decoded.email || 'admin@yallaevent.com' });
        } else {
          localStorage.removeItem('admin_token');
        }
      } catch (error) {
        localStorage.removeItem('admin_token');
      }
    }
    setLoading(false);
  };

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

  const handleLogin = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/login`, {
        email,
        password
      });
      localStorage.setItem('admin_token', response.data.token);
      setIsAuthenticated(true);
      setUser(response.data.user);
      setShowLoginModal(false);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
    setUser(null);
    setPage('home');
  };

  const handleCreateEvent = async (formData) => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.post(`${API_BASE_URL}/api/events`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      fetchEvents();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to create event' };
    }
  };

  const handleUpdateEvent = async (id, formData) => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(`${API_BASE_URL}/api/events/${id}`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      fetchEvents();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to update event' };
    }
  };

  const handleDeleteEvent = async (id) => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(`${API_BASE_URL}/api/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchEvents();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to delete event' };
    }
  };

  const handleRegistration = async (eventId, registrationData) => {
    try {
      await axios.post(`${API_BASE_URL}/api/registrations`, {
        event_id: eventId,
        ...registrationData
      });
      return true;
    } catch (error) {
      alert(`❌ ${error.response?.data?.error || 'Registration failed'}`);
      return false;
    }
  };

  const handleContactSubmit = async (contactData) => {
    try {
      await axios.post(`${API_BASE_URL}/api/contact`, contactData);
      return true;
    } catch (error) {
      return false;
    }
  };

  const getContacts = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API_BASE_URL}/api/contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return [];
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
        return <EventDetails event={selectedEvent} setPage={setPage} isAdmin={isAuthenticated} />;
      case 'register':
        const eventToRegister = events.find(e => e.id === selectedEventId);
        return <RegisterPage event={eventToRegister} onSubmit={handleRegistration} setPage={setPage} />;
      case 'dashboard':
        return isAuthenticated ?
          <DashboardPage events={events} getContacts={getContacts} /> :
          <LoginPage onLogin={handleLogin} setPage={setPage} />;
      case 'manage':
        return isAuthenticated ?
          <ManageEventPage
            events={events}
            setPage={setPage}
            setSelectedEventId={setSelectedEventId}
            onDelete={handleDeleteEvent}
            onCreate={handleCreateEvent}
            onUpdate={handleUpdateEvent}
          /> :
          <LoginPage onLogin={handleLogin} setPage={setPage} />;
      case 'edit':
        const eventToEdit = events.find(e => e.id === selectedEventId);
        return isAuthenticated ?
          <EditEventPage event={eventToEdit} editEvent={handleUpdateEvent} setPage={setPage} /> :
          <LoginPage onLogin={handleLogin} setPage={setPage} />;
      case 'contacts':
        return isAuthenticated ?
          <ContactsPage getContacts={getContacts} /> :
          <LoginPage onLogin={handleLogin} setPage={setPage} />;
      case 'login':
        return <LoginPage onLogin={handleLogin} setPage={setPage} />;
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
      <Header
        page={page}
        setPage={setPage}
        isAdmin={isAuthenticated}
        onLoginClick={() => setShowLoginModal(true)}
        onLogout={handleLogout}
        user={user}
      />
      <main className="flex-grow">{renderPage()}</main>
      <Footer isAdmin={isAuthenticated} user={user} />
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onLogin={handleLogin} />
    </div>
  );
}

export default App;