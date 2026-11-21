# Oryn — Full-Stack MVC & REST API Project
## Simplified Academic Defense & Presentation Guide

> **Interactive Presentation**: Open [`presentation.html`](./presentation.html) in your browser (`open presentation.html`).  
> **Controls**: `Arrow Keys` or `Space` to move between slides, `T` for Theme, `O` for Slide Overview, `F` for Fullscreen.

---

## What This Project Demonstrates (Assignment Rubric)

This project was built to clearly demonstrate mastery of:
1. **Express Routing**: Clean endpoint paths (`/api/emails`, `/api/mailboxes`, etc.) using HTTP verbs (`GET`, `POST`, `PATCH`, `DELETE`).
2. **MVC Architecture**:
   - **Routes (`src/routes/`)**: Pure route mapping (URL $\to$ Controller method).
   - **Controllers (`src/controllers/`)**: Request validation, status code assignment (`200`, `201`, `400`, `500`), and response serialization.
   - **Models (`src/models/`)**: Data structure definitions and database/storage queries.
3. **Dedicated Helpers (`src/helpers/`)**:
   - Anything outside standard MVC CRUD (like SMTP background listening, DNS queries, or file operations) is placed into `helpers/` so the teacher can see a clean, uncluttered MVC structure.
4. **Frontend API Calling**:
   - A React 19 single-page application using asynchronous `fetch()` and `async/await` to consume backend REST endpoints and dynamically update the DOM.

---

## 6-Slide Defense Script & Speaker Notes

### Slide 1: Title & Project Scope
* **Slide Title**: Oryn Web Mail System
* **Subtitle**: Full-Stack MVC & REST API Project
* **Speaker Script**:  
  > "Good morning, teacher. Today we are presenting **Oryn**, a full-stack web mail application built with Node.js, Express, and React. The core objective of our project is to demonstrate **MVC Architecture**, clean **RESTful API routing**, and dynamic **frontend-to-backend API communication**."

---

### Slide 2: Strict MVC Pattern & Helpers Separation
* **Slide Title**: Strict MVC Pattern & Helpers Separation
* **Key Concept**:
  - **Routes (`src/routes/`)**: Map incoming HTTP requests to controller methods.
  - **Controllers (`src/controllers/`)**: Extract request data (`req.body`, `req.params`), validate inputs, call models, and send `res.status().json()`.
  - **Models (`src/models/`)**: Handle the data layer (reading and saving emails, mailboxes, and domains).
  - **Helpers (`src/helpers/`)**: Specialized utility code (SMTP background daemon, DNS lookup, file storage) is isolated in `helpers/` so that controllers remain lightweight and strictly adhere to MVC.
* **Speaker Script**:  
  > "For our backend architecture, we implemented the Model-View-Controller design pattern. The React UI acts as the View, which communicates through Express Routes. Routes pass control to Controllers for validation and business logic, which then query the Model layer. Notice that we created a separate `helpers/` directory for background services like SMTP and DNS—this ensures our controllers only handle HTTP requests and stay textbook clean."

---

### Slide 3: RESTful Routes & HTTP Methods
* **Slide Title**: RESTful Routes & HTTP Methods
* **Core Endpoints**:
  - `GET /api/emails` $\to$ Fetch emails list
  - `POST /api/emails/send` $\to$ Validate and compose new email
  - `PATCH /api/emails/:id` $\to$ Update status (mark read, star, archive)
  - `DELETE /api/emails/:id` $\to$ Delete an email
  - `GET /api/mailboxes` $\to$ Fetch all mailboxes
  - `POST /api/mailboxes` $\to$ Create new mailbox
* **Speaker Script**:  
  > "Our Express routing is completely RESTful. In `email.routes.js`, we use standard HTTP methods: `GET` for retrieving emails, `POST` for creating and sending emails, `PATCH` for partial updates like marking an email as read, and `DELETE` for removing an email. Each route delegates directly to its controller method without mixing inline business logic in the route file."

---

