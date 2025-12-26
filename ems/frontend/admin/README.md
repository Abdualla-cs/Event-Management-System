# YallaEvent – Event Management Web App

A modern, responsive event management platform built with **React**, **Tailwind CSS**, and **Context API**, offering admin tools, event creation, and a clean UI optimized for all devices.

---

## 🚀 Project Setup Guide

### **Step 1 — Clone the Repository**
```bash
git clone https://github.com/abdualla-cs/Event-Management-System.git
cd ems
Step 2 — Install Dependencies
React Core
bash
npm install react react-dom react-scripts
Tailwind CSS
bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
Material UI + Icons
bash
npm install @mui/icons-material @mui/material @emotion/react @emotion/styled
GitHub Pages Deployment
bash
npm install --save-dev gh-pages
Install all dependencies
bash
npm install
⚙️ Step 3 — Project Configuration
1. Tailwind CSS Setup
tailwind.config.js
javascript
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FC350B',
      },
    },
  },
  plugins: [],
};
src/index.css
css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
}

html { font-size: 16px; }

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
  'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  button, input, select, textarea {
    min-height: 44px;
    font-size: 16px;
  }

  body {
    text-size-adjust: 100%;
    -webkit-text-size-adjust: 100%;
    -ms-text-size-adjust: 100%;
  }
}
2. GitHub Pages Deployment Setup
Update your package.json with these configurations:

json
{
  "name": "firstapp",
  "version": "0.1.0",
  "private": true,
  "homepage": "https://abdualla-cs.github.io/Event-Management-System",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  },
  "devDependencies": {
    "gh-pages": "^6.3.0",
    "tailwindcss": "^3.4.18"
  }
}
Important: Replace abdualla-cs with your actual GitHub username in the homepage field.

3. Recommended Folder Structure
text
src/
├── components/
├── pages/
├── context/
├── data/
├── hooks/
└── images/
Image Assets
Place images inside:

text
public/images/
Example:

text
public/images/logo.png
public/images/home.png
public/images/contact.png
public/images/about-bg.jpg
4. File Placement Overview
File Type	Directory
Components	src/components/
Pages	src/pages/
Context	src/context/Providers.js
Data Files	src/data/initialEvents.js
Hooks	src/hooks/useLocalStorage.js
▶️ Step 4 — Run the Application
Start Server
bash
npm start
Runs at: http://localhost:3000

Build for Production
bash
npm run build
Deploy to GitHub Pages
bash
npm run deploy
Run Tests
bash
npm test
🌐 Deployment Guide
GitHub Pages Deployment
Step 1: Install gh-pages
bash
npm install --save-dev gh-pages
Step 2: Update package.json
Add the homepage field and deploy scripts as shown in Step 3.

Step 3: Deploy the application
bash
npm run deploy
Step 4: Configure GitHub Pages
Go to your GitHub repository → Settings → Pages

Under Source, select gh-pages branch

Click Save

Your live site will be available at:
https://abdualla-cs.github.io/Event-Management-System

Netlify Deployment
Build project

bash
npm run build
Upload the build/ folder to Netlify Dashboard

Vercel Deployment
bash
npm install -g vercel
vercel
🔐 Demo Credentials
Admin
Username: admin

Password: admin123

Normal User
Any username

Password: 6+ characters

📸 Screenshots
Home Page
https://./UI_images/home/home.png

About Page
https://./UI_images/about/about.png

Event Page
https://./UI_images/event/event.png

Contact Page
https://./UI_images/contact/contact.png

Dashboard
https://./UI_images/admin/dashborad1.png
https://./UI_images/admin/dashborad2.png

Mobile View
https://./UI_images/mobile_responsive/mobile-view.png

Event Creation Form
https://./UI_images/create_event/create-event1.png
https://./UI_images/create_event/create-event2.png
https://./UI_images/create_event/create-event3.png

🛠️ Technology Stack
Frontend
React 18

Create React App

Styling
Tailwind CSS

Material UI Icons

State Management
React Context API

LocalStorage

Custom Hooks

Developer Tools
PostCSS

Autoprefixer

📁 Complete Project Structure
text
yalla-event-app/
├── public/
│   ├── images/
│   │   ├── logo.png
│   │   ├── home.png
│   │   ├── contact.png
│   │   └── about-bg.jpg
│   ├── index.html
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── Button.js
│   │   ├── ContactForm.js
│   │   ├── EventCard.js
│   │   ├── EventForm.js
│   │   ├── Footer.js
│   │   ├── Header.js
│   │   ├── Input.js
│   │   ├── LoadingSpinner.js
│   │   ├── LoginModal.js
│   │   ├── Modal.js
│   │   ├── Select.js
│   │   ├── SkeletonCard.js
│   │   ├── StatCard.js
│   │   └── ToastContainer.js
│   ├── pages/
│   │   ├── About.js
│   │   ├── Contact.js
│   │   ├── DashboardPage.js
│   │   ├── EditEventPage.js
│   │   ├── EventDetails.js
│   │   ├── Events.js
│   │   ├── Home.js
│   │   ├── ManageEventPage.js
│   │   └── RegisterPage.js
│   ├── context/
│   │   └── Providers.js
│   ├── data/
│   │   └── initialEvents.js
│   ├── hooks/
│   │   └── useLocalStorage.js
│   ├── App.js
│   ├── index.js
│   └── index.css
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── README.md
🎨 Key Components
Event Management
EventCard — Display event details

EventForm — Create & edit events

EventDetails — Detailed view

UI Elements
Header — Mobile menu

Footer — Social links + info

Modal — Reusable popup

ToastContainer — Notifications

Form Components
Input

Select

Button

Admin Tools
DashboardPage — Statistics

ManageEventPage — CRUD operations

StatCard — Metrics display

🧩 NPM Scripts
Script	Description
npm start	Run development server
npm test	Run tests
npm run build	Build production files
npm run deploy	Deploy to GitHub Pages
npm run eject	Eject CRA (irreversible)
🛠️ Troubleshooting Guide
GitHub Pages 404 Error
Ensure homepage in package.json matches your GitHub username exactly

Wait 5-10 minutes after deployment for changes to propagate

Clear browser cache and hard refresh (Ctrl+F5)

Verify GitHub Pages is set to use gh-pages branch

Deployment Script Errors
Make sure gh-pages is installed: npm install --save-dev gh-pages

Verify deploy scripts are added to package.json

Check that homepage field is correctly formatted

Tailwind Not Working
Check tailwind.config.js paths

Confirm @tailwind directives exist in index.css

Restart the development server

Images Not Showing
Place images inside /public/images/

Use correct paths in components: src="/images/logo.png"

MUI Icon Issues
Install required packages:

bash
npm install @mui/icons-material @mui/material @emotion/react @emotion/styled
LocalStorage Problems
Test in incognito/private mode

Clear browser cache and site data

Console Errors
Check for missing imports in components

Confirm correct file paths and exports

Verify all component files exist

Admin Login Not Working
Use credentials: admin / admin123

Check user role assignment in AuthContext

📱 Responsive Design
Built using mobile-first principles:

Mobile
Single-column layout

Touch-friendly 44px buttons

Hamburger navigation menu

Optimized typography and spacing

Tablet
Adaptive grid systems

Responsive breakpoints

Desktop
Multi-column layouts

Optimal spacing and readability

Enhanced navigation experience

🤝 Contributing
We welcome contributions! Please follow these steps:

Fork the repository

Create a feature branch:

bash
git checkout -b feature/amazing-feature
Commit your changes:

bash
git commit -m "Add amazing feature"
Push to the branch:

bash
git push origin feature/amazing-feature
Open a Pull Request

📄 License
This project is licensed under the MIT License.

👥 Team
YallaEvent — Built with ❤️ and Lebanese creativity.

📞 Support
📧 Email: support@yallaevent.com

🏢 Address: Beirut, Al Hamra, Verdun Street
Crystal Center – 5th Floor, Office 502