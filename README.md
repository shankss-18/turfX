# 🏏 TurfX — Box Cricket Venue Booking & Management Platform

TurfX is a full-stack web application for box cricket turfs and sports venues. It provides instant online slot booking, a simulated Razorpay payment gateway, automated graduated cancellations and tiered refunds, match rescheduling, and an analytics-powered admin management portal.

---

## 🌟 Key Features

### 👤 Customer Features
- **Real-Time Slot Booking**: Select match slots across morning, afternoon, and evening peak hours with live MongoDB synchronization.
- **Razorpay Demo Sandbox**: Simulated payment modal supporting UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, Netbanking, and Wallets.
- **Match Self-Service ([Manage Booking])**:
  - Search reservations by Booking ID (`#TX...`), phone, or email.
  - **Graduated Cancellation & Tiered Refund Policy**:
    - `> 20 Hours before match`: **80% Refund**
    - `12 – 20 Hours before match`: **60% Refund**
    - `6 – 12 Hours before match`: **40% Refund**
    - `2 – 6 Hours before match`: **0% Refund (Non-refundable)**
    - `< 2 Hours before match`: **Cancellation Closed**
  - **Rescheduling**: Permitted up to **4 hours prior to match time**.
  - Add to Calendar (`.ics`) and Google Maps directions.

### 🛡️ Admin Portal (`/admin`)
- **Real Insights Dashboard**:
  - Today's verified bookings, revenue, and occupancy rate calculations.
  - Interactive scaled SVG **Weekly Revenue Curve** (Mon–Sun).
- **Slot Management**:
  - Single-venue focused schedule management.
  - Block maintenance hours, free booked slots, and view customer reservation details.
  - Past slots are locked to prevent modifying expired match time.
- **Refunds & Audit Log (`/admin/refunds`)**:
  - Cancelled and rescheduled slots grouped by match dates.
  - One-click **Approve Refund** (updates status to `refunded`) and **Reject** controls.
- **Mobile Responsive Design**:
  - Adaptive mobile card views for all data lists (no cramped tables).
  - Slide-over navigation drawer.
  - Globally hidden scrollbars.

---

## 🚀 Tech Stack

- **Frontend**: React 18, Vite 6, Tailwind CSS, Lucide Icons, React Router v6.
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), JSON Web Tokens (JWT), Razorpay SDK.
- **Deployment**: Vercel (Frontend), Render (Backend), MongoDB Atlas (Database).

---

## 📁 Project Structure

```text
turfX/
├── backend/
│   ├── config/          # Database & Razorpay configuration
│   ├── controllers/     # Auth, Booking, Ground, Slot controllers
│   ├── middleware/      # JWT auth protection middleware
│   ├── models/          # Mongoose schemas (Booking, Ground, Slot)
│   ├── routes/          # Express API route declarations
│   ├── .env.example     # Backend environment template
│   ├── package.json
│   └── server.js        # Server entry point
├── frontend/
│   ├── public/          # Static public assets
│   ├── src/
│   │   ├── components/  # Layouts, Navbar, Footer, UI components
│   │   ├── context/     # AuthContext & BookingContext
│   │   ├── pages/       # Home, BookSlot, Checkout, Confirmation, ManageBooking, Admin pages
│   │   ├── App.jsx
│   │   ├── index.css    # Global design system & animations
│   │   └── main.jsx
│   ├── vercel.json      # Client-side SPA routing for Vercel
│   ├── .env.example     # Frontend environment template
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 🛠️ Local Setup & Development

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, and credentials
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env: VITE_API_URL=http://localhost:5000
npm run dev
```

---

## 🌐 Production Deployment Guide

### Part 1: Deploy Backend on Render
1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New + Web Service**.
2. Connect your GitHub repository (`shankss-18/turfX`).
3. Configure the service:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. In **Environment Variables**, add:
   - `PORT` = `5000`
   - `MONGO_URL` = `your_mongodb_connection_string`
   - `JWT_SECRET` = `your_jwt_secret`
   - `ADMIN_EMAIL` = `admin@turfx.com`
   - `ADMIN_PASSWORD` = `your_secure_password`
   - `RAZORPAY_KEY_ID` = `your_razorpay_key_id`
   - `RAZORPAY_KEY_SECRET` = `your_razorpay_key_secret`
5. Click **Deploy Web Service** and copy your backend URL (e.g. `https://turfx-backend.onrender.com`).

---

### Part 2: Deploy Frontend on Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New Project**.
2. Import your GitHub repository (`shankss-18/turfX`).
3. In project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend` (Click Edit and select the `frontend` folder)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In **Environment Variables**, add:
   - `VITE_API_URL` = `https://your-backend-app.onrender.com` (Your live Render backend URL)
   - `VITE_RAZORPAY_KEY_ID` = `your_razorpay_key_id`
5. Click **Deploy**.
