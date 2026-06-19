import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Mail, Lock, ArrowLeft } from "lucide-react";
import "./login.css";
import logo from "/FairflyLogo.png";
import {auth} from "../../../firebase";
import {signInWithEmailAndPassword} from "firebase/auth";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        navigate("/client");
        alert("Login successful!");
      })
      .catch((error) => {
        alert(error.message);
      });
  };

  return (
    <div className="login-page">
      <div className="login-container">

        <Link to="/home" className="back-button">
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        <div className="login-card">

          <div className="login-header">
            <img src={logo} alt="logo" className="logo" />
            <h1>Welcome Back</h1>
            <p>Sign in to access your account</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">

            <div className="input-group">
              <label>Email Address</label>
              <div className="input-wrapper">
                <Mail className="icon" size={18} />
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="input-wrapper">
                <Lock className="icon" size={18} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <label className="checkbox">
                <input type="checkbox" />
                Remember me
              </label>

              <a href="#" className="forgot">
                Forgot password?
              </a>
            </div>

            <button type="submit" className="login-button">
              Sign In
            </button>
          </form>

          <div className="signup-text">
            Don't have an account?{" "}
            <Link to="/register">Create Account</Link>
          </div>

        </div>

        <div className="footer-text">
          By signing in, you agree to Terms and Privacy Policy
        </div>

      </div>
    </div>
  );
}