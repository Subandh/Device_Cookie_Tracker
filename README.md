# Device_Cookie_Tracker
# Device Tracker — Visitor and Device Analytics System

## Overview

Device Tracker is a Node.js and PostgreSQL based web application designed to monitor how many times a device visits a website. The system tracks both anonymous visitors and registered users using secure cookies and device identifiers.

The application provides:

* Anonymous visitor tracking using a device cookie.
* Registered user login tracking.
* Device usage analytics.
* Administrative dashboard for monitoring system activity.

---

## Features

### Visitor Tracking

* Automatically assigns a unique `device_id` cookie when a visitor enters the website.
* Tracks every visit made by a device.
* Maintains visit count and last seen timestamp.

### User Authentication

* User registration and login system.
* Password hashing using bcrypt.
* JWT-based authentication stored in HTTP-only cookies.

### Device Tracking

* Tracks devices used by registered users during login.
* Maintains login count per device.
* Logs IP address for each login event.

### Admin Dashboard

* View total users.
* View total devices used for login.
* View total login events.
* View anonymous visitor device analytics.
* View registered user device activity.

---

## Technology Stack

Backend:

* Node.js
* Express.js
* PostgreSQL
* JWT Authentication
* bcrypt password hashing

Frontend:

* HTML
* CSS
* Vanilla JavaScript

Database:

* PostgreSQL using `pg` connection pooling.

---

## Project Structure

```
device-tracker/
│
├── config/
│   └── db.js
│
├── middleware/
│   └── auth.js
│
├── routes/
│   ├── auth.js
│   ├── admin.js
│   └── track.js
│
├── public/
│   ├── login.html
│   └── admin.html
│
├── server.js
├── .env
└── README.md
```

---

## Environment Setup

Create a `.env` file in the project root.

Example:

```
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/devicetracker
JWT_SECRET=your_secret_key
```

---

## Database Setup

Create the required tables inside PostgreSQL.

### Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user'
);
```

### Devices Table

```sql
CREATE TABLE devices (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  login_count INT DEFAULT 1,
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, device_id)
);
```

### Login Logs

```sql
CREATE TABLE login_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  device_id TEXT,
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Visitor Device Tracking

```sql
CREATE TABLE device_visits (
  device_id TEXT PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  visit_count INT DEFAULT 0,
  last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Installation

Clone the repository:

```
git clone <repository-url>
cd device-tracker
```

Install dependencies:

```
npm install
```

---

## Running the Application

Start PostgreSQL.

Run the server:

```
node server.js
```

Server will start on:

```
http://localhost:5000
```

---

## How Tracking Works

### Anonymous Visitor

1. User opens website.
2. Backend checks for `device_id` cookie.
3. If missing, a new device ID is generated.
4. Visit count increases.

### Registered User

1. User logs in.
2. JWT cookie is created.
3. Device is recorded in `devices` table.
4. Login event is stored in `login_logs`.
5. Device visits link to the user account.

---

## Testing the System

Open:

```
http://localhost:5000/login.html
```

Register a user using API or Postman.

Promote the user to admin:

```sql
UPDATE users SET role='admin' WHERE email='user@email.com';
```

Login and access:

```
http://localhost:5000/admin.html
```

---

## Security Notes

* JWT tokens are stored in HTTP-only cookies.
* Passwords are hashed using bcrypt.
* Role-based access protects admin routes.

<img width="1100" height="939" alt="image" src="https://github.com/user-attachments/assets/c518c540-123e-4147-99b5-b76d7505b908" />
