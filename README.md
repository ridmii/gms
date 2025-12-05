# GMS - Garment Order Management System (Full-Stack)

Welcome to GMS, a comprehensive full-stack web application designed for managing garment production orders, deliveries, employee management, and inventory. This project showcases a complete business management system built with **React** (Frontend), **Node.js + Express** (Backend), and **MongoDB** (Database), featuring secure admin authentication, real-time updates, and professional email notifications.

## 🚀 Features

- **Order Management**: Customers submit garment orders with custom specifications, materials, quantities, and artwork uploads. Admins can view, update, and manage all orders with pricing calculations and invoice generation.
- **Delivery Tracking**: Track deliveries with driver assignment, scheduled dates, and status updates (Pending, In Progress, Delivered, Cancelled). Send automated tracking emails to customers.
- **Employee Management**: Register and manage employees with roles and contact information. Assign drivers to deliveries.
- **Salary Management**: Record employee salary payments, track payment dates and amounts, mark payments as paid/unpaid, and calculate total expenses.
- **Inventory Management**: Add and track inventory items with stock levels, threshold alerts, pricing, and total value calculations.
- **Financial Dashboard**: Real-time statistics with monthly income, salary expenses, profit/loss analysis, and pending deliveries count using Server-Sent Events (SSE).
- **Secure Authentication**: JWT-based admin login with protected routes and role-based access control.
- **Email Notifications**: Order confirmations and delivery tracking emails with professional HTML templates via Gmail/Nodemailer.
- **Invoice & Report Generation**: Download invoices as PDFs and export order data as CSV reports.
- **Responsive Design**: Mobile and desktop optimized interface with Tailwind CSS.

## ⚙️ Prerequisites

