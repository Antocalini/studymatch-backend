# **StudyMatch Backend**

This repository contains the backend services for the StudyMatch application, built with Node.js and Express.js, and utilizing MongoDB for data storage. It handles user authentication, study group management, career and subject data, and integration with Telegram for group creation and invite links.

## **🚀 Features**

* **User Authentication:** Secure user registration and login via Telegram's OAuth widget.  
* **Profile Management:** Store and retrieve user profiles, including career, semester, and subjects of interest.  
* **Study Group Management:**  
  * Find existing study groups based on subject and career.  
  * Create new study groups.  
  * Join existing study groups.  
  * Retrieve a user's joined groups.  
* **Telegram Integration:** Programmatically create Telegram basic groups and generate invite links using tdl (TDLib wrapper).  
* **Career & Subject Data:** Manage and retrieve academic career and subject information.  
* **Statistics:** Provide counts for total users and groups.  
* **JWT Authentication:** Secure API endpoints using JSON Web Tokens.

## **🛠️ Technologies Used**

* **Node.js:** JavaScript runtime environment.  
* **Express.js:** Web application framework for Node.js.  
* **MongoDB:** NoSQL database for data storage.  
* **Mongoose:** ODM (Object Data Modeling) library for MongoDB and Node.js.  
* **tdl (TDLib Wrapper):** For interacting with the Telegram API as a user.  
* **dotenv:** For managing environment variables.  
* **bcryptjs:** For password hashing (if you have local user accounts, otherwise JWT is for token signing).  
* **jsonwebtoken:** For creating and verifying JWTs.

## **⚙️ Setup Instructions**

### **Prerequisites**

* **Node.js:** [Download & Install Node.js](https://nodejs.org/en/download/) (LTS version recommended).  
* **MongoDB:** [Install MongoDB](https://docs.mongodb.com/manual/installation/) (Community Edition is usually sufficient) or use a cloud service like MongoDB Atlas.

### **Installation**

1. **Clone the repository:**  
   git clone \<your-repo-url\>  
   cd studymatch-backend

2. **Install dependencies:**  
   npm install

### **Environment Variables (.env file)**

Create a .env file in the root of your backend directory and populate it with the following:

PORT=5000  
MONGO\_URI=mongodb://localhost:27017/studymatch\_db \# Or your MongoDB Atlas connection string  
JWT\_SECRET=your\_jwt\_secret\_key\_here \# Use a strong, random string  
TELEGRAM\_API\_ID=YOUR\_TELEGRAM\_APP\_API\_ID \# Get from my.telegram.org  
TELEGRAM\_API\_HASH=YOUR\_TELEGRAM\_APP\_API\_HASH \# Get from my.telegram.org  
TELEGRAM\_PHONE\_NUMBER=+YOUR\_COUNTRY\_CODE\_YOUR\_PHONE\_NUMBER \# e.g., \+584123456789 (for tdl user login)  
TELEGRAM\_PASSWORD=YOUR\_TELEGRAM\_2FA\_PASSWORD \# ONLY if you have 2-Step Verification enabled  
\# TELEGRAM\_BOT\_TOKEN=YOUR\_BOT\_TOKEN \# Only if you plan to use bot features in the future

* **TELEGRAM\_API\_ID & TELEGRAM\_API\_HASH**: Obtain these by logging into [my.telegram.org](https://my.telegram.org/) with the **user account** you intend to use for creating groups.  
* **TELEGRAM\_PHONE\_NUMBER**: The phone number associated with the Telegram user account (include \+ and country code).  
* **TELEGRAM\_PASSWORD**: Required only if you have 2-Step Verification enabled on your Telegram account.

### **Running the Server**

1. **Start the MongoDB server** (if running locally).  
2. **Run the Node.js server:**  
   npm start

   The server will start on the port specified in your .env file (default: 5000).

### **Telegram User Login (First Run)**

On the first run, the tdl client will attempt to log in as the specified user. You will likely see prompts in your backend console:

* \[tdl\] Sending phone number: ...  
* Please enter the Telegram login code you received:  
  * **Check your Telegram app** on your phone/desktop. You will receive a message from Telegram with a login code.  
  * **Enter this code into your backend console.**  
* If you have 2-Step Verification enabled, it will then prompt for your TELEGRAM\_PASSWORD.

Once successfully logged in, tdl will save the session data in the ./tdlib\_database\_tdl\_user\_session and ./tdlib\_files\_tdl\_user\_session directories. Subsequent runs should automatically load this session without requiring re-authentication, unless the session expires or is invalidated.

## **📂 Project Structure (Key Directories)**

* src/config/: Database connection and other configurations.  
* src/controllers/: Contains the logic for handling API requests (e.g., users.controller.js, groups.controller.js, career.controller.js).  
* src/models/: Defines Mongoose schemas for your data (e.g., User.js, Group.js, Career.js).  
* src/routes/: Defines API endpoints and maps them to controller functions (e.g., user.routes.js, group.routes.js, career.routes.js).  
* src/services/: Contains external service integrations, like telegram.js.  
* src/middleware/: Custom middleware (e.g., authMiddleware.js for JWT protection).

## **💡 API Endpoints (Overview)**

* /api/auth/login: Authenticate user via Telegram data.  
* /api/users/profile: Get/Update user profile.  
* /api/users/count: Get total user count.  
* /api/groups/find-or-create: Find existing groups or create a new one.  
* /api/groups/join/:groupId: Join a specific group.  
* /api/groups/my-groups: Get groups the current user is a member of.  
* /api/groups/count: Get total group count.  
* /api/careers/:id: Get career details by ID.  
* /api/subjects/career/:careerId: Get subjects for a specific career.

## **🐛 Error Handling**

The backend includes basic try-catch blocks in controllers to handle errors and send appropriate HTTP responses. More robust logging and error monitoring can be added for production environments.