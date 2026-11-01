# Campus Connect Pro
**Team name:** Innovatrix  
**Project title:** Campus Connect Pro — Role-Based Smart College Portal

## Project stack
- Frontend: React + Vite + React Router
- Backend starter: Node.js + Express
- Database: MongoDB with Mongoose
- Authentication API: bcrypt password hashing + JWT
- PDF API: Multer upload middleware; local upload directory for demonstration

## Roles and intended access
- **Student:** browse subject notes and previous-year question papers; view attendance percentage and mid/semester results.
- **Faculty:** upload subject PDFs/question papers; view attendance and results; publish academic notices.
- **Library staff:** upload and organize subject resources and previous-year papers.
- **Administrator:** planned management of user accounts and portal settings.

## Start the frontend
1. Install Node.js LTS (includes npm).
2. Open this folder in VS Code.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open the localhost address shown by Vite, usually `http://localhost:5173`.

The frontend currently uses demo role selection and sample data to preview the interface. The selected role is not secure authentication. The upload form adds a browser-local sample listing and does not upload the file to the backend yet.

## Start the backend API
1. Run `npm install --prefix server`.
2. Copy `server/.env.example` to `server/.env`.
3. Fill in a MongoDB Atlas URI and a long random `JWT_SECRET`.
4. Run `npm run dev --prefix server`.
5. Check `http://localhost:5000/api/health`.

## Backend endpoints included
- `POST /api/auth/register` — student registration only
- `POST /api/auth/login` — verifies registered users
- `GET /api/notices` and `POST /api/notices` — faculty/admin notice publishing
- `GET /api/resources` and `POST /api/resources` — PDF resource list/upload; faculty/library/admin roles
- `GET /api/attendance/demo` and `GET /api/results/demo` — sample authenticated endpoints

## Important implementation notes
This is a semester-project starter, not a production-ready college system. The frontend still needs API integration for login, uploads, attendance and results. The PDF endpoint saves files locally on the server and is intended for local demonstration; for deployment use persistent object storage, file scanning, authorization-aware downloads, request validation and backups. Attendance and result screens show sample data and must be connected to real authorized records. Create staff accounts securely through a controlled admin workflow before using the system. Do not commit `server/.env` or real student information to source control.
