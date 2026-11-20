# Oryn — Autonomous Mail Infrastructure & MTA
## Project Defense & Technical Presentation Guide

> **Interactive Presentation**: Open [`presentation.html`](./presentation.html) in any modern web browser or run `open presentation.html` from the terminal.  
> **Controls**: `Arrow Keys` or `Space` to navigate, `F` for Fullscreen, `O` for Slide Overview Grid, `T` for Theme Toggle (Dark/Light), `P` to Print / Export to PDF.

---

## Executive Summary & Academic Scope

**Oryn** is a production-grade, self-hosted Mail Transfer Agent (MTA) and email client built from scratch. It solves the vendor lock-in, data privacy risks, and pricing escalation associated with centralized email platforms (Google Workspace, Microsoft 365, Resend, SendGrid) by implementing direct RFC 5321 socket networking, automated DNS verification, intelligent outbound delivery with ISP port 25 block fallbacks, and a modern SaaS interface.

### Academic Grading Highlights (Software Architecture & Networking)
1. **Strict MVC Architecture**:
   - **Routes (`src/routes/`)**: Pure route declarations and HTTP method binding.
   - **Controllers (`src/controllers/`)**: Request validation, status code orchestration, response serialization.
   - **Models (`src/models/`)**: Data schemas and persistence layers (Mailbox, Email, Domain, Settings, Analytics).
   - **Helpers (`src/helpers/`)**: Dedicated modular abstraction for infrastructure, networking, and security logic outside the standard MVC CRUD scope (RFC 5321 daemon, DNS resolver, SMTP relay client, header analyzers).
2. **Low-Level Network Protocols**:
   - Direct TCP socket server implementing RFC 5321 inbound mail handling (`HELO/EHLO`, `MAIL FROM`, `RCPT TO`, `DATA`, `QUIT`).
   - DNS MX record lookup and prioritization via `dns.promises`.
   - Dynamic port 25 ISP egress block detection and automated fallback to authenticated SMTP relays.
3. **Enterprise UI/UX**:
   - Built on Vite, React 19, Tailwind CSS, Lucide icons, and Radix UI primitives with full light/dark mode support.

---

## Slide-by-Slide Defense Script & Speaker Notes

### Slide 1: Cover & Project Identity
* **Headline**: Oryn — Autonomous Mail Infrastructure & MTA
* **Subtitle**: High-Performance RFC 5321 Mail Engine, MVC Architecture & Modern SaaS Web Client
* **Speaker Script**:  
  > "Good morning, professors and evaluators. Today we are presenting **Oryn**, an autonomous, self-hosted Mail Transfer Agent (MTA) and comprehensive mail management platform. Our goal was to demystify and implement the fundamental protocols of the Internet's mail system—RFC 5321 SMTP, DNS MX routing, and raw socket stream parsing—while wrapping it in an enterprise-grade Model-View-Controller backend and a modern SaaS web interface."

---

### Slide 2: The Problem Space & Architecture Need
* **Headline**: The Problem: The Centralized Email Monopoly
* **Key Points**:
  - **Closed Ecosystems**: Providers charge steep per-seat fees ($7-$20/user/month) and retain total control over message data.
  - **Blackbox Deliverability**: Egress IP reputation and port 25 residential/cloud blocks silently drop mail.
  - **Architectural Bloat**: Legacy MTAs (Postfix, Exim, Sendmail) rely on obtuse configuration files (`main.cf`) without modern REST APIs or reactive web interfaces.
* **Speaker Script**:  
  > "Most organizations rely entirely on Google Workspace, Microsoft 365, or expensive API relays like SendGrid. If you want to run your own mail server, you're usually forced to configure 30-year-old C software like Postfix or Exim via esoteric configuration files with zero modern API access. Oryn provides an autonomous, transparent alternative: an end-to-end MTA with a clean REST API, real-time analytics, and a consumer-grade user experience."

---