### Slide 4: Controller & Model Deep Dive
* **Slide Title**: Handling Requests & Managing Data
* **Code Walkthrough**:
  - Show `EmailController.sendEmail`:
    1. Reads `req.body` (`from`, `to`, `subject`, `text`).
    2. Validates missing fields and returns `400 Bad Request` if invalid.
    3. Calls `EmailModel.create(...)` to save the record.
    4. Returns `201 Created` with the JSON payload.
  - Show `EmailModel`:
    - Encapsulates database read and insert methods (`findAll`, `create`, `update`).
* **Speaker Script**:  
  > "Here you can see the controller and model interaction. In `email.controller.js`, the `sendEmail` method first checks if required fields are present. If anything is missing, it immediately stops and sends a 400 Bad Request error. Once validated, it calls `EmailModel.create()` to persist the email and returns a 201 Created status. This keeps the controller predictable and testable."

---

### Slide 5: Frontend API Calling (React 19)
* **Slide Title**: Frontend API Calling (React 19)
* **How React Connects to Backend**:
  - Uses native `fetch()` with `async/await` inside `useEffect` or button click handlers.
  - Asynchronous data fetching updates React state (`useState`).
  - Seamless re-renders: when an email is sent or deleted, state updates instantly without reloading the browser page.
* **Speaker Script**:  
  > "On the client side, our React frontend communicates with our Express server via asynchronous API calls. Using `useEffect` and `fetch()`, the component requests data from `GET /api/emails`, receives the JSON array, and updates the local state. When sending an email, a `POST` request is dispatched with the JSON body, and upon a successful 201 response, the UI instantly refreshes the inbox list."

---

### Slide 6: Live Demonstration & Academic Summary
* **Slide Title**: Live Demonstration & Academic Rubric
* **Live Demo Steps**:
  1. **Fetch & Display**: Open the web application. Show the Network Tab in DevTools making a `GET` request to `/api/emails` and rendering the list.
  2. **Create Resource**: Click 'Compose', fill in an email, and hit Send. Observe the `POST /api/emails/send` call returning status `201`.
  3. **Route & Controller Log**: Look at the terminal console showing the Express route receiving the request and the controller executing.
  4. **State Update**: Watch the new email appear in the 'Sent' folder immediately.
* **Speaker Script**:  
  > "To conclude, our live demo demonstrates the full request-response lifecycle: the user triggers an action in the React View, an async HTTP request is sent across our REST Routes, the Controller processes and validates the data, the Model saves it, and the View dynamically re-renders. This satisfies all course requirements for full-stack MVC and REST API development."

---

## Quick Q&A Cheat-Sheet for Professor Questions

#### Q1: "Why did you separate Routes and Controllers instead of putting everything in `server.js`?"
> **Answer**: "Putting routes and logic in a single file makes code hard to maintain and violates separation of concerns. By putting URL patterns in `src/routes/` and request logic in `src/controllers/`, each file has one clear job. If our route URLs change, our controllers don't need to be rewritten."

#### Q2: "What is the purpose of the `src/helpers/` folder?"
> **Answer**: "In a standard MVC application, controllers should only handle HTTP requests and responses. Extra functionality like low-level SMTP networking, DNS record lookups, or file storage helpers don't belong in a controller. Putting them in `helpers/` keeps our MVC structure clean and prevents bloated controllers."

#### Q3: "How does your frontend handle backend API errors?"
> **Answer**: "We wrap our frontend `fetch` calls in `try...catch` blocks and inspect `res.ok` and status codes (like 400 or 500). If the backend returns an error message in JSON, our React UI displays an alert toast to the user instead of crashing the page."

#### Q4: "Which HTTP status codes do you use in your API?"
> **Answer**: 
> - `200 OK`: Successful data retrieval (`GET`) or updates (`PATCH`).
> - `201 Created`: Successful creation of resources like an email or mailbox (`POST`).
> - `400 Bad Request`: Validation failure (missing required fields).
> - `404 Not Found`: Requesting an ID that does not exist.
> - `500 Internal Server Error`: Unexpected server or filesystem errors.

---

## How to Run & Present

```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Open the Presentation
open presentation.html
```
