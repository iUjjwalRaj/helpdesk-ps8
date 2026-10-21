# PS8 Project Presentation, Demo Outline & Viva Guide

---

## 📑 1. PowerPoint Slide Outline (8 Slides)

### Slide 1: Title & Overview
- **Project Title:** PS8: Complaint & Helpdesk Ticket System
- **Subtitle:** Full-Stack MERN Architecture with Role-Based Access & Automated Resolution Metrics
- **Student Name & Roll Number**
- **Tech Stack:** React 19, Node.js, Express.js, MongoDB Atlas / Mongoose, Vanilla CSS

### Slide 2: Problem Statement & Objectives
- **Core Challenge:** Organizations struggle with lost complaints, untracked priority escalations, and unmonitored team resolution times.
- **Project Goal:** Build an end-to-end helpdesk portal that:
  - Automates sequential ticket IDs (`TKT-1001`, `TKT-1002`).
  - Enforces strict lifecycle state machines (`Open` ➔ `In Progress` ➔ `Resolved` ➔ `Closed`).
  - Segregates Customer vs. Support Staff privileges.
  - Generates live resolution analytics.

### Slide 3: System Architecture & Workflow
- **Client (Frontend):** React Single-Page Application (SPA) powered by Vite and React Router v7.
- **Server (Backend REST API):** Express server with layered architecture: `config`, `models`, `controllers`, `routes`, `middleware`.
- **Database (MongoDB):** 5 collections: `users`, `departments`, `tickets`, `comments`, `counters`.
- **Security:** Signed JSON Web Tokens (JWT) in HTTP `Authorization: Bearer <token>` headers + `bcryptjs` password hashing.

### Slide 4: Database Schema & Entity Relationships
- **User:** `name`, `email` (unique), `password` (hashed), `role` (`customer` / `support`).
- **Department:** `name` (unique), `description`, `isActive`.
- **Ticket:** `ticketId` (indexed unique), `customer` (ref `User`), `department` (ref `Department`), `title`, `category`, `priority`, `status`, `reopenCount`, `resolvedAt`, `closedAt`, timestamps.
- **Comment:** `ticket` (ref `Ticket`), `author` (ref `User`), `authorRole`, `message`, timestamps.
- **Counter:** `_id` (`ticketId`), `seq` (atomic counter).

### Slide 5: Core Business Rules (Backend Enforcement)
- **Rule 1 (Open-Only Modification):** Customers can only edit or delete a ticket when its status is `Open`. Once moved to `In Progress`, edits/deletions return `400 Bad Request`.
- **Rule 2 (Single Reopen Constraint):** A `Resolved` ticket can only be reopened once (`reopenCount < 1`). Subsequent attempts return `400 Bad Request`.
- **Rule 3 (Closed Immutability):** `Closed` tickets are strictly read-only. No edits, status transitions, or comments are accepted.
- **Rule 4 (Data Isolation):** Customers can only view and comment on their own tickets (`req.user._id === ticket.customer`).

### Slide 6: Support Analytics & Resolution Metrics
- **Live Calculations:**
  - Total Tickets, Active Tickets (`Open` + `In Progress`), Resolved Tickets (`Resolved` + `Closed`).
  - **Average Resolution Time:** Computed from `(resolvedAt - createdAt)` in hours across all resolved tickets.
  - Priority Breakdown (`Low`, `Medium`, `High`, `Urgent`).
  - Category Breakdown (`Technical`, `Billing`, `Account`, `Hardware`, `Other`).

### Slide 7: Verification & Testing
- Automated unit and integration test suites:
  - `npm run test:auth` (10 passing tests)
  - `npm run test:backend` (17 passing business rule tests)
  - Production build compiled with 0 errors via Vite in ~180ms.

### Slide 8: Conclusion & Future Enhancements
- Robust, reliable, lightweight, and compliant with all PS8 problem statement requirements.
- Future scope: Email notifications via SendGrid/Nodemailer, file attachments via AWS S3 / Cloudinary, and SLA escalation alerts.

---

## ⏱️ 2. 5–10 Minute Technical Demonstration Script

### Minute 0:00 – 1:30: Introduction & Architecture Walkthrough
- Open the application at `http://localhost:5173`.
- Mention: *"This is a MERN stack Complaint & Helpdesk Ticket System. All business rules and authorization checks are enforced on the Express backend and backed by MongoDB."*
- Highlight the clean login page with 1-click demo buttons.

### Minute 1:30 – 3:30: Customer Experience
1. Click **"Customer (Rahul)"** quick demo login.
2. Show the **"My Tickets"** table: point out the formatted IDs (`TKT-1001`, `TKT-1003`).
3. Click **"+ Submit New Ticket"**:
   - Create a ticket: Category: *Hardware*, Priority: *Urgent*, Subject: *"Docking station power adapter failed"*.
   - Point out that it gets assigned an atomic ID like `TKT-1011` with initial status `Open`.
4. Demonstrate **Open-only Editing**:
   - Click **"Edit"** on the newly created Open ticket, update the title, and save.
   - Point out that the Edit button is active.

