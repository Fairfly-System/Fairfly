import { onAuthStateChanged } from 'firebase/auth';
import Chatbot from './components/Chatbot/Chatbot'
import Footer from './components/Footer/Footer'
import Navbar from './components/Navbar/Navbar'
import About from './pages/About/About';
import Landing from './pages/Landing/Landing'
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router";
import { useState, useEffect } from 'react';
import { auth } from './firebase';
import Login from './pages/Login/login';
import Register from './pages/Register/Register';
import ClientDashbord from './pages/ClientDashboard/ClientDashboard';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';

function App() {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    // Check if the user is authenticated
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Clean up the subscription
    return () => {
      unsubscribe();
    };

  }, []);

  return (
    <>

    <BrowserRouter>
    <ScrollToTop></ScrollToTop>

    <Navbar></Navbar>

    {loading ? <div>Placeholder muna...</div> : 
    
      <Routes>

        <Route path="/home" element={<Landing/>} />
        <Route path="/about" element={<About />} />
        <Route path ="/client" element={<ClientDashbord />} />
        <Route path ="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/*" element={<Navigate to="/home" />} />

        {user &&

          <>
            {/* Placeholder muna */}   
          </>

        }

      </Routes>
    
    }


    <Chatbot></Chatbot>
    <Footer></Footer>
    </BrowserRouter>
    

    </>
  )
}

export default App
