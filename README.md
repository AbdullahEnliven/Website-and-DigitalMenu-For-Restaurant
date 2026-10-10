# Red Booth Diner (Node.js + Express + Postgres)

## Run in VS Code
    npm install
    copy .env.example .env      (then edit DATABASE_URL and ADMIN_PASSWORD)
    npm run dev

Site: http://localhost:3000   Admin: http://localhost:3000/admin
Tables and menu are created automatically every time the server starts. No manual SQL.

## Deploy on Railway
1. Push this folder to GitHub. Railway: New Project, Deploy from GitHub repo.
2. Add a PostgreSQL service in the same project.
3. Web service Variables: DATABASE_URL = ${{Postgres.DATABASE_URL}}, ADMIN_PASSWORD, AUTH_SECRET, RESTAURANT_TZ (example America/Chicago).
4. Settings, Networking, Generate Domain. Start command is `npm start` (detected automatically).

## Rules (lib/slots.js or env)
2 hour bookings, start times 11 AM to 9 PM restaurant time, at least 24 hours ahead (MIN_ADVANCE_HOURS), up to 30 days ahead.
Visitors see times in their own browser time zone. Images: see public/images/README.txt

## Admin
/admin asks for ADMIN_PASSWORD every time the page is opened (no username). Variables needed: DATABASE_URL, ADMIN_PASSWORD, RESTAURANT_TZ.
Orders have tabs Active, Completed, Cancelled. Reservations have Confirmed and Cancelled. Use the buttons on each row.
