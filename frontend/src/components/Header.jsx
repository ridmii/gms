import { Link } from 'react-router-dom';
import '../styles/Header.css';
import headerLogo from '../assets/header.png';

const Header = ({ activePage }) => {
  return (
    <header className="app-header">
      <div className="header-content">
        <Link to="/" className="brand-logo">
          {/* Use either this approach (direct public folder reference) */}
          <img src={headerLogo} alt="Dimalsha Fashions" className="logo-icon" />
          
          {/* OR if you want to use the import approach, move the image to src/assets/ */}
        </Link>
        <nav className="nav-links">
          <Link 
            to="/order" 
            className={`nav-link ${activePage === 'place-order' ? 'active' : ''}`}
          >
            Place Order
          </Link>
          <Link 
            to="/past-orders" 
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