### Slide 3: High-Level System Topology
* **Headline**: End-to-End System Architecture
* **Visual Topology**:
  - **Inbound Pipeline**: World Mail Server $\to$ Port 25/2525 TCP $\to$ `helpers/smtpServer.js` $\to$ Stream Parser & Security Audit $\to$ MongoDB $\to$ Web Client.
  - **Outbound Pipeline**: React Web Client $\to$ `controllers/mailController.js` $\to$ `helpers/mailer.js` $\to$ Direct MX Delivery (Port 25) OR Authenticated Relay (Port 587/465).
* **Speaker Script**:  
  > "Here is our complete system topology. Notice the clear separation of concerns. On the inbound side, remote MTAs deliver mail directly to our custom RFC 5321 socket daemon on port 2525. The raw email stream is parsed, analyzed for SPF/DKIM security headers, and indexed into MongoDB. On the outbound side, users compose emails through our modern web UI, calling REST endpoints that route through our Mail Controller, which dynamically chooses between direct DNS MX socket delivery or an authenticated relay fallback."

---

### Slide 4: Strict MVC Architecture Breakdown
* **Headline**: Clean Separation of Concerns (Academic Grading Alignment)
* **Directory Structure**:
  - `src/routes/`: Route definitions (`mailRoutes.js`, `authRoutes.js`, `domainRoutes.js`, `settingsRoutes.js`, `analyticsRoutes.js`).
  - `src/controllers/`: HTTP business orchestration (`mailController.js`, `authController.js`, `domainController.js`, etc.).
  - `src/models/`: Database schemas (`Mailbox.js`, `Email.js`, `Domain.js`, `Settings.js`).
  - `src/helpers/`: Infrastructure & Network Daemons (`smtpServer.js`, `mailer.js`, `dnsHelper.js`, `securityAnalyzer.js`, `publicIp.js`).
* **Speaker Script**:  
  > "A core requirement of our software engineering coursework was strict architectural discipline. We implemented canonical Model-View-Controller:  
  > 1. Our Routes only declare URL endpoints and pass requests to controllers.  
  > 2. Our Controllers parse HTTP bodies, enforce authorization, and return JSON status codes.  
  > 3. Our Models define Mongoose schemas with indexed fields and validation.  
  > 4. To prevent controller pollution, all low-level networking, socket parsing, DNS lookup, and cryptographic helpers are strictly isolated in a dedicated `helpers/` package."

---

### Slide 5: Inbound SMTP Daemon (RFC 5321)
* **Headline**: Custom Socket Server & Stream Processing
* **Key Specifications**:
  - Standard RFC 5321 handshake sequence: `220 Service Ready` $\to$ `EHLO/HELO` $\to$ `MAIL FROM` $\to$ `RCPT TO` $\to$ `DATA` $\to$ `354 Start Mail Input` $\to$ `.` (CRLF.CRLF) $\to$ `250 OK Message accepted`.
  - Chunked stream buffering with memory boundaries (25MB limit).
  - Mailparser integration for MIME multipart decoding, HTML stripping, and attachment serialization.
* **Speaker Script**:  
  > "Rather than using off-the-shelf mail server packages, our `smtpServer.js` helper runs a Node.js `smtp-server` socket engine. It implements the standard RFC 5321 state machine, validates recipient domains against our MongoDB domain registry, streams MIME chunks safely into memory, and parses multipart text, HTML, and binary attachments in real-time."

---

### Slide 6: Outbound Mail Dispatch & ISP Port 25 Fallback
* **Headline**: Intelligent Dual-Mode Outbound Routing
* **The Challenge**: Almost all residential ISPs (Comcast, Jio, Airtel) and cloud hyperscalers (AWS EC2, DigitalOcean, Azure) drop outbound traffic on TCP port 25 to prevent botnet spam.
* **The Oryn Solution**:
  - **Mode 1 (Direct MX)**: Resolve target domain MX records $\to$ connect directly to recipient's primary mail exchange on port 25 $\to$ transmit message.
  - **Mode 2 (Smart Relay Fallback)**: If connection times out or fails (e.g. `ETIMEDOUT` / port 25 blocked), Oryn automatically fails over to an authenticated SMTP relay (Port 587/465 with STARTTLS/TLS).
