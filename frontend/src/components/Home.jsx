import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Main.css';

const Home = () => {
  return (
    <div className="home-container">
      <div className="home-header">
        <h1>Welcome to Dimalsha Fashions!</h1>
        <p>Create custom orders or view your past orders with ease.</p>
      </div>
      <div className="button-group">
        <Link to="/order" className="action-button">Place Order</Link>
        <Link to="/past-orders" className="action-button">View Past Orders</Link>
      </div>
    </div>
  );
};

export default Home;
