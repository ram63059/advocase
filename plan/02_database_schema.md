# Stage 2: Database Schema (Prisma)

## Goal
Define the complete Prisma schema for all 17 data models with proper relations, indexes, and constraints. Then run the initial migration to create all tables in Supabase PostgreSQL.

---

## Complete `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ─────────────────────────────────────────────────────────
// MODEL 1: Profile (standalone user account — NextAuth)
// id = generated UUID, email + passwordHash stored here
// Created via POST /api/auth/register on signup
// ─────────────────────────────────────────────────────────
model Profile {
  id              String    @id @default(uuid())
  email           String    @unique
  passwordHash    String?   @map("password_hash")
  resetToken      String?   @map("reset_token")
  resetTokenExpiry DateTime? @map("reset_token_expiry")
  fullName        String?   @map("full_name")
  officeName      String?   @map("office_name")
  officeAddress   String?   @map("office_address")
  mobile          String?
  logoUrl         String?   @map("logo_url")
  qrCodeUrl       String?   @map("qr_code_url")
  bankName        String?   @map("bank_name")
  bankAccountName String?   @map("bank_account_name")
  bankIfsc        String?   @map("bank_ifsc")
  bankAccountNo   String?   @map("bank_account_no")
  upiId           String?   @map("upi_id")
  plan            String    @default("free")
  planExpiresAt   DateTime? @map("plan_expires_at")
  createdAt       DateTime  @default(now()) @map("created_at")

  // Relations
  cases            Case[]
  clients          Client[]
  tasks            Task[]
  reminders        Reminder[]
  customFields     CustomField[]
  colorCodes       ColorCode[]
  courtsRegistered CourtRegistered[]
  ownedTeam        TeamMember[]      @relation("TeamOwner")
  fees             Fee[]
  caseNotes        CaseNote[]
  caseDocuments    CaseDocument[]

  @@map("profiles")
}

// ─────────────────────────────────────────────────────────
// MODEL 2: TeamMember
// Associates/partners under a principal advocate
// ─────────────────────────────────────────────────────────
model TeamMember {
  id          String    @id @default(uuid())
  ownerId     String    @map("owner_id")
  email       String
  fullName    String    @map("full_name")
  mobile      String?
  role        String    @default("associate")
  canAddCase  Boolean   @default(true)  @map("can_add_case")
  canEditCase Boolean   @default(true)  @map("can_edit_case")
  canViewCase Boolean   @default(true)  @map("can_view_case")
  canViewFees Boolean   @default(false) @map("can_view_fees")
  isActive    Boolean   @default(true)  @map("is_active")
  invitedAt   DateTime  @default(now()) @map("invited_at")
  joinedAt    DateTime? @map("joined_at")
  userId      String?   @map("user_id")

  owner       Profile   @relation("TeamOwner", fields: [ownerId], references: [id], onDelete: Cascade)

  @@map("team_members")
}

// ─────────────────────────────────────────────────────────
// MODEL 3: CourtRegistered
// Courts where advocate is registered for auto-sync
// ─────────────────────────────────────────────────────────
model CourtRegistered {
  id            String    @id @default(uuid())
  profileId     String    @map("profile_id")
  courtType     String    @map("court_type")
  state         String?
  district      String?
  courtComplex  String?   @map("court_complex")
  establishment String?
  advocateName  String?   @map("advocate_name")
  stateCode     String?   @map("state_code")
  barCode       String?   @map("bar_code")
  year          String?
  lastSyncedAt  DateTime? @map("last_synced_at")
  syncStatus    String    @default("pending") @map("sync_status")
  createdAt     DateTime  @default(now()) @map("created_at")

  profile       Profile   @relation(fields: [profileId], references: [id], onDelete: Cascade)

  @@map("courts_registered")
}

