Library Management System

NSCC Technical Domain Task 1

A full-stack Library Management System built for the NSCC Technical Domain Task 1. The system manages physical book copies using unique accession codes and QR codes, supports QR-based issue and return, tracks transaction history and overdue books, manages library members, and provides downloadable Excel reports.

🔗 Project Links


https://nscc-library-management-system.onrender.com/



The Vercel URL is the user-facing frontend. The Render URL hosts the Express backend API.

📌 Project Overview

The system is designed around physical book copies, not just book titles. Each physical copy receives a unique Accession Code and QR code, allowing the library to track the exact copy that is issued or returned.

Main capabilities

Book and physical-copy management

Unique accession codes

QR code generation

Camera-based QR scanning

Manual accession-code fallback

Book issue and return

Duplicate issue/return prevention

Transaction history

Overdue tracking

Member management

Borrowing limits

Dashboard analytics

XLSX transaction export

Printable QR labels

Server-side validation and error handling

🏗️ Architecture

┌──────────────────────────────┐
│       React + Vite           │
│          Frontend            │
│           Vercel             │
└──────────────┬───────────────┘
               │
               │ REST API / JSON
               ▼
┌──────────────────────────────┐
│      Node.js + Express       │
│           Backend            │
│           Render             │
└──────────────┬───────────────┘
               │
               │ Mongoose
               ▼
┌──────────────────────────────┐
│        MongoDB Atlas         │
│          Database            │
└──────────────────────────────┘

🛠️ Technology Stack

Frontend

React

Vite

html5-qrcode

Lucide React

Fetch API

CSS

Backend

Node.js

Express.js

Mongoose

qrcode

xlsx

Database

MongoDB

MongoDB Atlas

Testing

Vitest

Supertest

MongoDB Memory Server

API smoke tests

Deployment

Vercel — Frontend

Render — Backend

MongoDB Atlas — Database

✨ Core Features & Workflows

1. Book & Physical Copy Management

Administrators can:

Create books with title, author, ISBN and category

Add multiple physical copies

Generate unique accession codes

Add copies to existing titles

View copy availability

Archive records when required

Each physical copy is independently tracked.

Example:

Introduction to Algorithms

ACC-CS-001 → AVAILABLE
ACC-CS-002 → ISSUED
ACC-CS-003 → AVAILABLE

2. QR Code Workflow

Every physical copy receives an individual QR code containing its unique accession code.

The system supports:

QR generation

QR lookup

Camera-based QR scanning

Manual accession-code entry

Printable QR labels

Camera scanning is implemented using html5-qrcode.

3. Book Issue Workflow

The circulation workflow allows an operator to:

Scan or enter the accession code

Verify the physical copy

Select a registered member

Set the due date

Issue the copy

The backend validates:

Copy existence

Copy availability

Borrower details

Due date

Duplicate issue attempts

An already-issued copy cannot be issued again.

4. Book Return Workflow

A physical copy can be returned using its QR/accession code.

The backend:

Verifies that the copy is currently issued

Closes the active transaction

Stores the return timestamp

Updates the copy to AVAILABLE

Calculates overdue status where applicable

Records optional remarks

Duplicate return attempts are rejected.

5. Dashboard & Overdue Analytics

The dashboard provides live circulation information including:

Total book titles

Total physical copies

Available copies

Issued copies

Overdue copies

Active transactions

The active-loans view shows borrower details, issue dates, due dates and overdue status.

6. Search & Filtering

Books can be searched and filtered using:

Title

Author

ISBN

Accession Code

Category

Availability

Transactions can be filtered using:

Borrower

Accession code

Status

Overdue status

7. Member Management

The system supports registered:

Students

Faculty

Staff

Member information can include:

Membership ID

Name

Roll/employee number

Email

Phone

Department

Role

Borrowing limit

Active/inactive status

The system also supports member lookup and safe lifecycle management when active books are still on loan.

8. Transaction History

Each circulation record stores:

Book

Physical copy

Accession code

Borrower

Issue timestamp

Due date

Return timestamp

Status

Overdue information

Remarks

This provides a complete history of book circulation.

