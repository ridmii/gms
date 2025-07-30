import { Link } from 'react-router-dom';
import '../styles/Header.css';

const Header = ({ activePage }) => {
  return (
    <header className="app-header">
      <div className="header-content">
        <Link to="/" className="brand-logo">
          <img src="/frontend/public/scissors.png" alt="Dimalsha Fashions" className="logo-icon" />
        </Link>
        <nav className="nav-links">
          <Link 
            to="/place-order" 
            className={`nav-link ${activePage === 'place-order' ? 'active' : ''}`}
          >
            Place Order
          </Link>
          <Link 
            to="/view-orders" 
            className={`nav-link ${activePage === 'view-orders' ? 'active' : ''}`}
          >
            View Orders
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;