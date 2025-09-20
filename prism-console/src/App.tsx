import './App.css'
import LoginPage from './components/login/page'
import { SessionProvider, useSession } from './components/SessionProvider'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Welcome from './components/welcome';
import type { JSX } from 'react';

function App() {
  return (
    <Router>
      <SessionProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/welcome" element={<ProtectedRoute><Welcome /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </SessionProvider>
    </Router>
  )
}

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { session } = useSession();
  if (!session) {
    return <Navigate to="/login" />;
  }
  return children;
};

export default App
