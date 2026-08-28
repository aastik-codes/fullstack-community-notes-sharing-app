# Notes App

A full-stack notes-sharing application featuring a custom-built Express backend and an AI-generated frontend UI. Users can upload PDF notes, manage access controls (private, public, shared), comment on notes, submit 1–5 star ratings, and handle password resets via email.

---

## Tech Stack

- **Backend:** Node.js, Express.js (Custom-coded)
- **Database:** MongoDB, Mongoose
- **Authentication:** JWT, bcrypt
- **File Storage:** Cloudinary, Multer
- **Email Services:** Nodemailer
- **Frontend:** AI-generated client-side interface

---

## Architecture & Codebase Notes

> ⚠️ **Project Attribution Note:**  
> The **backend API logic, database schemas, access control flow, rating computations, and file handlers were entirely hand-coded**. The frontend user interface in this repository was bootstrapped/generated using AI tools to quickly test and interact with the backend API.

### Technical Highlights (Backend Implementation)

- **JWT Authentication & Passwords:** Hashed with `bcrypt`. Protected API endpoints use `authMiddleware` to decode the Bearer token and attach `req.user`.
- **Granular Access Control:** Notes feature three visibility levels (`private`, `public`, `shared`). The `canAccessNote` middleware validates ownership or access permissions before execution, attaching the resolved document directly to `req.note`.
- **Cloudinary PDF Storage:** Uploads are handled via Multer with `multer-storage-cloudinary`, restricted specifically to PDF files under a **20 MB limit**.
- **Dynamic Rating Recalculation:** Ratings feature a compound unique index (`user` + `note`) preventing duplicate entries. When a rating is added or updated, the system automatically recalculates both the individual note's average rating and the overall average rating of the note creator's profile.
- **Password Reset Flow:** Uses Nodemailer to deliver time-sensitive password reset tokens stored with explicit expiry timestamps.

---

## Repository Structure

```text
.
├── config/        # Cloudinary, MongoDB, and Multer configurations
├── controllers/   # Auth, Notes, Access, Comments, Ratings & User logic
├── middleware/    # Auth middleware & Note access permissions
├── model/         # User, Note, Comment & Rating Mongoose schemas
├── routes/        # Express route handlers
├── server.js      # Express application entry point
└── client/        # AI-generated frontend UI components & assets
```

---

## API Reference

All backend endpoints are prefixed by the base API server URL.

### Authentication
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/signup` | Register a new user |
| `POST` | `/login` | Authenticate & return JWT token |
| `POST` | `/resetpass` | Request password reset token via email |
| `POST` | `/updatepass` | Reset password using valid token |

### User Profile & Stats *(Auth Required)*
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/user/profile` | Retrieve profile info |
| `POST` | `/user/profile/update` | Update username or email |
| `GET` | `/user/dashboard` | Get user statistics (uploaded count, avg rating) |
| `GET` | `/user/find-by-email` | Search registered user by email |

### Notes Management *(Auth Required)*
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/user/upload` | Upload PDF note to Cloudinary (max 20 MB) |
| `GET` | `/user/notes/getnotesall` | Retrieve user's uploaded active notes |
| `GET` | `/user/notes/received` | Retrieve notes shared with user |
| `GET` | `/user/notes/search` | Search, sort, and paginate public notes |
| `GET` | `/user/notes/:id` | Fetch note details by ID (Permission checked) |
| `DELETE`| `/user/notes/:id` | Soft-delete owned note |

### Access Control & Sharing *(Auth Required)*
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/user/notes/access/add` | Grant access to another user by email |
| `POST` | `/user/notes/access/remove` | Revoke note access |
| `POST` | `/user/notes/visibility` | Update note status (`private`, `public`, `shared`) |

### Comments & Ratings *(Auth Required)*
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/user/comments/add` | Comment on accessible note |
| `POST` | `/user/comments/get` | Fetch comments for a note |
| `DELETE`| `/user/comments/delete` | Delete owned comment |
| `POST` | `/user/notes/rate` | Add or update 1–5 star rating |

### Health Check
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Server health check endpoint |

---

## Environment Configuration

Create a `.env` file in the root directory:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

CLOUD_NAME=your_cloudinary_cloud_name
API_KEY=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret

EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_app_password
```

---

## Local Setup & Development

1. **Clone repository:**
   ```bash
   git clone <repository-url>
   cd <project-folder>
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**  
   Copy your environment variables into `.env`.

4. **Start the application:**
   ```bash
   node server.js
   ```
