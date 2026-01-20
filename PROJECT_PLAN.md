# ElimuSmart System Architecture & Implementation Plan

## 1. System Architecture
**Backend Recommendation:** Node.js + Express (TypeScript).
*   **Why:** High throughput for concurrent student/parent logins, excellent support for asynchronous M-Pesa webhooks, and native TypeScript support to share types with the frontend.

**Database:** PostgreSQL.
*   **Why:** Strong relational integrity for complex grading systems (CBC), ACID compliance for financial transactions, and JSONB support for flexible metadata (e.g., specific CBC competency variations).

**Authentication:** JWT-based stateless auth with HttpOnly cookies.
*   **Roles:** Admin, Principal, Class Teacher, Subject Teacher, Student, Parent.

---

## 2. Database Schema (PostgreSQL)

```sql
-- Core Identity
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Academic Structure
CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL -- e.g., 'Grade 7', 'Grade 8'
);

CREATE TABLE streams (
    id SERIAL PRIMARY KEY,
    class_id INT REFERENCES classes(id),
    name VARCHAR(50) NOT NULL -- e.g., 'Oak', 'Eagle'
);

-- Students & Guardians
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    dob DATE NOT NULL,
    gender VARCHAR(10),
    stream_id INT REFERENCES streams(id),
    guardian_id UUID REFERENCES users(id),
    fee_balance DECIMAL(12,2) DEFAULT 0.00
);

-- CBC Grading & Marks
CREATE TABLE competencies (
    id SERIAL PRIMARY KEY,
    subject VARCHAR(100),
    description TEXT,
    grade_level INT
);

CREATE TABLE marks (
    id BIGSERIAL PRIMARY KEY,
    student_id UUID REFERENCES students(id),
    subject VARCHAR(100),
    score INT,
    term INT,
    year INT,
    cbc_grade VARCHAR(5), -- EE, ME, AE, BE
    ai_remarks TEXT
);

-- Finance
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id),
    amount DECIMAL(12,2) NOT NULL,
    method VARCHAR(50), -- M-PESA, BANK, CASH
    mpesa_receipt_number VARCHAR(50),
    transaction_date TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) -- PENDING, COMPLETED, FAILED
);
```

---

## 3. Kenya-Specific Integrations

### M-Pesa STK Push Flow
1.  **Initiate:** Frontend sends `phone` and `amount` to `/api/payments/mpesa/stk-push`.
2.  **Request:** Backend calls Daraja API `LNMO` (Lipa Na M-Pesa Online) endpoint.
3.  **Prompt:** User receives STK Push on phone, enters PIN.
4.  **Callback:** Safaricom sends result to `/api/payments/mpesa/webhook`.
5.  **Update:** Backend updates `payments` table and `student.fee_balance`.

### SMS (Africa's Talking)
*   **Absence Alerts:** Triggered by attendance module.
*   **Fee Reminders:** Bulk SMS to guardians with balances.
*   **Results:** Automatic SMS of mean grades after exams.

---

## 4. API Endpoints
*   `POST /api/auth/login` - Returns JWT.
*   `GET /api/students` - Filter by class/stream.
*   `POST /api/attendance/bulk` - Mark class presence.
*   `POST /api/payments/mpesa/stk` - Trigger STK Push.
*   `GET /api/reports/transcript/:studentId` - Generates PDF.

---

## 5. Phase 8 — Product Roadmap

### Phase 1: MVP (4–6 Weeks) - Foundations
*   **Authentication:** Multi-role JWT login (Admin/Principal/Teacher).
*   **Core Management:** Student & Staff CRUD operations, Photo uploads via camera/file.
*   **Attendance:** Daily roll-call UI with bulk marking features.
*   **Academic Engine:** Basic exam creation and mark entry with automated CBC grade mapping.
*   **PDF Transcripts:** Generation of printable report cards with basic AI remarks.
*   **SMS Integration:** Critical absence alerts sent via Africa's Talking.

### Phase 2: Engagement & Revenue (Week 7–12)
*   **M-Pesa Integration:** Full STK Push flow for fee payments and automated receipt generation.
*   **Financial Hub:** Fee structure management per class, debt tracking, and bank statement reconciliation.
*   **Parent Portal:** Secure web access for parents to view student marks, attendance, and fee balances.
*   **Notifications:** Multi-channel alerts (SMS + Email) for exam schedules and fee reminders.
*   **Audit Logs:** Tracking all critical actions for security and transparency.

### Phase 3: Analytics & Expansion (Month 4+)
*   **Mobile App:** Dedicated Android/iOS application for parents and teachers using React Native.
*   **AI Performance Analytics:** Using Gemini to predict student performance trends and suggest early interventions.
*   **Advanced CBC Tracking:** Longitudinal tracking of specific competencies from Grade 7 through JSS.
*   **School Operations:** Library management, inventory tracking, and automated timetable generation.
*   **Multi-School Management:** Capability for school groups/clusters to manage multiple campuses from one dashboard.

---

## 6. Implementation Deliverables (Detailed)

### Backend: Transcript Controller (Sample)
```typescript
import { Request, Response } from 'express';
import puppeteer from 'puppeteer'; // or pdfkit

export const getTranscript = async (req: Request, res: Response) => {
    const { studentId } = req.params;
    
    // 1. Fetch data from DB
    const student = await db.student.findUnique({ where: { id: studentId } });
    const marks = await db.marks.findMany({ where: { studentId } });

    // 2. Generate PDF (using Puppeteer for high fidelity)
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const htmlContent = renderToHtml(student, marks); // Internal helper
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    // 3. Set headers for Download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Transcript_${student.firstName}_${student.lastName}_2024.pdf`);
    res.send(pdfBuffer);
};
```

### Frontend: Download Logic
*   Triggered via `html2pdf.js` for local prototypes.
*   In production: `window.location.href = \`${API_URL}/reports/transcript/\${id}\`;` or using `fetch` + `blob()`.

---

## 7. Kenyan Context Adaptation

*   **CBC Grading:** 
    *   **EE (Exceeding Expectations):** 80%+
    *   **ME (Meeting Expectations):** 60-79%
    *   **AE (Approaching Expectations):** 40-59%
    *   **BE (Below Expectations):** 0-39%
*   **School Naming:** Support for public/private distinctions (e.g., "Kandisi Primary & Junior Secondary School").
*   **Curriculum:** JSS (Junior Secondary School) Grade 7, 8, 9 specific subjects (Integrated Science, Pre-Technical Studies).
