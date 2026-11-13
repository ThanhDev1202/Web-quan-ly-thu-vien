# Library Management System

## Overview
This repository contains a **full‑stack library management web application** built with:
- **Node.js (Express)** backend exposing a RESTful API
- **React** front‑end SPA
- **MySQL** database (schema provided in the uploaded SQL file)
- JWT‑based authentication & role‑based access control (admin, librarian, reader)
- Extensible architecture so you can later plug in:
  - an AI chat‑bot (e.g., Gemini, OpenAI) via a dedicated `/chat` endpoint
  - blockchain integration for immutable audit logs
  - HQC (post‑quantum) encryption for sensitive data

The project is split into two folders:
```
project_web/
├─ backend/   # Node.js API
└─ frontend/  # React UI
```

## Prerequisites
- Node.js 20+ (download from https://nodejs.org)
- MySQL server (local or remote). Create a database named `library_management` using the provided `gemini-code-1794492682434.sql` script.
- **(Optional)** Yarn or PNPM – we'll use npm in the examples.

## Setup
### 1. Clone / create the project structure
The folders above already exist. If you start from scratch, run:
```bash
mkdir -p project_web/backend project_web/frontend
```
### 2. Backend
```bash
cd project_web/backend
npm init -y
npm install express sequelize mysql2 jsonwebtoken bcryptjs dotenv cors
```
Create the following files (provided in this repo): `src/app.js`, `src/config/db.js`, `src/models/*.js`, `src/routes/*.js`, `.env.example`.

### 3. Frontend
```bash
cd ../frontend
npx create-react-app .
npm install axios react-router-dom jwt-decode
```
Replace the generated `src/App.js` and add the components under `src/components/` (provided).

### 4. Run
```bash
# backend
cd ../backend
npm run dev   # (you can add a dev script using nodemon)
# frontend
cd ../frontend
npm start
```
The API will be available at `http://localhost:5000/api` and the React app at `http://localhost:3000`.

---
## Extending the System
- **AI Chat‑Bot** – add a micro‑service that consumes the OpenAI/Gemini API and expose `/api/chat`. The front‑end can call this endpoint to get contextual help.
- **Blockchain** – create a service that writes immutable audit entries to a smart‑contract (e.g., Ethereum, Hyperledger). Hook it into the `audit_logs` table trigger or call from the Express route after each critical action.
- **HQC Encryption** – use a post‑quantum cryptography library (e.g., `node-liboqs`) to encrypt fields like `password_hash` or personal data before persisting.

Refer to the code comments for places where these integrations can be plugged in.
