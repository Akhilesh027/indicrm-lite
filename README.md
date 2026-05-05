# Digitalness CRM — Complete Digital Marketing Agency CRM

A full-featured **Digital Marketing Agency CRM** built with React 18, TypeScript, Tailwind CSS, Zustand, and shadcn/ui. The application is fully frontend-driven with `localStorage` persistence (no backend required) and ships with realistic Indian dummy data — ₹ currency, UPI/Bank Transfer payments, Indian cities, names, GSTIN/PAN fields, and CGST/SGST/IGST tax breakups.

**Live Preview**: [Open in Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID)

---

## 📑 Table of Contents

1. [Authentication & Roles](#1-authentication--roles)
2. [Dashboard](#2-dashboard)
3. [Branches Module](#3-branches-module)
4. [Employee Management](#4-employee-management)
5. [Leads Management](#5-leads-management)
6. [Sales Pipeline (Kanban)](#6-sales-pipeline-kanban)
7. [Proposals Module](#7-proposals-module)
8. [Customers Module](#8-customers-module)
9. [Project Templates](#9-project-templates)
10. [Works / Tasks](#10-works--tasks)
11. [Deliverables (Kanban Board)](#11-deliverables-kanban-board)
12. [Invoices Module](#12-invoices-module)
13. [Payments Module](#13-payments-module)
14. [Support Tickets](#14-support-tickets)
15. [Telecaller Workspace](#15-telecaller-workspace)
16. [Accounts Module](#16-accounts-module)
17. [Reports](#17-reports)
18. [Employee Report](#18-employee-report)
19. [Client Portal](#19-client-portal)
20. [Tasks & SLA](#20-tasks--sla)
21. [Communications](#21-communications)
22. [Approvals & Revisions](#22-approvals--revisions)
23. [Performance Scoring](#23-performance-scoring)
24. [Expenses & Profit](#24-expenses--profit)
25. [Notifications](#25-notifications)
26. [Automated Reports](#26-automated-reports)
27. [Workflow Visual](#27-workflow-visual)
28. [Architecture](#-architecture)
29. [Tech Stack](#-tech-stack)
30. [Routes & Role Access](#-routes--role-access-matrix)
31. [Local Development](#-local-development)

---

## 🚀 Features

### 1. Authentication & Roles
- Role-based login system supporting **7 roles**: **Admin, Manager, Telecaller, Sales Executive, Employee, Accountant, Customer**.
- Each role gets a tailored sidebar with only authorized pages.
- Persistent session via Zustand `persist` middleware (`digitalness-crm-storage-v3`).
- Quick role-switch on login screen for demo/testing.

### 2. Dashboard
- Role-aware KPI stat cards (revenue, leads, customers, projects, pending invoices).
- **Revenue Chart** (Recharts) showing monthly trends.
- **Leads Funnel** visualization (New → In Progress → Converted → Lost).
- **Recent Activity** feed of latest leads, customers, and tasks.
- Framer Motion entry animations.

### 3. Branches Module
- Admin CRUD interface for managing **office branches** (seeded: Hyderabad — Main, Bangalore, Chennai).
- Fields: branch name, city, assigned manager (linked to employee), status (Active/Inactive).
- Branch IDs are referenced across Leads, Deals, Customers, Projects, Employees, and Invoices for branch-wise reporting.

### 4. Employee Management
- Full CRUD for employees (Admin/Manager only).
- Tracked fields: name, role, department, contact, email, joining date, salary, performance, **branchId**, **skills**, **reporting manager**, and **employeeType** (Full-Time, Part-Time, Freelance, Intern).
- Linked attendance and salary record stores.

### 5. Leads Management
- Add, edit, delete, filter, and search leads.
- **Statuses**: New, In Progress, Converted, Lost, Own Close.
- Extended fields: `branchId`, `budgetRange`, `leadScore` (Hot / Warm / Cold), `probability`, `nextFollowUpDate`, `inPipeline`.
- **Role-based assignment**: pick a role (Telecaller / Sales Executive / Employee), then choose from a filtered list.
- Inline reassignment by clicking the assignee in the table or via the row Actions menu.
- **Convert to Customer** in one click (auto-creates a customer record).
- **Add to Pipeline** action — promotes a lead into the Sales Pipeline as a Deal.
- Filters: status, branch, lead score, assignee.

### 6. Sales Pipeline (Kanban)
- Visual Kanban board with **8 stages**: New → Contacted → Qualified → Proposal Sent → Negotiation → Won → Lost.
- Drag deals between stages; deal cards show value, probability, branch, and owner.
- **Won automation**: marking a deal as Won automatically creates a `Customer`, a `Project`, and a `Draft Invoice`.
- **Lost automation**: requires a reason (Price, Competitor, Timing, Not interested, Other) for analytics.
- Deal store persisted independently (`dealStore.ts`).

### 7. Proposals Module
- Create branded proposals with dynamic service line items, quantities, rates, and auto-calculated totals.
- **Statuses**: Draft, Sent, Accepted, Rejected, Expired.
- Linked to a Deal — accepting a proposal auto-moves the deal to **Negotiation**.
- **PDF Export** using a clean branded template (`generateProposalPDF` in `pdfGenerator.ts`).

### 8. Customers Module
- Complete customer directory with rich fields: contacts, business type, city, requirements, **GSTIN, PAN, industry, company size, point-of-contact (POC) details, contract start/end dates, monthly retainer, branchId**.
- **Customer Profile Dialog** with tabbed deep-dive view:
  - **Overview**: KPIs (projects, task completion %, team size), contact info, financial summary (Invoiced vs Paid vs Pending).
  - **Team**: All employees assigned to this client with per-person task completion stats.
  - **Projects & Tasks**: Project progress bars + granular task table (category, assignee, status, due date).
  - **Payments & Invoices**: Full transaction & billing history per client.
- **Client Report PDF Export** (jsPDF + autoTable): branded PDF with performance metrics, team list, projects, task breakdown, and financial history.

### 9. Project Templates
- Reusable project blueprints (e.g., "SEO Starter", "Social Media Monthly", "Website Redesign").
- Each template defines default deliverables, estimated days, and base cost.
- New projects can be spawned from a template, auto-seeding deliverable lists.

### 10. Works / Tasks
- Task management with assignments, statuses (To Do / In Progress / Completed), deadlines, and priorities (Low/Medium/High).
- Visible to Admin, Manager, and Employees.

### 11. Deliverables (Kanban Board)
- Per-client recurring deliverables (e.g., "4 reels, 10 posts, 2 designs / month").
- Kanban board: **Not Started → In Progress → Review → Completed**.
- Per-deliverable: assignee, due date, comments/notes, progress %, category.

### 12. Invoices Module
- Create invoices with line items, **CGST / SGST / IGST tax breakup**, discounts, and payment terms.
- **Statuses**: Draft, Sent, Paid, Overdue.
- **Recurring billing** support (monthly retainers).
- `branchId` on every invoice for branch-wise revenue reporting.
- Professional invoice preview + PDF export.
- Per-customer invoice history.

### 13. Payments Module
- Record payments with Indian payment methods: **UPI, Bank Transfer, Cash, Cheque**.
- Track payment status, reference numbers, transaction date.
- **Outstanding dues dashboard** and payment reminder workflow.

### 14. Support Tickets
- Comprehensive ticketing system for customer issues / requests.
- Fields: subject, description, priority (Low/Medium/High/Urgent), status (Open / In Progress / Resolved / Closed), category, assignee.
- **Role-based visibility**: customers see only their own tickets; Admin / Manager / Employees see all.
- Filtering and search.

### 15. Telecaller Workspace
- Dedicated module for Telecallers to manage daily call lists, log call outcomes, schedule follow-ups, and update lead status.

### 16. Accounts Module
- Financial records for Admin/Accountant: income vs expenses, salary disbursements, monthly P&L summary.

### 17. Reports
- Aggregated reports across leads, projects, revenue, and employee performance.
- **Advanced filters**: date range, **branch**, **customer** — dynamically updates lead and project analytics.
- Recharts visualizations for trends.

### 18. Employee Report
- Per-employee performance deep-dive (Admin/Manager only).
- Shows: total projects worked on, tasks completed vs pending, completion rate, deliverables handled, clients served, full activity breakdown.

### 19. Client Portal (Customer-Facing)
- Read-only dashboard for customers (also viewable by Admin/Manager via dropdown selector).
- **Sidebar navigation** with 5 sections + dynamic count badges:
  - **Overview**: KPI cards (total tasks, completion rate, projects) + Recharts visualizations.
  - **Team**: All employees assigned with personalized task completion progress bars.
  - **Tasks**: Detailed deliverables list with status badges and due dates.
  - **Payments**: Transaction history with method, reference, status.
  - **Invoices**: Billing documents with status indicators and PDF download.
- Reusable `StatBox` component, Framer Motion animations.

---

## 🏗️ Architecture

### State Management (Zustand + persist → localStorage)
- **`crmStore.ts`** — auth, employees, leads, customers, projects, attendance, salaries, financial records, **branches**.
- **`dealStore.ts`** — sales pipeline deals (Kanban).
- **`proposalStore.ts`** — proposals & their statuses.
- **`invoiceStore.ts`** — invoices, deliverables, payment records, payment reminders.
- **`templateStore.ts`** — project templates.
- **`ticketStore.ts`** — support tickets.

Storage is versioned (`digitalness-crm-storage-v3`) so schema upgrades reseed cleanly.

### Data Layer (`src/data/`)
- `dummyData.ts` — employees, leads, customers, projects, branches, attendance, salaries, financials.
- `dealData.ts` — pipeline deals seed.
- `proposalData.ts` — proposals seed.
- `invoiceData.ts` — invoices, deliverables, payments seed.
- `templateData.ts` — project templates seed.
- `ticketData.ts` — support tickets seed.

### PDF Generation (`src/utils/pdfGenerator.ts`)
- 100% client-side using `jspdf` + `jspdf-autotable`.
- Templates: **Client Report**, **Invoice**, **Proposal**, **Employee Report**.

### Design System
- Tailwind CSS with **HSL semantic tokens** in `index.css` and `tailwind.config.ts`.
- shadcn/ui component library throughout (no raw color classes in components).
- Framer Motion for page transitions and micro-interactions.
- Lucide-react icons.

---

## 🛠️ Tech Stack

- **Framework**: React 18 + Vite 5 + TypeScript 5
- **Styling**: Tailwind CSS v3 + shadcn/ui
- **State**: Zustand (with persist middleware)
- **Routing**: React Router v6
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Icons**: lucide-react
- **PDF**: jsPDF + jspdf-autotable
- **Forms / UI**: react-hook-form, zod, sonner (toasts)

---

## 📂 Routes & Role Access Matrix

| Route | Page | Roles |
|---|---|---|
| `/` | Login | All |
| `/dashboard` | Dashboard | All authenticated |
| `/branches` | Branches Admin | Admin |
| `/employees` | Employees | Admin, Manager |
| `/leads` | Leads | Admin, Manager, Telecaller, Sales Executive |
| `/sales-pipeline` | Sales Pipeline (Kanban) | Admin, Manager, Sales Executive |
| `/proposals` | Proposals | Admin, Manager, Sales Executive |
| `/customers` | Customers + Profile + Report | Admin, Manager, Sales Executive |
| `/templates` | Project Templates | Admin, Manager |
| `/works` | Tasks | Admin, Manager, Employee |
| `/deliverables` | Kanban Deliverables | Admin, Manager, Employee |
| `/invoices` | Invoices | Admin, Manager, Accountant |
| `/payments` | Payments | Admin, Manager, Accountant |
| `/tickets` | Support Tickets | Admin, Manager, Employee, Customer |
| `/client-portal` | Client Portal | Admin, Manager, Customer |
| `/telecaller` | Telecaller Workspace | Admin, Manager, Telecaller |
| `/accounts` | Accounts | Admin, Accountant |
| `/reports` | Reports | Admin, Manager, Accountant |
| `/employee-report` | Per-Employee Report | Admin, Manager |

---

## 🔄 Cross-Module Automations

- **Lead → Pipeline**: "Add to Pipeline" creates a Deal in stage `New`.
- **Deal Won**: Auto-creates Customer + Project + Draft Invoice.
- **Deal Lost**: Requires reason capture (Price/Competitor/Timing/etc.).
- **Proposal Accepted**: Linked deal auto-advances to `Negotiation`.
- **Lead → Customer**: One-click conversion creates a Customer record and marks lead `Own Close`.
- **Project Template → Project**: Creating a project from a template seeds default deliverables, days, and cost.

---

## 🧑‍💻 Local Development

```sh
# Install dependencies
npm i

# Start dev server
npm run dev
```

Requires Node.js & npm ([install via nvm](https://github.com/nvm-sh/nvm#installing-and-updating)).

---

## 🚢 Deployment

Open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) → **Share → Publish**.

Custom domain: **Project → Settings → Domains → Connect Domain**. [Docs](https://docs.lovable.dev/features/custom-domain#custom-domain).

---

## 🔢 Storage Versioning

Persisted under `digitalness-crm-storage-v3`. To reset, clear that key from localStorage and reload — fresh dummy data reseeds automatically.
