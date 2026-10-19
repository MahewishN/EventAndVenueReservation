# SlotLock — Event & Venue Reservation Platform

SlotLock is a full-stack web application that simplifies event and venue reservations by allowing users to explore available resources, view available time slots, and book reservations online. Administrators can manage bookable resources and their availability through a centralized platform.

The application uses secure authentication, role-based authorization, and automated email OTP delivery to provide a structured reservation experience.

## 🌐 Live Demo

| Component | Details |
|---|---|
| 🖥️ **Frontend** | [SlotLock Live Application](https://slotlock-frontend.vercel.app/) |
| ⚙️ **Backend** | Spring Boot REST API hosted on Render |
| 🗄️ **Database** | PostgreSQL hosted on Render |
| 📧 **Email Service** | SendGrid for OTP email delivery |

> **Note:** The backend is hosted on Render's free tier, so the first request after inactivity may take some time to respond.

## 🚀 Tech Stack

### Backend
- **Java 21**
- **Spring Boot 3.5.10**
- **Spring Security** for authentication and authorization
- **JWT** for access and refresh token-based authentication
- **Spring Data JPA / Hibernate** for persistence
- **PostgreSQL** as the relational database
- **Maven** for dependency management
- **SendGrid Mail API** for email delivery and OTP workflows

### Frontend
- **React**
- **Vite**
- **Tailwind CSS**
- **Axios** for API communication
- **React Router** for client-side navigation

### Deployment & DevOps
- **Docker** for containerization
- **Docker Compose** for local multi-container development
- **Render** for backend hosting and managed PostgreSQL
- **Vercel** for frontend hosting
- **Git and GitHub** for version control

## ✨ Features

### Authentication & Security
- User registration and login
- JWT-based access and refresh token handling
- Role-based authorization with `USER` and `ADMIN` roles
- Password hashing and secure credential handling
- Email OTP functionality
- Configurable token expiration
- Centralized exception handling

### Resource Management
- Manage multiple bookable resources
- Support different resource types, such as seminar halls, wedding halls, and turfs
- Retrieve resource information through REST APIs

### Slot Management
- Generate and manage time slots for bookable resources
- Associate slots with resources and dates
- Track slot availability
- Prevent duplicate resource slots through database constraints

### Booking Management
- Book available time slots
- Associate bookings with users and resources
- Integrate booking operations with the slot management module

### Deployment & Configuration
- Containerized backend and frontend for local development
- Environment-based configuration for deployment
- Managed PostgreSQL database
- Production frontend and backend deployments
- SendGrid integration for production email delivery

## 🏗️ Project Structure

The project is organized into separate backend and frontend applications.

```text
EventAndVenueReservation/
├── slotlock/                  # Spring Boot backend
│   ├── src/main/java/com/slotlock/
│   │   ├── auth/              # Authentication
│   │   ├── user/              # User management
│   │   ├── security/          # JWT and security configuration
│   │   ├── resource/          # Bookable resources
│   │   ├── slot/              # Slot management
│   │   ├── booking/           # Booking operations
│   │   ├── config/            # Application configuration
│   │   └── exception/         # Exception handling
│   ├── src/main/resources/
│   │   └── application.properties
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── pom.xml
│   └── .env                   # Local secrets; not committed
│
└── slotlock-frontend/         # React frontend
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── services/
    │   └── utils/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    └── .env                   # Local configuration; not committed
```

## ⚙️ Getting Started

### Prerequisites

Install the following:

- Java 21
- Maven, or use the included Maven Wrapper
- Node.js and npm
- PostgreSQL, or Docker Desktop with Docker Compose
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/MahewishN/EventAndVenueReservation.git
cd EventAndVenueReservation
```

### 2. Configure the Backend

Navigate to the backend directory:

```bash
cd slotlock
```

Create a local `.env` file containing your local database credentials, JWT secret, and email provider configuration. Use the environment variable names expected by your application.

Do not commit `.env` or expose database passwords, JWT secrets, or email API keys.

### 3. Start the Database and Backend

If using the provided Docker Compose configuration:

```bash
docker compose up --build -d
```

Alternatively, configure PostgreSQL and run the backend using the Maven Wrapper:

```bash
./mvnw spring-boot:run
```

On Windows, use:

```powershell
.\mvnw.cmd spring-boot:run
```

The backend's local address is typically:

```text
http://localhost:8080
```

### 4. Start the Frontend

Open another terminal:

```bash
cd slotlock-frontend
npm install
npm run dev
```

The Vite development server typically runs at:

```text
http://localhost:5173
```

Configure `VITE_API_BASE_URL` to point to the backend address when running the frontend locally.

## 🔐 Environment Configuration

The backend uses environment-based configuration to keep deployment settings separate from application code.

Typical backend configuration includes:

| Variable | Purpose |
|---|---|
| `DB_URL` | JDBC database connection URL |
| `DB_USERNAME` | Database username |
| `DB_PASSWORD` | Database password |
| `JWT_SECRET` | Secret used for JWT signing |
| `SENDGRID_API_KEY` | SendGrid API key used to send emails through the SendGrid API |
| `SENDGRID_FROM_EMAIL` | Verified sender email address configured in SendGrid |
| `VITE_API_BASE_URL` | Frontend API base URL |

For production email delivery, configure the SendGrid Mail API credentials using the variable names expected by the application's current SendGrid integration.

Never commit real credentials to GitHub. Frontend variables prefixed with `VITE_` are embedded in client-side builds and must not contain secrets.

## 📡 API Endpoints

SlotLock provides REST APIs for authentication, user account management, resource management, slot availability, and bookings.

### 1. Authentication & Account Management

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Start registration and send an email OTP | Public |
| `POST` | `/api/auth/verify-registration` | Verify registration OTP and create the account | Public |
| `POST` | `/api/auth/login` | Authenticate a user and obtain tokens | Public |
| `POST` | `/api/auth/refresh` | Refresh authentication tokens | Refresh token |
| `POST` | `/api/auth/forgot-password` | Request a password-reset OTP | Public |
| `POST` | `/api/auth/reset-password` | Reset password using the reset request | Public |
| `POST` | `/api/auth/change-password` | Change the authenticated user's password | Authenticated |

### 2. Resource Management

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/resources` | Retrieve all resources | As permitted by security configuration |
| `GET` | `/api/resources/{id}` | Retrieve a resource by ID | As permitted by security configuration |
| `POST` | `/api/resources` | Create a resource | Admin |
| `POST` | `/api/resources/{id}` | Update a resource | Admin |
| `PATCH` | `/api/resources/{id}/status` | Update resource status | Admin |

### 3. Slot Management

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/slots/{slotId}` | Retrieve a slot by ID | As permitted by security configuration |
| `GET` | `/api/resources/{resourceId}/slots?date=YYYY-MM-DD` | Retrieve slots for a resource on a specified date | As permitted by security configuration |
| `POST` | `/api/admin/slots/generate` | Generate slots for a date | Admin |
| `PATCH` | `/api/slots/{slotId}/status` | Update slot status | Admin |

### 4. Booking Management

| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/bookings` | Create a booking | As permitted by security configuration |
| `GET` | `/api/bookings/me` | Retrieve the authenticated user's bookings | As permitted by security configuration |
| `POST` | `/api/bookings/{bookingId}/confirm` | Confirm a booking | As permitted by security configuration |
| `DELETE` | `/api/bookings/{bookingId}` | Cancel a booking | As permitted by security configuration |

### Authentication

Protected requests use a JWT access token in the HTTP authorization header:

```http
Authorization: Bearer <access_token>
```
Obtain tokens through the login endpoint. When the access token expires, use the refresh endpoint with the refresh token according to the application's authentication flow.


## ☁️ Deployment

SlotLock is deployed using the following services:

- **Render:** Spring Boot backend and managed PostgreSQL database
- **Vercel:** React frontend
- **SendGrid:** Production email delivery

The frontend communicates with the deployed backend through its configured API base URL. Backend CORS settings must allow requests from the deployed frontend origin.

## 🔒 Security Considerations

- Keep secrets outside source control.
- Use strong JWT signing secrets.
- Hash user passwords rather than storing plaintext passwords.
- Validate incoming API requests.
- Restrict administrative operations by role.
- Configure CORS for trusted frontend origins.
- Use HTTPS for deployed services.
- Protect email provider API keys and database credentials.


## 👨‍💻 Author

**Mahewish Nallamandu**

GitHub: https://github.com/MahewishN

LinkedIn: https://www.linkedin.com/in/mahewish-nallamandu-7aa7b7294/