// ─────────────────────────────────────────────────────────
// MODEL 4: Case (Core table)
// ─────────────────────────────────────────────────────────
model Case {
  id            String    @id @default(uuid())
  profileId     String    @map("profile_id")

  // Identifiers
  caseNumber    String?   @map("case_number")
  cnrNumber     String?   @map("cnr_number")
  referenceNo   String?   @map("reference_no")
  fileNo        String?   @map("file_no")
  fileName      String?   @map("file_name")
  year          Int?

  // Court info
  courtType     String?   @map("court_type")
  courtName     String?   @map("court_name")
  courtNo       String?   @map("court_no")
  state         String?
  district      String?

  // Parties
  firstParty    String?   @map("first_party")
  oppositeParty String?   @map("opposite_party")

  // Case details
  caseType      String?   @map("case_type")
  underSection  String?   @map("under_section")
  policeStation String?   @map("police_station")
  firNumber     String?   @map("fir_number")
  judgeName     String?   @map("judge_name")
  company       String?
  empanelment   String?
  comments      String?

  // Dates
  filingDate    DateTime? @map("filing_date")
  previousDate  DateTime? @map("previous_date")
  nextDate      DateTime? @map("next_date")
  fixedFor      String?   @map("fixed_for")

  // Status
  status        String    @default("running")
  isImportant   Boolean   @default(false) @map("is_important")

  // eCourts sync
  ecourtsData   Json?     @map("ecourts_data")
  lastSyncedAt  DateTime? @map("last_synced_at")

  // Notes
  briefFacts    String?   @map("brief_facts")
  relevantLaws  String?   @map("relevant_laws")

  // Metadata
  createdBy     String?   @map("created_by")
  assignedTo    String?   @map("assigned_to")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  // Relations
  profile       Profile        @relation(fields: [profileId], references: [id], onDelete: Cascade)
  history       CaseHistory[]
  orders        CaseOrder[]
  notes         CaseNote[]
  documents     CaseDocument[]
  clients       CaseClient[]
  oppositeCouns OpposeCounsel[]
  fees          Fee[]
  tasks         Task[]
  reminders     Reminder[]
  linkedFrom    LinkedCase[]   @relation("LinkedFrom")
  linkedTo      LinkedCase[]   @relation("LinkedTo")

  @@index([profileId])
  @@index([nextDate])
  @@index([status])
  @@index([cnrNumber])
  @@index([profileId, nextDate])
  @@index([profileId, status])
  @@map("cases")
}

// ─────────────────────────────────────────────────────────
// MODEL 5: CaseHistory (from eCourts sync)
// ─────────────────────────────────────────────────────────
model CaseHistory {
  id             String    @id @default(uuid())
  caseId         String    @map("case_id")
  judge          String?
  businessOnDate DateTime? @map("business_on_date")
  hearingDate    DateTime? @map("hearing_date")
  purpose        String?
  createdAt      DateTime  @default(now()) @map("created_at")

  case           Case      @relation(fields: [caseId], references: [id], onDelete: Cascade)

  @@index([caseId])
  @@map("case_history")
}

// ─────────────────────────────────────────────────────────
// MODEL 6: CaseOrder (interim orders / judgements)
// ─────────────────────────────────────────────────────────
model CaseOrder {
  id          String    @id @default(uuid())
  caseId      String    @map("case_id")
  orderType   String?   @map("order_type")
  orderDate   DateTime? @map("order_date")
  orderUrl    String?   @map("order_url")
  description String?
  createdAt   DateTime  @default(now()) @map("created_at")

  case        Case      @relation(fields: [caseId], references: [id], onDelete: Cascade)

  @@index([caseId])
  @@map("case_orders")
}

// ─────────────────────────────────────────────────────────
// MODEL 7: CaseNote
// ─────────────────────────────────────────────────────────
model CaseNote {
  id        String    @id @default(uuid())
  caseId    String    @map("case_id")
  profileId String    @map("profile_id")
  addedBy   String?   @map("added_by")
  noteDate  DateTime? @map("note_date")
  purpose   String?
  noteText  String    @map("note_text")
  createdAt DateTime  @default(now()) @map("created_at")

  case      Case      @relation(fields: [caseId], references: [id], onDelete: Cascade)
  profile   Profile   @relation(fields: [profileId], references: [id])

  @@index([caseId])
  @@map("case_notes")
}

// ─────────────────────────────────────────────────────────
// MODEL 8: CaseDocument
// File metadata (actual files in Supabase Storage)
// ─────────────────────────────────────────────────────────
model CaseDocument {
  id         String   @id @default(uuid())
  caseId     String   @map("case_id")
  profileId  String   @map("profile_id")
  fileName   String   @map("file_name")
  fileUrl    String   @map("file_url")
  fileSize   Int?     @map("file_size")
  fileType   String?  @map("file_type")
  uploadedBy String?  @map("uploaded_by")
  createdAt  DateTime @default(now()) @map("created_at")

  case       Case     @relation(fields: [caseId], references: [id], onDelete: Cascade)
  profile    Profile  @relation(fields: [profileId], references: [id])

  @@index([caseId])
  @@map("case_documents")
}

