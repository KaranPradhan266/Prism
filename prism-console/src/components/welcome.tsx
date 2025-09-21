import React from 'react';
import { useSession } from './SessionProvider';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { ModeToggle } from './mode-toggle';

const Welcome = () => {
  const { session, supabase } = useSession();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error logging out:', error.message);
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-3xl font-bold mb-4">Welcome, {session?.user?.email}</h1>
        <Button onClick={() => navigate('/projects')} className="mb-4">Go to Projects</Button>
        <Button onClick={handleLogout}>Logout</Button>
      </div>
    </div>
  );
};

export default Welcome;