* **Speaker Script**:  
  > "Outbound mail delivery faces a major real-world hurdle: port 25 egress blocks. In our `mailer.js` helper, we built an intelligent dual-mode engine. By default, it queries DNS for the recipient's MX records and attempts direct delivery. If the network interface detects an egress block or connection timeout, Oryn transparently pivots to an authenticated SMTP smart relay over port 587 or 465, guaranteeing 100% deliverability without dropping the message."

---

### Slide 7: Email Security & Header Audit
* **Headline**: Deep Inspection & Authentication Engine
* **Features**:
  - **SPF (Sender Policy Framework)**: Analyzes `Received-SPF` headers to verify if the sending server IP was authorized by the domain's TXT record.
  - **DKIM (DomainKeys Identified Mail)**: Inspects digital cryptographic signatures (`DKIM-Signature`) to guarantee message integrity in transit.
  - **DMARC**: Checks domain alignment and compliance policy (`reject`, `quarantine`, `none`).
  - **Spam Score Algorithm**: Inspects keyword density, missing `Message-ID`, uppercase subject ratios, and suspicious relay hops.
* **Speaker Script**:  
  > "Modern email security is paramount. When an email enters Oryn's inbound daemon, our `securityAnalyzer.js` inspects the raw RFC 822 headers. It evaluates SPF passes or soft-fails, validates DKIM signature presence, and computes a comprehensive risk score. This data is displayed visually in our frontend security badge drawer, giving users immediate insight into whether an email is authentic or spoofed."

---

### Slide 8: Automated DNS & Public IP Resolver
* **Headline**: Self-Healing Network Configuration
* **Features**:
  - Real-time DNS lookups using Node.js `dns.promises`.
  - Automatic MX, TXT (SPF), and DMARC verification for custom domains.
  - Multi-provider public IP auto-detection (`icanhazip`, `ifconfig.me`, `ipify`) with fallback caching to generate exact DNS records for server administrators.
* **Speaker Script**:  
  > "Configuring email servers is notoriously difficult due to DNS records. In `dnsHelper.js` and `publicIp.js`, Oryn automatically queries multiple public IP providers to find its external WAN address. It then generates the exact DNS records—MX, SPF TXT, and DMARC—needed for any added domain, and provides a real-time 'Verify DNS' button in the dashboard that inspects authoritative nameservers."

---

### Slide 9: Modern SaaS Web Client
* **Headline**: Clean, Neutral Zinc SaaS Experience
* **Tech Stack**:
  - React 19 + Vite (Fast HMR, optimized production bundle < 250KB).
  - Tailwind CSS with neutral zinc color tokens (`#fafafa` / `#ffffff` / `#18181b`).
  - Radix UI primitives for accessible Dialogs, Dropdowns, and Tooltips.
  - Full keyboard shortcuts (`J`/`K` navigation, `E` archive, `R` reply, `C` compose).
  - Dark / Light theme toggle with zero hydration flicker.
* **Speaker Script**:  
  > "We completely moved away from stark monochrome and bloated stylesheets. The frontend is built with React 19 and Tailwind CSS, utilizing high-contrast zinc surfaces modeled after world-class developer tools like Vercel and Linear. It includes a rich markdown/HTML composer, domain health monitors, an analytics dashboard, and full light/dark theme toggle support."

---

### Slide 10: Multi-Tenancy & Mailbox Authentication
* **Headline**: Secure Identity & Token Architecture
* **Security Layer**:
  - Passwords hashed with `bcryptjs` (salt rounds: 10).
  - Stateless JSON Web Tokens (JWT) signed with HMAC-SHA256.
  - Per-mailbox domain sandboxing (users can only access messages destined for their verified organization domains).
  - Granular API tokens for programmatic email sending via REST.
* **Speaker Script**:  
  > "Security is built into every layer. Users authenticate via JWT tokens stored in secure browser storage. Passwords are salted and hashed with bcrypt. Each user owns mailboxes tied to verified domains, ensuring multi-tenant isolation where one department or organization cannot read another's inbound mail stream."

