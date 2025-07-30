import Header from './Header';
import Footer from './Footer';

const Layout = ({ children, activePage }) => {
  return (
    <div className="app-layout">
      <Header activePage={activePage} />
      <main className="app-main">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;