Library Management System (NSCC Technical Domain Task 1)

LINK : https://nscc-library-management-system.onrender.com/

A full-stack, production-grade Library Management System built for colleges and institutions, featuring physical book copy tracking, individual accession-code QR generation and scanning, atomic issue/return workflows, double-issue prevention, live analytics, and XLSX reporting.

1. Project Overview & Architecture

Modern libraries manage physical copies of books, not just abstract titles. Each physical book copy possesses a unique Accession Code (e.g. ACC-CS-001) encoded into a barcode or QR code on its spine or inner cover.

Technology Stack

Frontend: React 19, Vite, Tailwind CSS, html5-qrcode (webcam scanning), Lucide Icons, Fetch API.

Backend: Node.js, Express, Mongoose ORM, xlsx (Excel export), qrcode (PNG/Data-URI generation).

Database: MongoDB / MongoDB Atlas with unique indexing and compound indexing on accession codes.

Testing & Quality: Vitest integration tests with in-memory MongoDB (mongodb-memory-server), automated E2E smoke tests, ESLint & TypeScript compilation checks.

┌─────────────────────────────────────────────────────────────┐
│                      Client (React + Vite)                  │
│  - Dashboard with live DB stats & active loans table       │
│  - Books & Physical Copies catalog with search/filters      │
│  - Issue & Return terminal (Camera QR Scanner + Manual)     │
│  - Transaction History with xlsx spreadsheet export         │
│  - Printable QR barcode label sheets                        │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON REST API
┌──────────────────────────────▼──────────────────────────────┐
│                    Backend (Express + Node.js)              │
│  - /api/books         : Book title & copy management        │
│  - /api/copies        : Accession code QR lookup            │
│  - /api/transactions  : Atomic Issue & Return workflows     │
│  - /api/dashboard     : Live calculated metrics & loans     │
└──────────────────────────────┬──────────────────────────────┘
                               │ Mongoose Driver (Session/Atomic)
┌──────────────────────────────▼──────────────────────────────┐
│                  MongoDB / MongoDB Atlas                    │
│  - Books (titles, metadata, counts)                         │
│  - BookCopies (unique accessionCode, status AVAILABLE/ISSUED)│
│  - Transactions (status ISSUED/RETURNED, dates, borrower)   │
└─────────────────────────────────────────────────────────────┘

2. Core Features & Business Workflows

Catalog & Copy Management:

Create books with title, author, category, ISBN, and initial copies.

Automatically assigns or accepts custom accession codes (e.g., ACC-CS-101).

Add new physical copies to existing titles at any time.

Live availability tracking (availableCopies dynamically synchronized with BookCopy statuses).

Search & Filtering:

Real-time search across Title, Author, ISBN, and Accession Code.

Category filtering (Computer Science, Mathematics, Physics, etc.).

Availability filtering: All, Available Only, or Issued Only.

QR Code Workflow & Accession Tracking:

Every physical copy generates an individual QR code encoding its unique accession code.

Camera QR Scanner: Real-time webcam scanning using html5-qrcode.

Manual Accession-Code Fallback: Reliable keyboard/barcode input with instant validation.

Printable Labels: Generates standardized, printable QR label sheets for physical book spine placement.

Atomic Issue Workflow:

Selects physical copy by accession code.

Validates copy status (AVAILABLE), borrower name, borrower roll number, and future due date.

Uses atomic session transactions to transition copy to ISSUED and insert an open transaction record.

Double-Issue Prevention: Rejects duplicate issues with clean 400 Bad Request error.

Atomic Return Workflow:

Scans accession code upon return.

Validates copy is currently in ISSUED state.

Atomically updates transaction status to RETURNED, sets returnDate, records optional return condition remarks, and restores copy status to AVAILABLE.

Duplicate-Return Prevention: Rejects returning copies that are already available on library shelves.

Dashboard & Overdue Analytics:

Live counts directly calculated from MongoDB collections:

Total Titles

Total Physical Copies

Available Copies

Currently Issued Copies

Overdue Copies (active loans past due date)

Active Transactions count

Active Loans Table: Real-time view of currently issued books with borrower name, roll number, issue date, due date, overdue tag, and quick return actions.

Member Management & Contact Tracking:

