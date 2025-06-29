import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Main.css';

const Home = () => {
  return (
    <div className="home-container">
      <video autoPlay muted loop playsInline className="background-video">
        <source src="/homee.mp4" type="video/mp4" />
        <source src="/homee.webm" type="video/webm" />
        Your browser does not support the video tag.
      </video>
      <div className="content-overlay">
        <div className="admin-login">
          <Link to="/admin/login" className="admin-button">I'm the Admin</Link>
        </div>
        <div className="home-header">
          <h1 className="scissors-animation">Welcome to Dimalsha Fashions</h1>
          <p>Where Fashion Meets You</p>
        </div>
        <div className="button-group">
          <Link to="/order" className="action-button">Place Order</Link>
          <Link to="/past-orders" className="action-button">View Past Orders</Link>
        </div>
        <div className="social-section">
          <p className="find-us">Checkout our socials</p>
          <div className="social-links">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
              <img src="/facebook.png" alt="Facebook" className="social-icon" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
              <img src="/instagram.png" alt="Instagram" className="social-icon" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
