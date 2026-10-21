# PS8: Complaint & Helpdesk Ticket System

A full-stack MERN application (MongoDB, Express, React, Node.js) built for tracking, managing, and resolving technical and organizational complaints with strict role permissions, automated ticket sequencing, and real-time resolution metrics.

---

## 🌟 Key Features

1. **Role-Based Authentication**:
   - Customer and Support/Admin registration & login.
   - Passwords securely hashed with `bcryptjs` (salt factor 10).
   - Stateless session management via signed JSON Web Tokens (JWT).
2. **Sequential Ticket IDs**:
   - Non-colliding readable ticket IDs (e.g., `TKT-1001`, `TKT-1002`) generated atomically via a dedicated MongoDB counter.
3. **Department Management**:
   - Admin/Support CRUD operations to create, edit, deactivate, and delete departments.
   - Support staff can assign tickets to departments.
4. **Ticket Status Workflow**:
   - Progressive resolution lifecycle: `Open` ➔ `In Progress` ➔ `Resolved` ➔ `Closed`.
5. **Strict Backend Business Rules**:
   - **Open-Only Modification**: Customers can edit or delete a ticket **only while its status is Open**.
   - **Single Reopen Rule**: A `Resolved` ticket may be reopened **only once** by the customer.
   - **Closed Immutability**: `Closed` tickets are strictly read-only (no edits, status changes, or comments allowed).
6. **Ticket Comment Threads**:
   - Live discussion thread for each ticket with author role badges (`Support Staff` / `Customer`) and timestamps.
7. **Analytics Dashboard**:
   - Real-time calculations: Total tickets, Active/Open count, Resolved/Closed count, and Average Resolution Time (in hours) calculated from actual database timestamps.
   - Priority-wise and Category-wise visual breakdowns.
8. **1-Click Demo Accounts**:
   - Pre-populated test accounts on the login screen for instant viva demonstration.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, React Router DOM (v7), Vanilla CSS Design System |
| **Backend** | Node.js (v24), Express.js (v4), REST API |
| **Database** | MongoDB Atlas / Local MongoDB, Mongoose ODM (v8) |
| **Security** | JWT (jsonwebtoken), bcryptjs, CORS, Dotenv |

---

## 📁 Project Structure

```
HELP-DESK/
├── .gitignore                      # Root ignore for node_modules, .env, dist
├── README.md                       # Complete project documentation
├── backend/
│   ├── .env.example                # Template for server environment variables
│   ├── package.json                # Server scripts & dependencies
│   ├── server.js                   # Express server entry point & middleware
│   ├── config/
│   │   └── db.js                   # Mongoose MongoDB connection handler
│   ├── models/
│   │   ├── User.js                 # Customer & Support schemas + bcrypt hooks
│   │   ├── Department.js           # Department schema
│   │   ├── Ticket.js               # Ticket schema with status & timestamps
│   │   ├── Comment.js              # Ticket conversation thread schema
│   │   └── Counter.js              # Atomic sequence generator for TKT-xxxx
│   ├── middleware/
│   │   ├── authMiddleware.js       # Bearer JWT verification (req.user)
│   │   └── roleMiddleware.js       # Role restriction (authorizeRoles)
│   ├── controllers/
│   │   ├── authController.js       # Register, login, profile logic
│   │   ├── departmentController.js # Admin department CRUD
│   │   ├── ticketController.js     # Ticket CRUD & strict business rules
│   │   ├── commentController.js    # Comment creation & retrieval
│   │   └── dashboardController.js  # Aggregated analytics calculations
│   ├── routes/
│   │   ├── authRoutes.js           # /api/auth
│   │   ├── departmentRoutes.js     # /api/departments
│   │   ├── ticketRoutes.js         # /api/tickets (includes nested comments)
│   │   ├── commentRoutes.js        # /api/tickets/:ticketId/comments
│   │   └── dashboardRoutes.js      # /api/dashboard
│   ├── seed/
│   │   └── seed.js                 # 10 realistic sample tickets seeder
│   ├── test_auth.js                # Automated auth test suite
│   └── test_backend.js             # Automated business rules test suite
└── frontend/
    ├── .env.example                # Template for client API endpoint
    ├── package.json                # Frontend scripts & dependencies
    ├── vite.config.js              # Vite configuration
    ├── index.html                  # HTML entry point with metadata
    └── src/
        ├── main.jsx                # React root mount
        ├── App.jsx                 # React Router routing & ProtectedRoute
        ├── index.css               # Global responsive CSS design system
        ├── api/
        │   ├── client.js           # Fetch wrapper with Bearer token header
        │   ├── authApi.js          # Auth API calls
        │   ├── departmentApi.js    # Department API calls
        │   ├── ticketApi.js        # Ticket & comment API calls
        │   └── dashboardApi.js     # Metrics API calls
        ├── context/
        │   └── AuthContext.jsx     # User state & JWT persistence
        ├── components/
        │   ├── Navbar.jsx          # Role-aware navigation bar
        │   ├── ProtectedRoute.jsx  # Route guard for auth & roles
        │   └── StatusBadge.jsx     # Visual status & priority tags
        └── pages/
            ├── LoginPage.jsx       # Login screen with 1-click demo buttons
            ├── RegisterPage.jsx    # Registration with Customer/Support radio
            ├── CustomerTicketsPage.jsx # My tickets table with Open-only edits
            ├── CreateTicketPage.jsx# Shared form for creating/editing tickets
            ├── TicketDetailPage.jsx# Full details, status flow & comments
            ├── StaffTicketsPage.jsx# All tickets with multi-filter bar
            ├── DepartmentsPage.jsx # Admin department CRUD management
            ├── DashboardPage.jsx   # Metrics, charts & resolution time
            └── NotFoundPage.jsx    # 404 handler
```