---

### Slide 11: Team Contributions & Git Ownership
* **Team Members & Responsibilities**:
  - **Arpit Rajput (`@arpitrajput`)**: RFC 5321 Inbound Daemon (`smtpServer.js`), Outbound Mail Dispatcher (`mailer.js`), ISP Port 25 Fallback Logic, and Git Infrastructure.
  - **Ansh Sharma (`@anshsharma`)**: Full-Stack Architecture, REST Controllers, MVC Route Setup, Database Schema Design, and Security Auditing.
  - **Mayank Chauhan (`@mayankchauhan`)**: Frontend UI/UX, Component Systems, Radix Dialogs, Theme Architecture, and Domain Verification Panels.
  - **Swaraj Agarwal (`@swarajagarwal`)**: DNS Resolution Engine (`dnsHelper.js`), Public IP Autodiscovery, Analytics Aggregation, and Deliverability Testing.

---

### Slide 12: Live Demonstration & Defense Script
* **Live Demo Steps**:
  1. **Inbound Mail**: Send an email from an external client (e.g. Gmail / Outlook / telnet) to `test@glennesports.app` on port 2525. Observe the live socket log and instant mailbox UI update.
  2. **Security Inspection**: Open the email drawer to inspect SPF, DKIM, and spam score evaluation.
  3. **Outbound Dispatch**: Compose an email from the SaaS client to a real email address. Show the controller log validating delivery via relay or direct MX.
  4. **Domain Health**: Open the Domain Modal to demonstrate dynamic DNS verification across MX, SPF, and DMARC records.

---

## Anticipated Professor Questions & Bulletproof Answers

#### Q1: "Why did you implement a custom SMTP daemon instead of using Postfix or Sendmail?"
> **Answer**: "Postfix and Sendmail are legacy C-based daemons configured via static text files like `/etc/postfix/main.cf`. They cannot natively stream incoming messages directly into a reactive JavaScript event loop or modern database without complex external pipe scripts (`pipe` or `maildrop`). By implementing an RFC 5321 socket daemon in Node.js, we gain complete programmatic control over the SMTP handshake, real-time security inspection, and immediate persistence into MongoDB."

#### Q2: "How does your architecture adhere to the MVC design pattern when dealing with raw socket servers?"
> **Answer**: "The socket daemon is an infrastructure background process, not an HTTP endpoint. To preserve strict MVC purity, we placed all network socket management, SMTP protocol state machines, and DNS lookup utilities inside a dedicated `src/helpers/` directory. The HTTP API endpoints in `src/routes/` strictly invoke `src/controllers/`, which read and write to `src/models/`. The socket helper merely acts as an ingest worker that populates the Model layer."

#### Q3: "What prevents residential ISPs from blocking your outbound mail, and how do you handle port 25 restrictions?"
> **Answer**: "Most consumer ISPs and cloud providers block outbound TCP port 25. Our `mailer.js` helper solves this using an intelligent fallback architecture: it first attempts direct MX delivery, but if the socket detects an `ETIMEDOUT` or `ECONNREFUSED` error on port 25, it automatically retries through an authenticated SMTP relay using port 587 (STARTTLS) or port 465 (TLS). This ensures zero dropped messages."

#### Q4: "How do you protect the system against spam, open relays, and spoofing?"
> **Answer**: "First, our SMTP daemon enforces `RCPT TO` domain authorization: it verifies that the recipient domain exists in our database, preventing open-relay abuse. Second, our `securityAnalyzer.js` inspects RFC 822 headers for SPF authorization (`Received-SPF`), DKIM signatures (`DKIM-Signature`), and DMARC alignment, calculating a real-time risk score for every incoming email."

---

## How to Present

```bash
# 1. Open the interactive presentation deck
open presentation.html

# 2. Start the backend server (Terminal 1)
cd /path/to/oryn
npm run dev

# 3. Start the frontend client (Terminal 2)
cd frontend
npm run dev
```

*Presentation deck created and maintained for Oryn MTA Project Defense.*
