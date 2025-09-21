import './App.css'
import LoginPage from './components/login/page'
import { SessionProvider, useSession } from './components/SessionProvider'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Welcome from './components/welcome';
import Projects from './components/Projects';
import { ThemeProvider } from './components/theme-provider';
import type { JSX } from 'react';
import Dashboard from './components/dashboard';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <Router>
      <SessionProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/welcome" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/login" />} />
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
