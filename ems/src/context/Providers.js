import React, { createContext, useContext } from 'react';
import useLocalStorage from '../hooks/useLocalStorage.js';
import ToastContainer from '../components/ToastContainer.js';

const ToastContext = createContext();
const AuthContext = createContext();

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useLocalStorage('toasts', []);

    const addToast = (message, type = 'info') => {
        const id = Date.now();
        const next = [...toasts, { id, message, type }];
        setToasts(next);
        setTimeout(() => removeToast(id), 4000);
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
}

export function AuthProvider({ children }) {
    const [isAdmin, setIsAdmin] = useLocalStorage('isAdmin', false);
    const [user, setUser] = useLocalStorage('user', null);

    const login = (username, password) => {
        if (username === 'admin' && password === 'admin123') {
            setIsAdmin(true);
            setUser({ username: 'admin', role: 'admin' });
            return true;
        }
        if (username && password && password.length >= 6) {
            setIsAdmin(false);
            setUser({ username, role: 'user' });
            return true;
        }
        return false;
    };

    const logout = () => {
        setIsAdmin(false);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ isAdmin, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}