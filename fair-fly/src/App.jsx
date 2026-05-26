import Chatbot from './components/Chatbot/Chatbot'
import Footer from './components/Footer/Footer'
import Navbar from './components/Navbar/Navbar'
import About from './pages/About/About';
import Landing from './pages/Landing/Landing'
import { BrowserRouter, Routes, Route, Link } from "react-router";

function App() {

  return (
    <>

    <BrowserRouter>

    <Navbar></Navbar>

    <Routes>

      <Route path="/home" element={<Landing/>} />
      <Route path="/about" element={<About />} />
      
    </Routes>

    <Chatbot></Chatbot>
    <Footer></Footer>
    </BrowserRouter>
    

    </>
  )
}

export default App