// ─────────────────────────────────────────────────────────
// MODEL 9: LinkedCase (self-join many-to-many)
// ─────────────────────────────────────────────────────────
model LinkedCase {
  id           String   @id @default(uuid())
  caseId       String   @map("case_id")
  linkedCaseId String   @map("linked_case_id")
  createdAt    DateTime @default(now()) @map("created_at")

  case         Case     @relation("LinkedFrom", fields: [caseId], references: [id], onDelete: Cascade)
  linkedCase   Case     @relation("LinkedTo", fields: [linkedCaseId], references: [id], onDelete: Cascade)

  @@unique([caseId, linkedCaseId])
  @@map("linked_cases")
}

// ─────────────────────────────────────────────────────────
// MODEL 10: Client
// ─────────────────────────────────────────────────────────
model Client {
  id            String    @id @default(uuid())
  profileId     String    @map("profile_id")
  fullName      String    @map("full_name")
  email         String?
  mobile        String?
  address       String?
  dpdpConsent   Boolean   @default(false) @map("dpdp_consent")
  dpdpConsentAt DateTime? @map("dpdp_consent_at")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  profile       Profile    @relation(fields: [profileId], references: [id], onDelete: Cascade)
  cases         CaseClient[]
  fees          Fee[]
  tasks         Task[]
  reminders     Reminder[]

  @@index([profileId])
  @@map("clients")
}

// ─────────────────────────────────────────────────────────
// MODEL 11: CaseClient (many-to-many: Case <-> Client)
// ─────────────────────────────────────────────────────────
model CaseClient {
  id       String @id @default(uuid())
  caseId   String @map("case_id")
  clientId String @map("client_id")

  case     Case   @relation(fields: [caseId], references: [id], onDelete: Cascade)
  client   Client @relation(fields: [clientId], references: [id], onDelete: Cascade)

  @@unique([caseId, clientId])
  @@map("case_clients")
}

// ─────────────────────────────────────────────────────────
// MODEL 12: OpposeCounsel
// ─────────────────────────────────────────────────────────
model OpposeCounsel {
  id        String   @id @default(uuid())
  caseId    String   @map("case_id")
  fullName  String?  @map("full_name")
  mobile    String?
  email     String?
  address   String?
  createdAt DateTime @default(now()) @map("created_at")

  case      Case     @relation(fields: [caseId], references: [id], onDelete: Cascade)

  @@map("opposite_counsels")
}

// ─────────────────────────────────────────────────────────
// MODEL 13: Fee (case-level fee ledger)
// ─────────────────────────────────────────────────────────
model Fee {
  id               String    @id @default(uuid())
  caseId           String    @map("case_id")
  profileId        String    @map("profile_id")
  clientId         String?   @map("client_id")
  paymentMode      String?   @map("payment_mode")
  amount           Decimal   @db.Decimal(12, 2)
  description      String?
  feeDate          DateTime? @map("fee_date")
  isExpense        Boolean   @default(false) @map("is_expense")
  invoiceGenerated Boolean   @default(false) @map("invoice_generated")
  createdAt        DateTime  @default(now()) @map("created_at")

  case             Case      @relation(fields: [caseId], references: [id], onDelete: Cascade)
  profile          Profile   @relation(fields: [profileId], references: [id])
  client           Client?   @relation(fields: [clientId], references: [id])

  @@index([caseId])
  @@index([profileId])
  @@map("fees")
}

// ─────────────────────────────────────────────────────────
// MODEL 14: Task
// ─────────────────────────────────────────────────────────
model Task {
  id          String    @id @default(uuid())
  profileId   String    @map("profile_id")
  title       String
  description String?
  priority    String    @default("medium")
  status      String    @default("pending")
  dueDate     DateTime? @map("due_date")
  assignedTo  String?   @map("assigned_to")
  caseId      String?   @map("case_id")
  clientId    String?   @map("client_id")
  createdBy   String?   @map("created_by")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  profile     Profile   @relation(fields: [profileId], references: [id], onDelete: Cascade)
  case        Case?     @relation(fields: [caseId], references: [id])
  client      Client?   @relation(fields: [clientId], references: [id])

  @@index([profileId])
  @@index([status])
  @@map("tasks")
}

