# Digitalness CRM

A complete **Digital Marketing Agency CRM** built with React, TypeScript, Tailwind CSS, and Zustand. The app is fully frontend-driven with `localStorage` persistence and includes role-based dashboards, client management, billing, deliverables tracking, and PDF report generation — all populated with realistic Indian dummy data (₹ currency, UPI/Bank payments, Indian cities & names).

**Live Preview**: [Open in Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID)

---

## 🚀 Features Developed

### 1. Authentication & Role-Based Access
- Role-based login system with 7 roles: **Admin, Manager, Telecaller, Sales Executive, Employee, Accountant, Customer**.
- Each role sees a tailored sidebar with only the pages they're authorized to access.
- Persistent session via `localStorage` (Zustand `persist` middleware).

### 2. Dashboard
- Role-aware dashboard with KPI stat cards, revenue charts, lead funnel visualization, and recent activity feed.
- Built with Recharts for data visualization and Framer Motion for smooth animations.

### 3. Employee Management
- Full CRUD for employees (Admin/Manager only).
- Tracks role, department, contact, joining date, salary, and performance.
- Attendance tracking and salary records.

### 4. Leads Management
- Add, edit, delete, and filter leads by status (New, In Progress, Converted, Lost, Own Close).
- **Role-based lead assignment**: choose a role first (Telecaller / Sales Executive / Employee), then pick from a filtered list of employees in that role.
- Reassign leads inline by clicking the assignee in the table or via the row Actions menu.
- Convert leads → customers in one click (auto-creates a customer record).

### 5. Customers Module
- Complete customer directory with contacts, business type, city, requirements, and project history.
- **Customer Profile Dialog** with tabbed deep-dive view:
  - **Overview**: KPIs (projects, task completion %, team size), contact info, financial summary (Invoiced vs Paid vs Pending).
  - **Team**: All employees working on the client's projects/deliverables with per-person task completion stats.
  - **Projects & Tasks**: Project progress bars + granular task table (category, assignee, status, due date).
  - **Payments & Invoices**: Full invoice and payment transaction history per client.
- **Client Report PDF Export** (jsPDF + autoTable): branded PDF with performance metrics, team list, projects, task breakdown, and full financial history.

### 6. Works / Tasks
- Task management with assignments, statuses, deadlines, and priorities.
- Visible to Admin, Manager, and Employees.

### 7. Deliverables (Kanban Board)
- Per-client recurring deliverables (e.g., "4 videos, 10 social posts, 2 designs/month").
- Kanban-style board: **Not Started → In Progress → Review → Completed**.
- Assign employees to each deliverable, add comments/notes, track due dates and progress %.

### 8. Invoices Module
- Create invoices with line items, tax, and discounts.
- Statuses: **Draft, Sent, Paid, Overdue**.
- Professional invoice preview with PDF export.
- Per-customer invoice history.

### 9. Payments Module
- Record payments with Indian payment methods: **UPI, Bank Transfer, Cash, Cheque**.
- Track payment status, reference numbers, and dates.
- Outstanding dues dashboard and payment reminder workflow.

### 10. Client Portal (Customer-Facing View)
- Read-only dashboard for customers (also viewable by Admin/Manager via dropdown).
- **Sidebar navigation** with 5 sections + dynamic count badges:
  - **Overview**: KPI cards (total tasks, completion rate, projects) + Recharts visualizations.
  - **Team**: All employees assigned to this client with personalized task completion progress bars.
  - **Tasks**: Detailed deliverables list with status badges and due dates.
  - **Payments**: Transaction history with method, reference, and status.
  - **Invoices**: Billing documents with status indicators.
- Reusable `StatBox` component for consistent KPI display.
- Framer Motion entry animations between sections.

### 11. Telecaller Module
- Dedicated workspace for Telecallers to manage call lists, call statuses, and follow-ups.

### 12. Accounts Module
- Financial records for Admin/Accountant: income, expenses, salary disbursements.

### 13. Reports
- Aggregated reports across leads, projects, revenue, and employee performance with charts.

### 14. Employee Report Page
- Per-employee performance deep-dive (Admin/Manager only).
- Shows: total projects worked on, tasks completed vs pending, completion rate, deliverables handled, clients served, and full activity breakdown.

---

## 🏗️ Architecture

### State Management
- **Zustand stores** with `persist` middleware → all data lives in `localStorage`:
  - `crmStore.ts` — auth, employees, leads, customers, projects, attendance, salaries, financials.
  - `invoiceStore.ts` — invoices, deliverables, payment records, payment reminders.

### Data Layer
- `src/data/dummyData.ts` — realistic Indian seed data (employees, leads, customers, projects).
- `src/data/invoiceData.ts` — invoices, deliverables, and payment seed data.

### PDF Generation
- 100% client-side using `jspdf` + `jspdf-autotable`.
- Used in: Client Report (CustomersPage), Invoice export, Employee Report.

### Design System
- Tailwind CSS with HSL semantic tokens defined in `index.css` and `tailwind.config.ts`.
- shadcn/ui component library throughout.
- Framer Motion for page transitions and micro-interactions.

---

## 🛠️ Tech Stack

- **Framework**: React 18 + Vite 5 + TypeScript 5
- **Styling**: Tailwind CSS v3 + shadcn/ui
- **State**: Zustand (with persist)
- **Routing**: React Router v6
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Icons**: lucide-react
- **PDF**: jsPDF + jspdf-autotable

---

## 📂 Key Pages

| Route | Page | Roles |
|---|---|---|
| `/` | Login | All |
| `/dashboard` | Dashboard | All authenticated |
| `/employees` | Employees | Admin, Manager |
| `/leads` | Leads | Admin, Manager, Telecaller, Sales Executive |
| `/customers` | Customers + Profile + Report | Admin, Manager, Sales Executive, Customer |
| `/works` | Tasks | Admin, Manager, Employee |
| `/deliverables` | Kanban Deliverables | Admin, Manager, Employee |
| `/invoices` | Invoices | Admin, Manager, Accountant |
| `/payments` | Payments | Admin, Manager, Accountant |
| `/client-portal` | Client Portal | Admin, Manager, Customer |
| `/telecaller` | Telecaller Workspace | Admin, Manager, Telecaller |
| `/accounts` | Accounts | Admin, Accountant |
| `/reports` | Reports | Admin, Manager, Accountant |
| `/employee-report` | Per-Employee Report | Admin, Manager |

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

To connect a custom domain: **Project → Settings → Domains → Connect Domain**. [Docs](https://docs.lovable.dev/features/custom-domain#custom-domain).