- **Node.js**: Version 14.x or later (download from [nodejs.org](https://nodejs.org/))
- **npm**: Included with Node.js
- **MongoDB**: Local instance or MongoDB Atlas cloud cluster
- **Gmail Account**: For email notifications (with 2FA and App Password enabled)
- **Web Browser**: A modern browser like Chrome, Firefox, or Edge

## 📦 Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/ridmii/gms.git
   cd gms
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   ```

3. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   ```

4. **Configure Environment Variables**:
   Create a `.env` file in the `backend/` directory:
   ```env
   # Server Configuration
   PORT=5000
   
   # Database Configuration
   MONGO_URI=mongodb://localhost:27017/gms
   
   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here
   
   # Email Configuration (Gmail with App Password)
   EMAIL_USER=your_gmail@gmail.com
   EMAIL_PASS=your_app_password_here
   
   # Admin Credentials (default bcrypt hashed password)
   ADMIN_EMAIL=admin@dimalsha.com
   ADMIN_PASSWORD=$2b$10$z4ADspMJ1eBzmRF34Wc38.TXLwYTpd9w67LfrSZaGOHNMGy0zCMsW
   ```

   **Gmail Setup for Email Notifications**:
   1. Go to https://myaccount.google.com/security
   2. Enable 2-factor authentication
   3. Generate an App Password at https://myaccount.google.com/apppasswords
   4. Copy the 16-character app password and paste it in `.env` as `EMAIL_PASS`
   5. Use your Gmail address (with or without @gmail.com) as `EMAIL_USER`

5. **Ensure MongoDB is Running**:
   - **Local MongoDB**: Run `mongod` in your terminal
   - **MongoDB Atlas**: Ensure your cluster is active and update `MONGO_URI` with your connection string

## 🚀 Running the Application

### Development Mode

**Start Backend** (from `backend/` directory):
```bash
npm start
```
Backend API runs on `http://localhost:5000`

**Start Frontend** (from `frontend/` directory, in a new terminal):
```bash
npm run dev
```
Frontend application runs on `http://localhost:5173`

**Open http://localhost:5173 in your browser to view the application.** Start by logging in with the admin credentials or creating a new customer order.

### Production Build

**Frontend Build**:
```bash
npm run build
```
Generates optimized production build in `dist/` directory.

## 🧭 Usage

- **Customer Order Page**: Visit the root URL (/) to place a new garment order. Fill in customer details, select material and quantity, optionally upload artwork, and submit.
- **Admin Login**: Navigate to `/admin/login` and sign in with admin credentials. Default: `admin@dimalsha.com` (password in .env).
- **Admin Dashboard**: View real-time statistics including monthly income, salary expenses, pending deliveries, and total orders. Statistics update automatically when data changes.
- **Order Management**: View all customer orders, update order status and pricing, view detailed order information, generate invoices, and send order confirmation emails.
- **Delivery Management**: Create deliveries from orders, assign drivers, set scheduled dates, update delivery status, and send tracking emails to customers.
- **Employee Management**: Register new employees and manage employee information for driver assignment.
- **Salary Management**: Record employee salaries, track payment dates, mark payments as paid/unpaid, and view total salary expenses.
- **Inventory Management**: Add inventory items, manage stock levels with threshold alerts, add/remove quantities, and track inventory value.
- **Reporting**: Generate CSV reports for all orders and download invoices as PDF files.
- **Email Notifications**: When configured, customers receive order confirmation and delivery tracking emails with professional HTML templates.

## 📁 Project Structure

```
gms/
├── backend/
│   ├── models/
│   │   ├── Order.js              # Order schema with pricing details
│   │   ├── Delivery.js           # Delivery tracking schema
│   │   ├── Employee.js           # Employee information schema
│   │   ├── Salary.js             # Salary records schema
│   │   ├── Inventory.js          # Inventory items schema
│   │   └── Driver.js             # Driver schema
│   ├── routes/
│   │   ├── orderRoutes.js        # Order CRUD and email operations
│   │   ├── deliveryRoutes.js     # Delivery management and tracking
│   │   └── employeeRoutes.js     # Employee management
│   ├── uploads/                  # User-uploaded artwork and files
│   ├── temp/                     # Temporary PDF files
│   ├── public/                   # Static files
│   ├── server.js                 # Main Express server
│   ├── package.json              # Backend dependencies
│   ├── seed.js                   # Database initialization script
│   └── .env                      # Environment variables (create locally)
│
├── frontend/
│   ├── src/
│   │   ├── components/           # Reusable React components
│   │   │   ├── AdminDashboard.jsx       # Admin statistics dashboard
│   │   │   ├── AdminLogin.jsx           # Admin authentication
│   │   │   ├── AdminSidebar.jsx         # Admin navigation sidebar
│   │   │   ├── CustomerLogin.jsx        # Customer login
│   │   │   ├── CustomerRegister.jsx     # Customer registration
│   │   │   ├── DeliveryManagement.jsx   # Delivery tracking interface
│   │   │   ├── Employee.jsx             # Employee roster
│   │   │   ├── Finance.jsx              # Salary management
│   │   │   ├── Inventory.jsx            # Stock management
│   │   │   ├── OrderDashboard.jsx       # Admin order view
│   │   │   ├── OrderForm.jsx            # Customer order form
│   │   │   ├── PastOrders.jsx           # Customer order history
│   │   │   ├── ReportGenerating.jsx     # Report generation
│   │   │   └── ProtectedRoute.jsx       # Admin route protection
│   │   ├── pages/
│   │   │   └── OrderPage.jsx            # Public order page
│   │   ├── styles/               # CSS files
│   │   ├── assets/               # Images and media
│   │   ├── App.jsx              # Main app component with routing
│   │   ├── main.jsx             # React entry point
│   │   └── index.css            # Global styles
│   ├── public/                   # Static assets
│   ├── package.json              # Frontend dependencies
│   ├── vite.config.js           # Vite build configuration
│   ├── tailwind.config.js        # Tailwind CSS theming
│   └── postcss.config.js         # PostCSS configuration
│
└── README.md                     # This file
```

## 🧰 Technologies Used

**Backend**:
- **Node.js & Express.js**: Server framework and API routing
- **MongoDB & Mongoose**: Database and ODM
- **JWT**: Secure admin authentication
- **bcryptjs**: Password hashing
- **Nodemailer**: Email notifications
- **Multer**: File upload handling
- **PDFKit**: Invoice generation
- **fast-csv**: CSV report generation
- **CORS**: Cross-origin request handling
- **Server-Sent Events**: Real-time dashboard updates

**Frontend**:
- **React 19**: Dynamic UI components
- **Vite**: Fast development and production builds
- **React Router DOM**: Client-side navigation
- **Tailwind CSS**: Utility-first responsive styling
- **Axios**: HTTP client for API requests
- **Framer Motion**: Smooth animations and transitions
- **Lucide React & React Icons**: Icon libraries
- **react-csv & file-saver**: File export utilities
- **React Confetti**: Visual effects

## ⚠️ Limitations

- **Frontend Data**: Uses mock/static data for some features in development mode
- **Email Service**: Requires Gmail SMTP configuration; falls back to mock service if not configured
- **File Upload Limits**: Maximum 10MB per file; supports JPEG, PNG, PDF, AI, EPS formats
- **Mock Delivery Initialization**: Default delivery data is seeded on first run
- **Password Reset**: No built-in password reset feature; admin must update .env manually

## 🤝 Contributing

This project was created as a comprehensive business management system for Dimalsha Fashions. While primarily designed for internal use, feedback and suggestions are welcome! If you encounter issues or have ideas for improvements, please open an issue on the [GitHub repository](https://github.com/ridmii/gms/issues) or contact the development team. Thank you for using GMS!

## 📜 License

This project is proprietary software for Dimalsha Fashions. All rights reserved. Unauthorized copying, modification, or distribution is prohibited.

## 🙏 Acknowledgments

- Grateful to the open-source communities of React, Node.js, Express, MongoDB, and Tailwind CSS for their powerful tools
- Thanks to Nodemailer for email integration and PDFKit for document generation
- Special thanks to Framer Motion for beautiful animations and Vite for fast development experience

## 📬 Contact

For questions, feedback, or support inquiries:

📧 **Email**: heyridmi@gmail.com  

Or open an issue at [GitHub repository](https://github.com/ridmii/gms/issues)

## 📝 Review Notes for Developers & Stakeholders

- **Scope**: Full-stack garment production management system with admin dashboard, customer portal, and real-time updates
- **Testing**: 
  1. Start backend: `npm start` (from backend/)
  2. Start frontend: `npm run dev` (from frontend/)
  3. Access at http://localhost:5173
  4. Login with admin credentials or create customer orders
  5. Test delivery tracking, salary management, and inventory features
- **Key Components**: 
  - Review `src/components/AdminDashboard.jsx` for dashboard statistics
  - Check `src/components/OrderForm.jsx` for customer order flow
  - Inspect `src/components/DeliveryManagement.jsx` for tracking functionality
  - See `backend/server.js` for API structure and email configuration
- **Code Quality**: All endpoints include error handling, validation, and comprehensive logging for easy debugging
- **Improvements**: Future enhancements could include payment gateway integration (Stripe), SMS notifications, advanced analytics, and mobile app version

---

**Last Updated**: December 2025  
**Version**: 1.0.0  
**Status**: Production Ready