// ─────────────────────────────────────────────────────────
// MODEL 15: Reminder
// ─────────────────────────────────────────────────────────
model Reminder {
  id           String    @id @default(uuid())
  profileId    String    @map("profile_id")
  title        String
  frequency    String?
  startDate    DateTime? @map("start_date")
  endDate      DateTime? @map("end_date")
  reminderTime String?   @map("reminder_time")
  dayOfWeek    String?   @map("day_of_week")
  sendEmail    Boolean   @default(true)  @map("send_email")
  emailTo      String?   @map("email_to")
  sendSms      Boolean   @default(false) @map("send_sms")
  mobileTo     String?   @map("mobile_to")
  caseId       String?   @map("case_id")
  clientId     String?   @map("client_id")
  isActive     Boolean   @default(true) @map("is_active")
  createdAt    DateTime  @default(now()) @map("created_at")

  profile      Profile   @relation(fields: [profileId], references: [id], onDelete: Cascade)
  case         Case?     @relation(fields: [caseId], references: [id])
  client       Client?   @relation(fields: [clientId], references: [id])

  @@index([profileId])
  @@map("reminders")
}

// ─────────────────────────────────────────────────────────
// MODEL 16: CustomField (dropdown values managed by user)
// ─────────────────────────────────────────────────────────
model CustomField {
  id        String   @id @default(uuid())
  profileId String   @map("profile_id")
  fieldType String   @map("field_type")
  value     String
  sortOrder Int      @default(0) @map("sort_order")
  createdAt DateTime @default(now()) @map("created_at")

  profile   Profile  @relation(fields: [profileId], references: [id], onDelete: Cascade)

  @@unique([profileId, fieldType, value])
  @@index([profileId, fieldType])
  @@map("custom_fields")
}

// ─────────────────────────────────────────────────────────
// MODEL 17: ColorCode (calendar coloring by Fixed For label)
// ─────────────────────────────────────────────────────────
model ColorCode {
  id        String   @id @default(uuid())
  profileId String   @map("profile_id")
  label     String
  color     String
  createdAt DateTime @default(now()) @map("created_at")

  profile   Profile  @relation(fields: [profileId], references: [id], onDelete: Cascade)

  @@unique([profileId, label])
  @@map("color_codes")
}
```

---

## User Registration (NextAuth — no trigger needed)

Profiles are created directly via `POST /api/auth/register` (see Stage 3).
No Supabase Auth trigger required. The `id` is a UUID generated by Prisma.

---

## Row Level Security (RLS) Policies

Run in Supabase SQL Editor after migration:

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE courts_registered ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE color_codes ENABLE ROW LEVEL SECURITY;

-- Profile: users see only their own
CREATE POLICY "own_profile" ON profiles
  FOR ALL USING (id = auth.uid());

-- Cases: owner + active team members of owner
CREATE POLICY "own_cases" ON cases
  FOR ALL USING (
    profile_id = auth.uid()
    OR profile_id IN (
      SELECT owner_id FROM team_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Clients: same pattern as cases
CREATE POLICY "own_clients" ON clients
  FOR ALL USING (
    profile_id = auth.uid()
    OR profile_id IN (
      SELECT owner_id FROM team_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Tasks, Reminders, Fees: same pattern
CREATE POLICY "own_tasks" ON tasks
  FOR ALL USING (profile_id = auth.uid() OR profile_id IN (
    SELECT owner_id FROM team_members WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "own_fees" ON fees
  FOR ALL USING (profile_id = auth.uid() OR profile_id IN (
    SELECT owner_id FROM team_members WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "own_reminders" ON reminders
  FOR ALL USING (profile_id = auth.uid() OR profile_id IN (
    SELECT owner_id FROM team_members WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "own_notes" ON case_notes
  FOR ALL USING (profile_id = auth.uid() OR profile_id IN (
    SELECT owner_id FROM team_members WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "own_documents" ON case_documents
  FOR ALL USING (profile_id = auth.uid() OR profile_id IN (
    SELECT owner_id FROM team_members WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "own_team" ON team_members
  FOR ALL USING (owner_id = auth.uid() OR user_id = auth.uid());

CREATE POLICY "own_courts" ON courts_registered
  FOR ALL USING (profile_id = auth.uid());

CREATE POLICY "own_custom_fields" ON custom_fields
  FOR ALL USING (profile_id = auth.uid() OR profile_id IN (
    SELECT owner_id FROM team_members WHERE user_id = auth.uid() AND is_active = true
  ));

CREATE POLICY "own_color_codes" ON color_codes
  FOR ALL USING (profile_id = auth.uid() OR profile_id IN (
    SELECT owner_id FROM team_members WHERE user_id = auth.uid() AND is_active = true
  ));
```

