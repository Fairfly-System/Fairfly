import { onAuthStateChanged } from 'firebase/auth';
import Chatbot from './components/Chatbot/Chatbot'
import Footer from './components/Footer/Footer'
import Navbar from './components/Navbar/Navbar'
import About from './pages/Index/About/About';
import Landing from './pages/Index/Landing/Landing'
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router";
import { useState, useEffect } from 'react';
import { auth } from './firebase';
import Login from './pages/Index/Login/login';
import Register from './pages/Index/Register/Register';
import ScrollToTop from './components/ScrollToTop/ScrollToTop';
import Index from './pages/Index/Index';
import ClientDashboard from './pages/ClientSide/ClientDashboard/ClientDashboard';
import Admin from './pages/Admin/Admin';

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

    {loading ? <div>Placeholder muna...</div> : 
      <Routes>

        {user ?
        <>
          <Route path="/client" element={<ClientDashboard />} />
          <Route path="/*" element={<Navigate to="/client" />} />
        </>
        :
        <Route element={<Index />}>

          <Route path="/home" element={<Landing/>} />
          <Route path="/admin" element={<Admin/>} /> 
          <Route path="/about" element={<About />} />
          <Route path ="/login" element={<Login/>} />
          <Route path="/register" element={<Register/>} />
          <Route path="/*" element={<Navigate to="/home" />} />

        </Route>
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
