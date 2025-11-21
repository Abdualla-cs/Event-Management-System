````markdown
# YallaEvent – Event Management Web App

A modern, responsive event management platform built with **React**, **Tailwind CSS**, and **Context API**, offering admin tools, event creation, and a clean UI optimized for all devices.

---

## 🚀 Project Setup Guide

### **Step 1 — Clone the Repository**
```bash
git clone <your-repo-url>
cd <your-project-folder>
````

---

## **Step 2 — Install Dependencies**

### **React Core**

```bash
npm install react react-dom react-scripts
```

### **Tailwind CSS**

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### **Material UI + Icons**

```bash
npm install @mui/icons-material @mui/material @emotion/react @emotion/styled
```

### **Install all dependencies**

```bash
npm install
```

---

## ⚙️ Step 3 — Project Configuration

### **1. Tailwind CSS Setup**

#### `tailwind.config.js`

```javascript
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
```

#### `src/index.css`

```css
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
```

---

### **2. Recommended Folder Structure**

```
src/
├── components/
├── pages/
├── context/
├── data/
├── hooks/
└── images/
```

### **Image Assets**

Place images inside:

```
public/images/
```

Example:

```
public/images/logo.png
public/images/home.png
public/images/contact.png
public/images/about-bg.jpg
```

---

### **3. File Placement Overview**

| File Type  | Directory                      |
| ---------- | ------------------------------ |
| Components | `src/components/`              |
| Pages      | `src/pages/`                   |
| Context    | `src/context/Providers.js`     |
| Data Files | `src/data/initialEvents.js`    |
| Hooks      | `src/hooks/useLocalStorage.js` |

---

## ▶️ Step 4 — Run the Application

### **Start Server**

```bash
npm start
```

Runs at: **[http://localhost:3000](http://localhost:3000)**

### **Build for Production**

```bash
npm run build
```

### **Run Tests**

```bash
npm test
```

---

## 🔐 Demo Credentials

### **Admin**

* **Username:** admin
* **Password:** admin123

### **Normal User**

* Any username
* Password: **6+ characters**

---

## 📸 Screenshots

## Home Page
![Home Page](./UI_images/home/home.png)

## About Page
![About Page](./UI_images/about/about.png)

## Event Page
![Event Page](./UI_images/event/event.png)

## Contact Page
![Contact Page](./UI_images/contact/contact.png)

## Dashboard
![Dashboard 1](./UI_images/admin/dashborad1.png)
![Dashboard 2](./UI_images/admin/dashborad2.png)

## Mobile View
![Mobile View](./UI_images/mobile_responsive/mobile-view.png)

## Event Creation Form
![Event Creation 1](./UI_images/create_event/create-event1.png)
![Event Creation 2](./UI_images/create_event/create-event2.png)
![Event Creation 3](./UI_images/create_event/create-event3.png)

---

## 🛠️ Technology Stack

### **Frontend**

* React 18
* Create React App

### **Styling**

* Tailwind CSS
* Material UI Icons

### **State Management**

* React Context API
* LocalStorage
* Custom Hooks

### **Developer Tools**

* PostCSS
* Autoprefixer

---

## 📁 Complete Project Structure

```
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
```

---

## 🎨 Key Components

### **Event Management**

* EventCard — Display event details
* EventForm — Create & edit events
* EventDetails — Detailed view

### **UI Elements**

* Header — Mobile menu
* Footer — Social links + info
* Modal — Reusable popup
* ToastContainer — Notifications

### **Form Components**

* Input
* Select
* Button

### **Admin Tools**

* DashboardPage — Statistics
* ManageEventPage — CRUD operations
* StatCard — Metrics display

---

## 🧩 NPM Scripts

| Script          | Description              |
| --------------- | ------------------------ |
| `npm start`     | Run development server   |
| `npm test`      | Run tests                |
| `npm run build` | Build production files   |
| `npm run eject` | Eject CRA (irreversible) |

---

## 🌐 Deployment

### **Netlify Deployment**

1. Build project

   ```bash
   npm run build
   ```
2. Upload the **build/** folder to Netlify Dashboard

---

### **Vercel Deployment**

```bash
npm install -g vercel
vercel
```

---

## 🛠️ Troubleshooting Guide

### **Tailwind Not Working**

* Check `tailwind.config.js` paths
* Confirm `@tailwind` directives exist
* Restart the server

### **Images Not Showing**

* Place images inside `/public/images/`
* Use paths like:

  ```
  src="/images/logo.png"
  ```

### **MUI Icon Issues**

Install required packages:

```bash
npm install @mui/icons-material @mui/material @emotion/react @emotion/styled
```

### **LocalStorage Problems**

* Test in incognito mode
* Clear browser cache

### **Console Errors**

* Check missing imports
* Confirm correct file paths
* Ensure components export correctly

### **Admin Login Not Working**

* Use admin / admin123
* Check role assignment in context

---

## 📱 Responsive Design

Built using **mobile-first** principles:

### **Mobile**

* Single-column layout
* Touch-friendly 44px buttons
* Mobile nav menu

### **Tablet**

* Adaptive grid

### **Desktop**

* Multi-column layouts
* Optimized spacing

---

## 🤝 Contributing

```bash
git checkout -b feature/amazing-feature
git commit -m "Add amazing feature"
git push origin feature/amazing-feature
```

Then open a Pull Request.

---

## 📄 License

This project is under the **MIT License**.

---

## 👥 Team

**YallaEvent** — Built with ❤️ and Lebanese creativity.

---

## 📞 Support

📧 [support@yallaevent.com](mailto:support@yallaevent.com)
🏢 Beirut, Al Hamra, Verdun Street
Crystal Center – 5th Floor, Office 502