### Minute 3:30 – 6:00: Support Staff & Workflow Progression
1. Logout and click **"Support Admin"** quick demo login.
2. Show the **Analytics Dashboard**:
   - Total tickets, Active vs Resolved counts, Priority breakdown, and Average Resolution Time.
3. Click **"All Tickets"**:
   - Filter by *Category: Hardware* and *Priority: Urgent*.
   - Click **"Manage ➔"** on the ticket created by Rahul.
4. Advance the workflow:
   - Assign to *Hardware & Infrastructure* department.
   - Change status to **"In Progress"**.
   - Add a comment: *"Replacement adapter dispatched via express courier."*
5. Change status to **"Resolved"** (explain that backend automatically sets `resolvedAt` timestamp).

### Minute 6:00 – 7:30: Reopen Enforcement & Closed Immutability
1. Logout and log back in as **"Customer (Rahul)"**.
2. Open the ticket: notice the **"Issue Resolved: Reopen Ticket"** banner.
3. Click **"🔄 Reopen Ticket"**:
   - Status transitions back to `In Progress`, and `reopenCount` becomes `1`.
   - Try to edit the description: point out it is now locked because status is no longer `Open`.
4. Switch back to Support Admin:
   - Mark status as **"Resolved"** and then **"Closed"**.
5. Show **Closed Immutability**:
   - Comment box disappears with a clear notice: *"Closed tickets are read-only"*.

### Minute 7:30 – 8:30: Departments CRUD
1. Navigate to **"Departments"** as Support Admin.
2. Add a new department: *"DevOps & Cloud"*.
3. Edit its description and demonstrate that it appears in all ticket dropdowns.

### Minute 8:30 – 10:00: Viva Q&A & Code Inspection
- Show `backend/models/Ticket.js`, `backend/controllers/ticketController.js`, and `npm run test:backend` output.

---

## 🎯 3. Top Viva Questions & Answers

### Q1: How do you prevent race conditions when generating ticket IDs like `TKT-1001`?
> **Answer:** *"We use an atomic `Counter` collection in MongoDB with `findByIdAndUpdate` and the `$inc` operator. Because MongoDB updates single documents atomically, even if hundreds of users submit tickets at the exact same millisecond, each request receives a unique, sequential number without collisions."*

### Q2: Why hash passwords with bcrypt instead of MD5 or SHA-256?
> **Answer:** *"MD5 and SHA-256 are fast general-purpose hash functions vulnerable to brute-force and rainbow table attacks. Bcrypt is an adaptive key-derivation function that includes a random cryptographic salt and a configurable work factor (cost). This makes calculating billions of hashes computationally impractical for attackers."*

### Q3: Where are business rules enforced, and why not just in the React frontend?
> **Answer:** *"Business rules are strictly enforced on the Express backend controllers (`ticketController.js`). Frontend UI validation can be bypassed by directly sending HTTP requests via tools like curl or Postman. Validating on the backend guarantees data integrity regardless of how the request was sent."*

### Q4: How is the Average Resolution Time calculated?
> **Answer:** *"When a ticket status transitions to `Resolved`, the server records `resolvedAt = new Date()`. In `dashboardController.js`, we query all tickets where `resolvedAt` is not null, compute the difference `(resolvedAt - createdAt)` in milliseconds, convert to hours, and divide by the total number of resolved tickets."*

### Q5: How does JWT authentication work in this application?
> **Answer:** *"Upon successful login, the server signs a JWT containing the user's `_id` and `role` using a secret key (`JWT_SECRET`). The client stores this in `localStorage` and sends it in the `Authorization: Bearer <token>` header. The `authMiddleware.js` verifies the cryptographic signature with `jwt.verify()` and loads the user without requiring a database session store."*

### Q6: What happens if a customer attempts to edit a ticket that is In Progress?
> **Answer:** *"The backend controller checks `ticket.status !== 'Open'`. If true, it rejects the request with HTTP `400 Bad Request` and the message: 'Ticket can only be edited while status is Open'. The frontend also conditionally hides the Edit button."*

---

## ✅ 4. Final Submission Checklist

- [x] Git repository clean with meaningful commit history (`git log`).
- [x] `.env` files ignored by `.gitignore` (no credentials committed).
- [x] `.env.example` templates provided in both `backend/` and `frontend/`.
- [x] Backend automated tests passing (`npm run test:auth` and `npm run test:backend`).
- [x] Database seeder (`npm run seed`) creating 10+ realistic sample tickets, departments, and users.
- [x] Frontend production bundle verified with zero errors (`npm run build`).
- [x] Demo accounts clearly documented for examiners (`support@helpdesk.com`, `rahul@gmail.com`, `priya@gmail.com`).
- [x] Comprehensive [README.md](file:///Users/ujjwalraj/Desktop/HELP-DESK/README.md) and [VIVA_GUIDE.md](file:///Users/ujjwalraj/Desktop/HELP-DESK/VIVA_GUIDE.md) ready.