---

## Supabase Storage Buckets (Run in Supabase Dashboard)

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('case-documents', 'case-documents', false),
  ('profile-assets', 'profile-assets', false);

-- RLS on storage
CREATE POLICY "Authenticated users can upload case documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'case-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users can access their own case documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'case-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## Migration Commands

```bash
# After completing prisma/schema.prisma:
npx prisma generate                        # Regenerate client types
npx prisma migrate dev --name init         # Create and apply migration
npx prisma migrate dev --name add_indexes  # After adding indexes

# To inspect DB:
npx prisma studio                          # Opens browser-based DB viewer

# To reset (development only):
npx prisma migrate reset
```

---

## Key Prisma Query Patterns

### Get cases for dashboard stats (use in Server Component)
```typescript
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, addDays } from 'date-fns'

const today = new Date()
const tomorrow = addDays(today, 1)

const [total, todayCount, tomorrowCount, awaited, decided] = await Promise.all([
  prisma.case.count({ where: { profileId, status: 'running' } }),
  prisma.case.count({ where: { profileId, nextDate: {
    gte: startOfDay(today), lte: endOfDay(today)
  }}}),
  prisma.case.count({ where: { profileId, nextDate: {
    gte: startOfDay(tomorrow), lte: endOfDay(tomorrow)
  }}}),
  prisma.case.count({ where: { profileId, nextDate: null, status: 'running' } }),
  prisma.case.count({ where: { profileId, status: 'decided' } }),
])
```

### Get cases list with filters
```typescript
const cases = await prisma.case.findMany({
  where: {
    profileId,
    ...(filters.status && { status: filters.status }),
    ...(filters.search && {
      OR: [
        { caseNumber: { contains: filters.search, mode: 'insensitive' } },
        { firstParty: { contains: filters.search, mode: 'insensitive' } },
        { oppositeParty: { contains: filters.search, mode: 'insensitive' } },
        { cnrNumber: { contains: filters.search, mode: 'insensitive' } },
      ]
    }),
    ...(filters.nextDateFrom && { nextDate: { gte: filters.nextDateFrom } }),
    ...(filters.nextDateTo && { nextDate: { lte: filters.nextDateTo } }),
  },
  include: {
    clients: { include: { client: true } },
  },
  orderBy: { nextDate: 'asc' },
  skip: (page - 1) * limit,
  take: limit,
})
```

### Get case detail with all relations
```typescript
const caseDetail = await prisma.case.findUnique({
  where: { id: caseId },
  include: {
    history: { orderBy: { hearingDate: 'desc' } },
    orders: { orderBy: { orderDate: 'desc' } },
    notes: { orderBy: { createdAt: 'desc' } },
    documents: { orderBy: { createdAt: 'desc' } },
    clients: { include: { client: true } },
    oppositeCouns: true,
    fees: { orderBy: { feeDate: 'desc' } },
    reminders: { where: { isActive: true } },
    linkedFrom: { include: { linkedCase: true } },
    linkedTo: { include: { case: true } },
  }
})
```

---

## Verification Checklist
- [ ] `npx prisma generate` runs without errors
- [ ] `npx prisma migrate dev --name init` creates all 17 tables
- [ ] `npx prisma studio` shows all tables with correct columns
- [ ] Auth trigger creates profile row on new Supabase Auth signup
- [ ] RLS policies are applied in Supabase Dashboard
- [ ] Storage buckets created with correct policies
- [ ] All relations show correct foreign keys in DB