9. XLSX Export

Transaction history can be exported as an Excel workbook containing fields such as:

Accession Code

Book Title

Author

Category

ISBN

Borrower Name

Roll Number

Issue Date

Due Date

Return Date

Status

Overdue

Remarks
## 3. Environment Variables

Create `.env` in `server/` (or root for unified runtime):

```env
# Server Port
PORT=5000

# MongoDB Connection String (Local MongoDB or MongoDB Atlas)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/library_db?retryWrites=true&w=majority

# Client Origin for CORS
CLIENT_URL=http://localhost:5173

# Node Environment
NODE_ENV=development
```

---

## 4. Local Setup & Execution

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0
- MongoDB instance (local or MongoDB Atlas connection string)

### Running Server & Client

#### Option A: Running from Subdirectories
```bash
# 1. Backend Server
cd server
npm install
npm run dev        # Runs on http://localhost:5000

# 2. Frontend Client (in a separate terminal)
cd client
npm install
npm run dev        # Runs on http://localhost:5173
```

#### Option B: Running Unified Root Application
```bash
npm install
npm run dev        # Starts full-stack server on http://localhost:3000
```

---

## 5. Running Tests & Smoke Verification

The project includes an automated test suite powered by Vitest and an in-memory MongoDB instance (`mongodb-memory-server`).

### Run Unit & Integration Tests:
```bash
npm --prefix server test
```
*Executes 18 comprehensive tests covering book/copy consistency, unique accession code indexing, rollback on copy failure, issue/return atomic states, double-issue protection, overdue calculations, XLSX export validation, search/availability filtering, and student/faculty Member Management workflows.*

### Run End-to-End Smoke Script:
```bash
npm --prefix server run smoke
```
*Runs an end-to-end sanity check validating health check, title creation, duplicate accession code rejection (409), QR code lookup, book copy issuance, duplicate issue blocking (400), copy return, duplicate return blocking (400), live dashboard metrics, and binary XLSX export.*

---

## 6. API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service uptime and health status |
| `GET` | `/api/books` | List books with search, category, and availability filters |
| `POST` | `/api/books` | Catalog a new title and generate initial physical copies |
| `GET` | `/api/books/:id` | Retrieve single book title with all its copies |
| `POST` | `/api/books/:id/copies` | Add physical copies to an existing book title |
| `GET` | `/api/copies/lookup/:code` | Look up copy details and QR code data URL by accession code |
| `POST` | `/api/transactions/issue` | Issue an available book copy to a student/borrower |
| `POST` | `/api/transactions/return` | Return an issued book copy and close transaction |
| `GET` | `/api/transactions` | Query borrowing transaction history with filters |
| `GET` | `/api/transactions/export` | Download complete transaction history as an XLSX spreadsheet |
| `GET` | `/api/dashboard/stats` | Retrieve live computed dashboard metrics and active loans |
| `GET` | `/api/members` | List registered members with search, role, and status filters |
| `POST` | `/api/members` | Register a new student or faculty member |
| `GET` | `/api/members/lookup/:query` | Quick lookup member by roll number or membership ID |
| `GET` | `/api/members/:id` | Get member details and currently active book loans |
| `PUT` | `/api/members/:id` | Update member contact details, department, or permissions |
| `DELETE` | `/api/members/:id` | Deactivate/archive member (safely blocked if books on loan) |

---

## 7. Production Deployment Guide

### Frontend Deployment (Vercel)
1. Push repository to GitHub.
2. In Vercel, import the repository and set:
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variable**: `VITE_API_URL=https://your-backend.onrender.com`
3. Deploy. The included `client/vercel.json` ensures SPA route rewrites to `index.html`.

### Backend Deployment (Render)
1. In Render, create a new **Web Service** from the GitHub repository:
   - **Root Directory**: `server`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `NODE_ENV=production`
     - `PORT=10000`
     - `MONGODB_URI=<your_mongodb_atlas_connection_string>`
     - `CLIENT_URL=https://your-frontend.vercel.app`
2. Alternatively, deploy using the root `render.yaml` Blueprint spec.
