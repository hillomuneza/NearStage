# RIAPMS Deployment Guide for Firebase

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Firebase CLI** - Install with: `npm install -g firebase-tools`
3. **MongoDB Atlas** account (or local MongoDB)

## Step 1: Setup MongoDB

### Option A: MongoDB Atlas (Recommended for Production)
1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster (free tier)
3. Create a database user with username/password
4. Get the connection string
5. Update the `MONGODB_URI` in `.env` file

### Option B: Local MongoDB
1. Install MongoDB Community Server
2. Start MongoDB service
3. Use: `MONGODB_URI=mongodb://localhost:27017/riapms`

## Step 2: Configure Environment

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your MongoDB URI:
```
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/riapms
JWT_SECRET=your_secure_random_string
```

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Run Locally (Development)

```bash
npm run dev
```

The app will be available at http://localhost:3000

## Step 5: Firebase Deployment

### Option A: Deploy Frontend Only (Static Hosting)
Since Firebase Hosting serves static files, you'll need to deploy the backend separately.

1. Login to Firebase:
```bash
firebase login
```

2. Initialize Firebase:
```bash
firebase init hosting
```

3. Select your project or create a new one

4. Set the public directory to `frontend`

5. Configure as a single-page app: Yes

6. Deploy:
```bash
firebase deploy --only hosting
```

### Option B: Deploy Full App (Backend + Frontend)

Since Firebase Functions has a free tier, you can deploy the backend there:

1. **Update firebase.json** with proper Cloud Functions configuration

2. **Deploy Cloud Functions:**
```bash
firebase deploy --only functions
```

3. **Deploy Hosting:**
```bash
firebase deploy --only hosting
```

## Step 6: Alternative - Deploy Backend to Render

Since Firebase Functions has limitations, deploy backend to Render:

1. Push code to GitHub

2. Create a new Web Service on Render:
   - Connect to your GitHub repo
   - Build command: `npm install`
   - Start command: `node server.js`

3. Add environment variables in Render dashboard

4. Update frontend API URL to point to your Render backend

## Project Structure

```
RIAPMS/
├── backend/
│   ├── models/         # MongoDB models
│   ├── routes/         # API routes
│   ├── middleware/     # Auth middleware
│   └── server.js       # Express server
├── frontend/
│   ├── css/           # Stylesheets
│   ├── js/            # JavaScript
│   ├── assets/        # Images, icons
│   ├── index.html     # Home page
│   ├── login.html     # Login page
│   ├── student/       # Student dashboard
│   ├── company/       # Company dashboard
│   ├── admin/         # Admin dashboard
│   └── manifest.json  # PWA manifest
├── package.json
├── server.js          # Main server entry
└── firebase.json      # Firebase config
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/riapms |
| JWT_SECRET | JWT signing secret | random_string |
| NODE_ENV | Environment | development/production |

## Default Admin Account

After first run, a default admin account is created:
- Email: admin@riapms.rw
- Password: admin123

**Change this password immediately in production!**

## API Endpoints

### Authentication
- `POST /api/auth/student/register` - Register student
- `POST /api/auth/student/login` - Student login
- `POST /api/auth/company/register` - Register company
- `POST /api/auth/company/login` - Company login
- `POST /api/auth/admin/login` - Admin login

### Internships
- `GET /api/internships/student/matched` - Get matched internships
- `GET /api/internships/student/internships` - Get all internships
- `POST /api/internships/student/apply/:id` - Apply for internship
- `GET /api/internships/student/applications` - Get my applications
- `GET /api/internships/company/internships` - Get company internships
- `POST /api/internships/company/internship` - Post new internship
- `GET /api/internships/company/internship/:id/applicants` - Get applicants
- `PUT /api/internships/company/application/:i/:s` - Update status

### Admin
- `GET /api/admin/statistics` - System stats
- `GET /api/admin/companies` - All companies
- `PUT /api/admin/company/:id/approve` - Approve company
- `PUT /api/admin/company/:id/reject` - Reject company
- `GET /api/admin/students` - All students
- `GET /api/admin/internships` - All internships

## Smart Matching Algorithm

The matching score (0-100%) is calculated based on:

1. **Field Match (40 points)**
   - Same field: 40 points
   - Related field: 20 points

2. **Location Match (30 points)**
   - Same district: 30 points
   - Same province: 15 points

3. **Skills Match (30 points)**
   - Percentage of required skills student has × 30

## Support

For issues or questions:
- Email: info@riapms.rw
- GitHub Issues: [Create an issue]