---

## 🚀 Quick Setup & Installation

### 1. Prerequisites
- Node.js (v18 or newer)
- MongoDB running locally on port `27017` or a MongoDB Atlas connection URI

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```
*(Verify port `5001` and your `MONGO_URI` in `.env`)*

### 3. Seed Database with Sample Records
Populate users, departments, and 10 realistic tickets:
```bash
npm run seed
```

### 4. Run Backend Tests
Verify authentication and all 17 PS8 business rules:
```bash
npm run test:auth
npm run test:backend
```

### 5. Start Backend Server
```bash
npm run dev
# Server running at http://localhost:5001
```

### 6. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
# Client running at http://localhost:5173
```

---

## 🔑 Pre-Configured Test Accounts

| Role | Email | Password | Allowed Capabilities |
|---|---|---|---|
| **Support Staff / Admin** | `support@helpdesk.com` | `support123` | View all tickets, filter by status/category/dept, advance status workflow, assign departments, CRUD departments, view analytics dashboard. |
| **Customer 1** | `rahul@gmail.com` | `customer123` | Create tickets, view personal tickets, edit/delete Open tickets, comment, reopen resolved ticket once. |
| **Customer 2** | `priya@gmail.com` | `customer123` | Create tickets, view personal tickets, edit/delete Open tickets, comment, reopen resolved ticket once. |

*(All three accounts are accessible via 1-click buttons on the Login page).*

---

## 📡 REST API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new user (`name`, `email`, `password`, `role`).
- `POST /api/auth/login` — Login user & obtain JWT token.
- `GET /api/auth/me` — Get logged-in user profile (Bearer token required).

### Departments (`/api/departments`)
- `GET /api/departments` — List departments (Authenticated).
- `POST /api/departments` — Create department (Support only).
- `PUT /api/departments/:id` — Update department (Support only).
- `DELETE /api/departments/:id` — Delete department (Support only).

### Tickets (`/api/tickets`)
- `GET /api/tickets` — List tickets (Customers see own; Support sees all with `?status=&priority=&category=&department=`).
- `POST /api/tickets` — Create new ticket (Assigns atomic readable `TKT-xxxx` ID).
- `GET /api/tickets/:id` — Retrieve ticket details.
- `PUT /api/tickets/:id` — Edit ticket content (**Allowed only if status is 'Open'**).
- `DELETE /api/tickets/:id` — Delete ticket (**Allowed only if status is 'Open'**).
- `PATCH /api/tickets/:id/status` — Advance status workflow (Support only; sets `resolvedAt`/`closedAt`).
- `POST /api/tickets/:id/reopen` — Reopen ticket (**Allowed only if status is 'Resolved' and `reopenCount === 0`**).
- `PATCH /api/tickets/:id/assign` — Assign department to ticket (Support only).

### Comments (`/api/tickets/:ticketId/comments`)
- `GET /api/tickets/:ticketId/comments` — Get comment thread for ticket.
- `POST /api/tickets/:ticketId/comments` — Add comment (**Rejected if status is 'Closed'**).

### Dashboard Analytics (`/api/dashboard`)
- `GET /api/dashboard/stats` — Retrieve aggregated ticket counts, priority/category breakdowns, and average resolution time in hours (Support only).

---

## 🧪 Automated Test Verification Results

All automated test suites pass with 100% success:

```
> helpdesk-backend@1.0.0 test:auth
--- STARTING MILESTONE 2 AUTH TESTS ---
✅ PASS: Health Check endpoint /api/health returns 200 OK
✅ PASS: Register customer returns 201 and JWT token
✅ PASS: Register support staff returns 201 and role=support
✅ PASS: Duplicate email registration correctly rejected with 400 Bad Request
✅ PASS: Password < 6 chars rejected with 400 Bad Request
✅ PASS: Login with valid credentials returns 200 and token
✅ PASS: Login with incorrect password rejected with 401 Unauthorized
✅ PASS: Protected /api/auth/me returns profile and strips password
✅ PASS: Accessing protected route without token rejected with 401 Unauthorized
✅ PASS: Accessing protected route with fake token rejected with 401 Unauthorized
--- TEST SUMMARY: 10 PASSED, 0 FAILED ---

> helpdesk-backend@1.0.0 test:backend
--- STARTING COMPREHENSIVE BACKEND BUSINESS RULES TESTS ---
✅ PASS: Registered customer successfully
✅ PASS: Registered support staff successfully
✅ PASS: Customer cannot create department (403 Forbidden)
✅ PASS: Support staff can create department (201 Created)
✅ PASS: Ticket created with readable ID: TKT-1011 and status 'Open'
✅ PASS: Customer can edit ticket while status is Open
✅ PASS: Customer can add comment with author and timestamp
✅ PASS: Support can advance status to 'In Progress'
✅ PASS: Customer CANNOT edit ticket when status is 'In Progress' (400 Bad Request)
✅ PASS: Customer CANNOT delete ticket when status is 'In Progress' (400 Bad Request)
✅ PASS: Support can mark ticket 'Resolved' and sets resolvedAt timestamp
✅ PASS: Resolved ticket successfully reopened once (reopenCount = 1)
✅ PASS: Resolved ticket CANNOT be reopened a second time (400 Bad Request)
✅ PASS: Support can advance status to 'Closed'
✅ PASS: Commenting on Closed ticket is rejected (400 Bad Request: Closed is read-only)
✅ PASS: Changing status of Closed ticket is rejected (400 Bad Request)
✅ PASS: Dashboard stats returned accurate aggregated counts and breakdowns
--- TEST SUMMARY: 17 PASSED, 0 FAILED ---
```
