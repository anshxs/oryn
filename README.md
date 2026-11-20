# Oryn Mail Server 📬

A modern, functional, and self-hosted mail server with a sleek React webmail interface and an embedded Node.js RFC-compliant SMTP engine. Connect your custom domain, receive incoming emails directly via SMTP, and send emails to any address worldwide.

Built as a group project by **Ansh Sharma**, **Swaraj Agarwal**, **Mayank Chauhan**, and **Arpit Rajput**.

---

## 🚀 Key Features

- **Inbound SMTP Server (RFC 5321)**: Runs an embedded SMTP daemon listening on port 25 / 2525 with MIME parsing (`mailparser`), attachment decoding, and header extraction.
- **Custom Domain Wizard**: Configure any domain (`yourdomain.com`), and Oryn automatically generates and verifies the required DNS records (MX, A, SPF, DMARC).
- **Outbound Delivery (Mail to Others)**:
  - **Direct MX Delivery**: Queries recipient domain MX records via DNS and delivers directly to external mail servers.
  - **SMTP Relay Support**: Optional relay via SendGrid, Mailgun, Brevo, or custom SMTP servers (essential for environments where ISPs block outbound port 25).
- **Modern Webmail Client**:
  - React + Tailwind CSS + Lucide Icons.
  - Real-time inbox via WebSockets (new emails appear instantly without page refresh).
  - Clean preview pane with sandboxed iframe HTML rendering.
  - Attachment viewing and downloading.
  - Reply, Forward, Star, and Folder management (Inbox, Sent, Starred, Trash).
  - Inbound email simulator for local 1-click testing.
- **Zero Heavy Database Requirement**: File-based persistent storage (`backend/data/emails.json` & `settings.json`) — works out of the box with zero database installation required!

---

## 🛠️ Project Structure

```
oryn/
├── backend/                  # Node.js SMTP server & Express REST API
│   ├── src/
│   │   ├── index.js          # Server entry point
│   │   ├── server.js         # Express routes & WebSockets
│   │   ├── smtpServer.js     # Inbound SMTP server (RFC 5321)
│   │   ├── mailer.js         # Outbound mail delivery (Direct MX / Relay)
│   │   ├── dnsHelper.js      # DNS record generator & live verifier
│   │   └── storage.js       # File-based JSON persistence & attachments
│   ├── data/                 # Auto-created email store & attachments
│   ├── .env.example
│   └── package.json
├── frontend/                 # React 19 + Vite webmail application
│   ├── src/
│   │   ├── components/       # Sidebar, EmailList, EmailDetail, ComposeModal, etc.
│   │   ├── services/api.js   # REST and WebSocket client
│   │   ├── App.jsx           # Main orchestrator
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
└── README.md
```

---

## ⚙️ Quick Start

### 1. Prerequisites
- Node.js (v18+)
- npm or pnpm

### 2. Backend Setup
```bash
cd backend
npm install
npm run dev
```
The API and WebSockets will start on `http://localhost:4000` and the Inbound SMTP listener on port `2525` (configurable via `SMTP_PORT`).

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:3000`.

---

## 🌐 Connecting Your Custom Domain

To receive incoming mail for your domain (e.g. `user@yourdomain.com`):

1. **Set your domain** in the Oryn UI Settings or in `backend/.env`:
   ```env
   MAIL_DOMAIN=yourdomain.com
   SERVER_HOST=mail.yourdomain.com
   SERVER_IP=YOUR_SERVER_PUBLIC_IP
   ```
2. **Add DNS Records** at your DNS registrar (Cloudflare, GoDaddy, Route53, Namecheap):

| Type | Name / Host | Value / Target | Priority | Description |
|------|-------------|----------------|----------|-------------|
| **A** | `mail` | `YOUR_SERVER_IP` | - | Points mail hostname to your server |
| **MX** | `@` | `mail.yourdomain.com` | `10` | Routes incoming emails to your server |
| **TXT** | `@` | `v=spf1 mx a:mail.yourdomain.com ~all` | - | SPF record authorizing sender |
| **TXT** | `_dmarc` | `v=DMARC1; p=none; sp=none;` | - | DMARC policy |

3. Click **"Check Live DNS"** inside Oryn Mail settings to verify your DNS configuration in real-time.

---

## 📬 Receiving and Sending Emails

- **Receiving Email**: Any email sent to `@yourdomain.com` will hit your SMTP server, be parsed into JSON with attachments, and appear on your webmail screen via WebSockets.
- **Testing Locally**: Click the **"Simulate Inbound"** button in the sidebar to simulate an incoming message instantly.
- **Sending Email**: Click **"Compose Mail"**, enter a recipient, write your email, attach files, and click **Send**.

---

## 👥 Contributors

- **Ansh Sharma** (`anshsxa@gmail.com`)
- **Swaraj Agarwal** (`agarwalswaraj123@gmail.com`)
- **Mayank Chauhan** (`mchauhantha@gmail.com`)
- **Arpit Rajput** (`imironman7599@gmail.com`)

---

## 📄 License
MIT
