System Requirements
Minimum Requirements
Operating System: Windows 10/11, macOS 10.15+, or Ubuntu 18.04+
RAM: 4GB minimum, 8GB recommended
Storage: 2GB free disk space
Network: Internet connection for API calls
Recommended Requirements
RAM: 8GB or more
Storage: 5GB free disk space
Processor: Modern multi-core processor
Prerequisites
Required Software
Node.js (version 18.0.0 or higher)
bash
# Check if installed
node --version
# Install from https://nodejs.org/ or using package manager
# Windows: Download installer from nodejs.org
# macOS: brew install node
# Ubuntu: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
#          sudo apt-get install -y nodejs
PostgreSQL (version 12 or higher)
bash
# Check if installed
psql --version
# Windows: Download from https://www.postgresql.org/download/windows/
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql postgresql-contrib
# Start PostgreSQL service
# Windows: Services > PostgreSQL > Start
# macOS: brew services start postgresql
# Ubuntu: sudo systemctl start postgresql
Git (for cloning the repository)
bash
# Check if installed
git --version
# Install from https://git-scm.com/ or using package manager
# Windows: Download installer from git-scm.com
# macOS: brew install git
# Ubuntu: sudo apt-get install git
Optional Software
PostgreSQL GUI Tool (pgAdmin, DBeaver, or similar) - for database management
VS Code or any code editor - for development
Postman or similar API testing tool - for testing backend endpoints
Installation Steps
1. Clone the Repository
bash
git clone https://github.com/your-username/nutrimind-ai.git
cd nutrimind-ai
2. Install Frontend Dependencies
bash
# Navigate to root directory (if not already there)
cd nutrimind-ai
# Install frontend dependencies
npm install
3. Install Backend Dependencies
bash
# Navigate to backend directory
cd backend
# Install backend dependencies
npm install
# Return to root directory
cd ..
4. Verify Installation
bash
# Check frontend installation
npm list --depth=0
# Check backend installation
cd backend
npm list --depth=0
cd ..
Environment Configuration
1. Backend Environment Setup
Create a .env file in the backend directory:

bash
# Navigate to backend directory
cd backend
# Create .env file
touch .env
Add the following configuration to backend/.env:

env
# Database Configuration
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/nutrimind
JWT_SECRET=your_jwt_secret_key_here_at_least_32_characters_long
PORT=5000
CLIENT_URL=http://localhost:3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
COOKIE_SECURE=false
SESSION_SAMESITE=lax
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=NutriMind <noreply@nutrimind.ai>
# API Keys (Required - see API Keys Setup section)
GEMINI_API_KEY=your_gemini_api_key_here
FATSECRET_CLIENT_ID=your_fatsecret_client_id
FATSECRET_CLIENT_SECRET=your_fatsecret_client_secret
USDA_API_KEY=your_usda_api_key
SPOONACULAR_API_KEY=your_spoonacular_api_key
WEATHER_API_KEY=your_weather_api_key
2. Frontend Environment Setup (Optional)
Create a .env.local file in the root directory:

bash
# Create .env.local file in root directory
touch .env.local
Add any frontend-specific environment variables:

env
VITE_API_URL=http://localhost:5000
VITE_WS_URL=http://localhost:5000
Database Setup
1. Create PostgreSQL Database
bash
# Connect to PostgreSQL
psql -U postgres
# Create database
CREATE DATABASE nutrimind;
# Create user (optional, if not using default postgres user)
CREATE USER nutrimind_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE nutrimind TO nutrimind_user;
# Exit PostgreSQL
\q
2. Run Database Schema
bash
# Navigate to backend directory
cd backend
# Run the schema file
psql -U postgres -d nutrimind -f schema.sql
# Alternative: If using different user
psql -U nutrimind_user -d nutrimind -f schema.sql
3. Verify Database Setup
bash
# Connect to database
psql -U postgres -d nutrimind
# List tables
\dt
# Exit PostgreSQL
\q
4. Seed Database (Optional)
bash
# Navigate to backend directory
cd backend
# Run seed script (if available)
npm run seed-db
API Keys Setup
Required API Keys
Google Gemini AI API (Required for AI features)
Visit: https://makersuite.google.com/app/apikey
Create new API key
Copy key to GEMINI_API_KEY in .env
FatSecret API (Required for food database)
Visit: https://platform.fatsecret.com/register
Register for developer account
Create application to get Client ID and Secret
Copy credentials to FATSECRET_CLIENT_ID and FATSECRET_CLIENT_SECRET
USDA FoodData Central API (Required for nutrition data)
Visit: https://fdc.nal.usda.gov/api-key-signup.html
Request API key (free)
Copy key to USDA_API_KEY
Spoonacular API (Optional - 150 free calls/day)
Visit: https://spoonacular.com/food-api/console#Dashboard
Sign up for free plan
Copy API key to SPOONACULAR_API_KEY
OpenWeatherMap API (Optional - for weather-based suggestions)
Visit: https://openweathermap.org/api
Sign up for free plan
Copy API key to WEATHER_API_KEY
Free API Options
Open Food Facts: No API key required (100% free)
USDA API: Free with registration
Weather API: Optional for enhanced features
Running the Application
1. Start Backend Server
bash
# Navigate to backend directory
cd backend
# Start development server
npm run dev
# For production
npm start
The backend should start on http://localhost:5000

