import './App.css'
import LoginPage from './components/login/page'
import { SessionProvider, useSession } from './components/SessionProvider'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';
import type { JSX } from 'react';
import Dashboard from './components/dashboard';
import ProjectDetails from './components/ProjectDetails';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <Router>
      <SessionProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </SessionProvider>
    </Router>
    </ThemeProvider>
  )
}

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { session, loading } = useSession();

  if (loading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  if (!session) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default App