Register students, faculty members, and institutional staff with auto-generated unique membership IDs (e.g. STU-2026-0042, FAC-2026-0001).

Track contact information (full name, email, phone number, academic department).

Configurable borrowing quota (default 3 books for students, 5 for faculty).

Safe lifecycle management: blocks member deactivation/deletion if member holds unreturned book copies.

Quick-select integration into the Issue & Return terminal for instantaneous autofill.

XLSX Transaction History Export:

Generates Excel workbook using the xlsx library with columns: Sl No, Accession Code, Book Title, Author, Category, ISBN, Borrower Name, Roll Number, Issue Date, Due Date, Return Date, Status, Overdue, and Remarks.

3. Environment Variables

Create .env in server/ (or root for unified runtime):

# Server Port
PORT=5000

# MongoDB Connection String (Local MongoDB or MongoDB Atlas)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/library_db?retryWrites=true&w=majority

# Client Origin for CORS
CLIENT_URL=http://localhost:5173

# Node Environment
NODE_ENV=development

4. Local Setup & Execution

Prerequisites

Node.js >= 20.0.0

npm >= 10.0.0

MongoDB instance (local or MongoDB Atlas connection string)

Running Server & Client

Option A: Running from Subdirectories

# 1. Backend Server
cd server
npm install
npm run dev        # Runs on http://localhost:5000

# 2. Frontend Client (in a separate terminal)
cd client
npm install
npm run dev        # Runs on http://localhost:5173

Option B: Running Unified Root Application

npm install
npm run dev        # Starts full-stack server on http://localhost:3000

5. Running Tests & Smoke Verification

The project includes an automated test suite powered by Vitest and an in-memory MongoDB instance (mongodb-memory-server).

Run Unit & Integration Tests:

npm --prefix server test

Executes 18 comprehensive tests covering book/copy consistency, unique accession code indexing, rollback on copy failure, issue/return atomic states, double-issue protection, overdue calculations, XLSX export validation, search/availability filtering, and student/faculty Member Management workflows.

Run End-to-End Smoke Script:

npm --prefix server run smoke

Runs an end-to-end sanity check validating health check, title creation, duplicate accession code rejection (409), QR code lookup, book copy issuance, duplicate issue blocking (400), copy return, duplicate return blocking (400), live dashboard metrics, and binary XLSX export.

6. API Reference

Method

Endpoint

Description

GET

/api/health

Service uptime and health status

GET

/api/books

List books with search, category, and availability filters

POST

/api/books

Catalog a new title and generate initial physical copies

GET

/api/books/:id

Retrieve single book title with all its copies

POST

/api/books/:id/copies

Add physical copies to an existing book title

GET

/api/copies/lookup/:code

Look up copy details and QR code data URL by accession code

POST

/api/transactions/issue

Issue an available book copy to a student/borrower

POST

/api/transactions/return

Return an issued book copy and close transaction

GET

/api/transactions

Query borrowing transaction history with filters

GET

/api/transactions/export

Download complete transaction history as an XLSX spreadsheet

GET

/api/dashboard/stats

Retrieve live computed dashboard metrics and active loans

GET

/api/members

List registered members with search, role, and status filters

POST

/api/members

Register a new student or faculty member

GET

/api/members/lookup/:query

Quick lookup member by roll number or membership ID

GET

/api/members/:id

Get member details and currently active book loans

PUT

/api/members/:id

Update member contact details, department, or permissions

DELETE

/api/members/:id

Deactivate/archive member (safely blocked if books on loan)

7. Production Deployment Guide

Frontend Deployment (Vercel)

Push repository to GitHub.

In Vercel, import the repository and set:

Root Directory: client

Build Command: npm run build

Output Directory: dist

Environment Variable: VITE_API_URL=https://your-backend.onrender.com

Deploy. The included client/vercel.json ensures SPA route rewrites to index.html.

Backend Deployment (Render)

In Render, create a new Web Service from the GitHub repository:

Root Directory: server

Environment: Node

Build Command: npm install

Start Command: npm start

Environment Variables:

NODE_ENV=production

PORT=10000

MONGODB_URI=<your_mongodb_atlas_connection_string>

CLIENT_URL=https://your-frontend.vercel.app

Alternatively, deploy using the root render.yaml Blueprint spec.