2. Start Frontend Development Server
Open a new terminal window:

bash
# Navigate to root directory
cd nutrimind-ai
# Start frontend development server
npm run dev
The frontend should start on http://localhost:3000

3. Start Signaling Server (Optional - for video calls)
Open another terminal window:

bash
# Navigate to root directory
cd nutrimind-ai
# Start signaling server
npm run signaling
4. Access the Application
Frontend: http://localhost:3000
Backend API: http://localhost:5000
API Documentation: http://localhost:5000/api (if available)
5. Test the Setup
Open http://localhost:3000 in your browser
Register a new account
Log in and explore the features
Test food logging and AI recommendations
Troubleshooting
Common Issues and Solutions
1. Port Already in Use
bash
# Find process using port 3000 or 5000
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :5000
# macOS/Linux
lsof -i :3000
lsof -i :5000
# Kill process
# Windows (replace PID with actual process ID)
taskkill /PID <PID> /F
# macOS/Linux
kill -9 <PID>
2. Database Connection Failed
bash
# Check PostgreSQL status
# Windows: Services > PostgreSQL
# macOS: brew services list
# Ubuntu: sudo systemctl status postgresql
# Restart PostgreSQL
# Windows: Services > PostgreSQL > Restart
# macOS: brew services restart postgresql
# Ubuntu: sudo systemctl restart postgresql
# Test connection
psql -U postgres -h localhost -p 5432 -d nutrimind
3. Node.js Version Issues
bash
# Check Node.js version
node --version
# Update Node.js using nvm (recommended)
# Install nvm first
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
# Install and use Node.js 18
nvm install 18
nvm use 18
4. Permission Issues
bash
# Fix npm permissions
# macOS/Linux
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
# Windows: Run as administrator
5. API Key Issues
bash
# Verify API keys are working
# Test Gemini API
curl -H "Content-Type: application/json" \
     -d '{"contents":[{"parts":[{"text":"Hello"}]}]}' \
     -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_GEMINI_API_KEY"
# Test USDA API
curl "https://api.nal.usda.gov/fdc/v1/foods/search?query=apple&api_key=YOUR_USDA_API_KEY"
6. Frontend Build Issues
bash
# Clear npm cache
npm cache clean --force
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
# Clear Vite cache
rm -rf .vite dist
7. Backend Dependencies Issues
bash
# Navigate to backend directory
cd backend
# Clear npm cache
npm cache clean --force
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
Environment-Specific Issues
Windows
Use PowerShell or Command Prompt as administrator
Ensure Windows Firewall allows Node.js connections
Install Visual Studio Build Tools if compilation errors occur
macOS
Install Xcode Command Line Tools: xcode-select --install
Use Homebrew for package management
Ensure Rosetta 2 is installed for M1/M2 Macs
Linux
Install build essentials: sudo apt-get install build-essential
Ensure proper permissions for npm global packages
Configure firewall to allow localhost connections
Getting Help
Check Logs: Look at terminal output for error messages
Verify Configuration: Ensure all environment variables are set correctly
Test Individual Components: Test database connection, API keys, and services separately
Community Support: Check GitHub issues or community forums
Documentation: Refer to the main README.md file for additional information
Performance Tips
Use SSD Storage: Faster database operations
Allocate Sufficient RAM: Prevents memory-related issues
Close Unnecessary Applications: Frees up system resources
Use Latest Node.js: Better performance and security
Regular Updates: Keep dependencies up to date
Development Tips
Useful Commands
bash
# Install new dependency
npm install package-name
# Install development dependency
npm install --save-dev package-name
# Update dependencies
npm update
# Run tests (if available)
npm test
# Build for production
npm run build
# Preview production build
npm run preview
Code Quality
bash
# Lint code (if ESLint is configured)
npm run lint
# Format code (if Prettier is configured)
npm run format
# Type check (TypeScript)
npx tsc --noEmit
Database Management
bash
# Backup database
pg_dump -U postgres nutrimind > backup.sql
# Restore database
psql -U postgres nutrimind < backup.sql
# Reset database
dropdb -U postgres nutrimind
createdb -U postgres nutrimind
psql -U postgres nutrimind -f schema.sql
Production Deployment
For production deployment, consider:

Environment Variables: Use production-ready values
Database: Use managed PostgreSQL service
Security: Enable HTTPS, secure cookies, and proper CORS
Performance: Enable caching, compression, and CDN
Monitoring: Set up logging and error tracking
Scaling: Consider load balancing and microservices
Support
If you encounter any issues not covered in this guide:

Review the GitHub issues page
Search for similar problems online
Contact the development team
Happy Coding!