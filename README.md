# NutriMind AI - Full Stack Application

This project is a personalized calorie and fitness tracker with an AI coach, built with React, Node.js, Express, and PostgreSQL.

## Project Structure

- **`/` (root):** Contains the React frontend application and configuration files.
- **`/backend`:** Contains the Node.js/Express backend server.

---

## Backend Setup (Node.js Server)

Follow these steps to get the backend server running.

### 1. Navigate to the Backend Directory

Open a new terminal in VS Code and change into the `backend` directory:

```bash
cd backend
```

### 2. Create an Environment File

Create a `.env` file inside the `/backend` directory. This file will store your secret keys and database connection string.

```
touch .env
```

Copy the following content into your new `.env` file and replace the placeholder values with your actual credentials.

```env
# Server Port
PORT=3001

# PostgreSQL Connection String
# Example: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/your_database_name"

# JWT Secret for signing tokens
JWT_SECRET="your_strong_jwt_secret_key"

# Google Gemini API Key
# Get yours from Google AI Studio
API_KEY="your_gemini_api_key"
```

### 3. Install Dependencies

Install the required npm packages for the server:

```bash
npm install
```

### 4. Run the Server

Start the backend server. It will use `nodemon` to automatically restart when you make changes.

```bash
npm run dev
```

You should see a message in the terminal confirming that the server is running: `Server is running on port 3001`.

---

## Frontend Setup (React App)

Follow these steps to get the React frontend running.

### 1. Open a New Terminal

Open a second terminal in VS Code. Make sure you are in the **root directory** of the project (not the `/backend` directory).

### 2. Install Dependencies

Install the required npm packages for the React application:

```bash
npm install
```

### 3. Run the Development Server

Start the Vite development server for the frontend:

```bash
npm run dev
```

Vite will start the server and provide you with a local URL, usually `http://localhost:3000`. Open this URL in your web browser to see the application.
