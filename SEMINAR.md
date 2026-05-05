# SEMINAR Q&A App - Operational Manual

This document provides the necessary links, configuration details, and operational context for the Q&A Seminar Web Application.

---

## 🚀 Cloud Infrastructure (Production)

These resources were provisioned on AWS in the `ap-southeast-1` region.

### **Service Endpoints**
*   **Main API (CloudFront):** [https://d11ffcb0dwbou3.cloudfront.net/](https://d11ffcb0dwbou3.cloudfront.net/)
*   **Main API (Legacy Lambda URL):** [https://oflwh4avfkubuk2xhak45x4p6u0ntqty.lambda-url.ap-southeast-1.on.aws/](https://oflwh4avfkubuk2xhak45x4p6u0ntqty.lambda-url.ap-southeast-1.on.aws/)
*   **Real-time API (AppSync):** [https://vjf7gmwzija7rnmcbso4hdl52e.appsync-api.ap-southeast-1.amazonaws.com/graphql](https://vjf7gmwzija7rnmcbso4hdl52e.appsync-api.ap-southeast-1.amazonaws.com/graphql)
*   **Database (RDS PostgreSQL):** `cnag-clouded-prod-db.cj02iicikub7.ap-southeast-1.rds.amazonaws.com:5432`

### **Authentication (Cognito)**
*   **User Pool ID:** `ap-southeast-1_XM8pJwCqY`
*   **Client ID:** `5v8qvpmhbkbdqp0l4frbghvncb`
*   **Admin Email:** `franky.parcon@globe.com.ph` (Check email for temporary password if a user was created).

---

## 💻 Frontend Configuration

To run the frontend and connect it to the cloud environment, create a `.env` file in the `frontend/` directory with the following content:

```env
VITE_API_URL=https://d11ffcb0dwbou3.cloudfront.net
VITE_APPSYNC_URL=https://vjf7gmwzija7rnmcbso4hdl52e.appsync-api.ap-southeast-1.amazonaws.com/graphql
VITE_COGNITO_USER_POOL_ID=ap-southeast-1_XM8pJwCqY
VITE_COGNITO_CLIENT_ID=5v8qvpmhbkbdqp0l4frbghvncb
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
