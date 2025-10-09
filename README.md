# 👕 Garment Management System – Dimalsha Fashions

### Version 1.0

The **Garment Management System Automation (GMSA)** is a full-stack web-based solution developed for **Dimalsha Fashions** to automate manual operations such as inventory tracking, order processing, employee salary management, and financial reporting.  
This system was built as part of a professional academic project with real-world implementation for a local garment business.

---

## 🚀 Overview

The system replaces the existing **manual garment management process** with a digital platform that provides:
- Real-time inventory and order tracking  
- Customer order placement and invoice generation  
- Delivery management with driver coordination  
- Automated email notifications  
- Employee payroll automation  
- Financial income and expense reporting  
- Role-based access for Admins, Customers, and Drivers  

It streamlines business workflows, reduces manual errors, and improves efficiency and transparency across operations.

---

## 🧩 Features

- 🛒 **Order Management** – Customers can place, view, and edit orders easily.  
- 📦 **Inventory Tracking** – Real-time stock monitoring with low-stock alerts.  
- 🚚 **Delivery Module** – Assign deliveries, track routes, and update order status.  
- 📧 **Email Notifications** – Automated emails for order confirmation and delivery updates.  
- 👥 **User Roles** – Separate interfaces for Admin, Customer, and Driver.  
- 💰 **Employee Payroll** – Automated salary calculation and payslip generation.  
- 📊 **Financial Reports** – Dynamic reports on income, expenses, and performance.  
- 🖨️ **PDF Invoices** – Auto-generated invoices using PDFKit.  
- 🔒 **Security** – Role-based access and input validation.

---

## 🏗️ Tech Stack

| Category | Technologies |
|-----------|--------------|
| **Frontend** | React.js, Tailwind CSS |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas (Cloud-hosted) |
| **Email Service** | Nodemailer |
| **PDF Generation** | PDFKit |
| **Real-Time Updates** | Server-Sent Events (SSE) |
| **Version Control** | Git & GitHub |
| **IDE** | Visual Studio Code |
| **Development Methodology** | Agile (Iterative Sprints) |
---

## ⚙️ Setup & Installation

Follow the steps below to run the project locally 👇

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/ridmii/gms
cd gms
```
### 2️⃣ Install Dependencies
For the backend:
```
cd backend
npm install
```
For the frontend:
```
cd frontend
npm install
```
### 3️⃣ Environment Configuration
Create a .env file inside the server directory and add your environment variables:
```
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_app_password
CLIENT_URL=http://localhost:5173
```
### 4️⃣ Run the Application
Start the backend:
```
cd backend
npm start
```
Start the frontend:
```
cd frontend
npm run dev
```
### Now open your browser and visit:
### 👉 http://localhost:5173
---

## 🔮 Future Enhancements

- 📱 Native mobile application support  
- 📈 Advanced analytics dashboards  
- 🔁 Supplier order automation  
- 🔐 Multi-factor authentication

## 📬 Contact
For questions, feedback, or review related inquiries:
📧 heyridmi@gmail.com
💬 Or open an issue at [GitHub repository](https://github.com/ridmii/gms/issues)

---


