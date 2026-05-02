# SEMINAR Q&A App - Operational Manual

This document provides the necessary links, configuration details, and operational context for the Q&A Seminar Web Application.

---

## 🚀 Cloud Infrastructure (Production)

These resources were provisioned on AWS in the `ap-southeast-1` region.

### **Service Endpoints**
*   **Main API (Lambda URL):** [https://htmru5bvtpowddxiyihz4aqwva0bbxik.lambda-url.ap-southeast-1.on.aws/](https://htmru5bvtpowddxiyihz4aqwva0bbxik.lambda-url.ap-southeast-1.on.aws/)
*   **Real-time API (AppSync):** [https://an7wt4l3yvfr3fq2ndl3yekw74.appsync-api.ap-southeast-1.amazonaws.com/graphql](https://an7wt4l3yvfr3fq2ndl3yekw74.appsync-api.ap-southeast-1.amazonaws.com/graphql)
*   **Database (RDS PostgreSQL):** `seminar-qa-prod-db.cj02iicikub7.ap-southeast-1.rds.amazonaws.com:5432`

### **Authentication (Cognito)**
*   **User Pool ID:** `ap-southeast-1_bRSe3TUQH`
*   **Client ID:** `ftol86fbijam4e0p7as8n4ptp`
*   **Admin Email:** `franky.parcon@globe.com.ph` (Check email for temporary password if a user was created).

---

## 💻 Frontend Configuration

To run the frontend and connect it to the cloud environment, create a `.env` file in the `frontend/` directory with the following content:

```env
VITE_API_URL=https://htmru5bvtpowddxiyihz4aqwva0bbxik.lambda-url.ap-southeast-1.on.aws
VITE_APPSYNC_URL=https://an7wt4l3yvfr3fq2ndl3yekw74.appsync-api.ap-southeast-1.amazonaws.com/graphql
VITE_COGNITO_USER_POOL_ID=ap-southeast-1_bRSe3TUQH
VITE_COGNITO_CLIENT_ID=ftol86fbijam4e0p7as8n4ptp
```

### **Running Locally**
1.  `cd frontend`
2.  `npm install`
3.  `npm run dev`
4.  Open [http://localhost:5173](http://localhost:5173)

---

## 🛠 System Architecture & Flow

The application is built on a "Stateless Backend" architecture using AWS Lambda and offloads real-time state to AWS AppSync.

### **The Life of a Question**
1.  **Submission:** Guest submits a question via the React frontend.
2.  **AI Moderation:** The Backend calls **Claude 3.5 Sonnet** (via Bedrock) to check for profanity, quality, and semantic duplicates.
3.  **Storage:** The question is stored in the **RDS PostgreSQL** database.
4.  **Real-time Broadcast:** The Backend sends a mutation to **AppSync**, which pushes the update to all connected browsers (Guests and Admins) via WebSockets.

---

## 🔐 Admin Operations

### **Moderation Dashboard**
Access the admin panel at `/admin`. 
*   **Production:** Log in using your Cognito credentials.
*   **Actions:** You can **Approve**, **Hide**, or **Delete** questions. Approving a question makes it visible to all guests in the "Live Questions" section.

---

## 📂 Repository Structure

*   `/backend`: Node.js Express application (Dual runtime: Local/Lambda).
*   `/frontend`: React application using Vite and Tailwind CSS.
*   `/infra`: Terraform configurations and modules for AWS resource management.
*   `/infra/schema.sql`: The database schema for the PostgreSQL instance.

---

## ⚠️ Maintenance Notes
*   **Logs:** View backend logs in **AWS CloudWatch** under the log group `/aws/lambda/seminar-qa-prod-api`.
*   **Scaling:** The Lambda and AppSync services scale automatically. The RDS instance is a `db.t3.micro` and may need scaling for very large audiences (>1000 concurrent users).
