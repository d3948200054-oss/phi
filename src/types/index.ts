export type UserRole = 'teacher' | 'admin';

export interface PayoutDetails {
  upiId: string;
  accountName: string;
}

export interface SigningKeys {
  publicJwk: JsonWebKey;
  privateJwk?: JsonWebKey; // only present in unsealed state in memory
}

export interface Account {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  avatar?: string;
  passwordHash?: string; // used for PBKDF2 verification metadata
  vaultSalt?: string;    // hex
  vaultIv?: string;      // hex
  vaultCiphertext?: string; // encrypted blob holding privateJwk and sensitive profile
  subject: string;
  courses: string[];
  phone: string;
  qualification: string;
  yearsExperience: number;
  instituteId: string;
  createdAt: string;
  payout?: PayoutDetails;
  signingPublicKey?: JsonWebKey; // published public key
}

export interface Institute {
  id: string;
  name: string;
  inviteCode: string;
  settlementUpi: string;
  settlementAccountName: string;
  brandingLine: string;
  address: string;
  createdAt: string;
  courses: Array<{ id: string; name: string; code: string; subjects: string[] }>;
}

export interface Cohort {
  id: string;
  name: string;
  code: string;
  course: string;
  subject: string;
  startDate: string;
  endDate: string;
  teacherIds: string[];
  feePlanId?: string;
  createdAt: string;
}

export interface StudentFlag {
  id: string;
  date: string;
  reason: string;
  teacherName: string;
}

export interface Student {
  id: string;
  name: string;
  rollNo: string;
  phone: string;
  parentPhone: string;
  course: string;
  cohortId: string;
  enrolledAt: string;
  feePlanId?: string;
  paymentStatus: 'pending' | 'submitted' | 'verified' | 'overdue';
  flags: StudentFlag[];
  academicTags: string[];
}

export interface LectureChapter {
  start: number; // in seconds
  title: string;
}

export interface TranscriptLine {
  t: number; // in seconds
  text: string;
}

export interface Lecture {
  id: string;
  title: string;
  subject: string;
  course: string;
  teacherId: string;
  teacherName: string;
  status: 'draft' | 'extracting' | 'ready' | 'published' | 'archived';
  durationSeconds: number;
  chapters: LectureChapter[];
  transcript: TranscriptLine[];
  batchIds: string[];
  sizeBytes: number;
  publishedAt?: string;
  notes?: string;
}

export interface QuestionCheck {
  id: string;
  label: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
}

export type DiagramKind = 'fbd' | 'graph' | 'wave' | 'circuit' | 'geometry' | 'lens' | 'none';

export interface QuestionDiagram {
  kind: DiagramKind;
  imageDataUrl?: string;
  svg?: string;
  caption?: string;
}

export interface QuestionDraft {
  id: string;
  questionText: string;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options: string[];
  correctOptionIndex: number; // 0-based (-1 if unassigned)
  marks: number;
  negativeMarks: number;
  solutionExplanation: string;
  hint?: string;
  diagram?: QuestionDiagram;
  confidence: number; // 0 - 100
  checks: QuestionCheck[];
  reviewStatus: 'pending' | 'approved' | 'corrected' | 'rejected';
  sourceTimestampSeconds?: number;
  createdAt: string;
}

export interface Test {
  id: string;
  title: string;
  course: string;
  cohortId?: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  negativeMarking: boolean;
  questions: QuestionDraft[];
  publishedAt?: string;
  isLive: boolean;
  creatorId: string;
  creatorName: string;
  subject: string;
}

export interface Series {
  id: string;
  name: string;
  description: string;
  course: string;
  cohortId?: string;
  testIds: string[];
  isPublished: boolean;
  creatorId: string;
  creatorName: string;
  createdAt: string;
}

export interface AttemptResponse {
  questionIndex: number;
  selectedOptionIndex: number | null;
  timeSpentSeconds: number;
  markedForReview: boolean;
}

export interface ProctorFlag {
  timestamp: string;
  type: string;
  detail: string;
}

export interface SubjectAccuracy {
  correct: number;
  total: number;
  percent: number;
}

export interface Attempt {
  id: string;
  testId: string;
  testTitle: string;
  studentId: string;
  studentName: string;
  studentRoll: string;
  responses: AttemptResponse[];
  score: number;
  percent: number;
  percentile?: number;
  subjectAccuracy: Record<string, SubjectAccuracy>;
  timeSpentSeconds: number;
  proctorFlags: ProctorFlag[];
  screenTimeSnapshotId?: string;
  completedAt: string;
}

export interface FeePlan {
  id: string;
  course: string;
  cohortId?: string;
  cohortName?: string;
  amount: number;
  currency: string;
  durationMonths: number;
  payeeId: string;
  payeeName: string;
  payeeUpi: string;
  isActive: boolean;
  createdAt: string;
}

export interface Payment {
  id: string;
  payerStudentId: string;
  payerName: string;
  payerPhone: string;
  payeeId: string;
  payeeName: string;
  payeeUpi: string;
  feePlanId: string;
  course: string;
  cohortId?: string;
  cohortName?: string;
  amount: number;
  currency: string;
  reference: string;
  humanReference: string;
  status: 'submitted' | 'verified' | 'rejected' | 'refunded';
  createdAt: string;
  verifiedAt?: string;
  receiptSignature?: string;
  receiptSignedAt?: string;
  rejectionReason?: string;
  paymentProofUrl?: string; // Optional screenshot or transaction receipt
  bankPayerName?: string;   // Optional bank account name on payment statement
  verificationNote?: string; // Optional notes added during verification
}

export type ProctorSignal =
  | 'studying'
  | 'reading'
  | 'writing'
  | 'scrolling_reels'
  | 'on_call'
  | 'away_from_camera'
  | 'multiple_people'
  | 'phone_in_hand'
  | 'looking_away';

export interface ProctorSample {
  t: number;
  signal: ProctorSignal;
  confidence: number;
  faceVisible: boolean;
  faceCount: number;
  motionEnergy: number;
  verticalBias: number;
  speechLevel: number;
  brightness: number;
}

export interface SeatHistoryEntry {
  studentName: string;
  studentRoll: string;
  checkIn: string;
  checkOut?: string;
}

export interface SeatRecord {
  seatNumber: number;
  label: string;
  isOccupied: boolean;
  currentStudentId?: string;
  currentStudentName?: string;
  currentStudentRoll?: string;
  checkInTime?: string;
  history: SeatHistoryEntry[];
}

export interface ScreenTimeApp {
  appName: string;
  minutes: number;
  category: 'Productive' | 'Distraction/Reels' | 'Social Media' | 'Entertainment' | 'Education' | 'Utility';
}

export interface ScreenTimeRecord {
  id: string;
  timestamp: string;
  studentId?: string;
  studentName?: string;
  durationMinutes: number;
  apps: ScreenTimeApp[];
  consentGiven: boolean;
}

export interface DoubtSolution {
  finalAnswer: string;
  steps: string[];
  concept: string;
  workedExample: string;
  commonMistake: string;
}

export interface DoubtQuery {
  id: string;
  questionText: string;
  image?: string;
  teacherId: string;
  studentName?: string;
  subject: string;
  status: 'solved' | 'pending';
  solution?: DoubtSolution;
  createdAt: string;
}

export interface Notice {
  id: string;
  title: string;
  body: string;
  audience: 'all_teachers' | 'cohort' | 'students';
  targetCohortId?: string;
  priority: 'normal' | 'urgent';
  createdBy: string;
  createdByName: string;
  createdAt: string;
  expiresAt?: string;
}

export interface MentoringMessage {
  id: string;
  senderRole: 'teacher' | 'student';
  senderName: string;
  text: string;
  time: string;
}

export interface MentoringSlot {
  id: string;
  teacherId: string;
  teacherName: string;
  cohortId: string;
  cohortName: string;
  topic: string;
  date: string;
  time: string;
  durationMinutes: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  messages: MentoringMessage[];
}

export interface LibraryItem {
  id: string;
  title: string;
  subject: string;
  type: 'pdf' | 'book' | 'notes' | 'ppt' | 'sheet';
  chapters: string[];
  sizeBytes: number;
  downloadCount: number;
  uploadedAt: string;
  fileData?: string;
}

export interface AISettings {
  apiKey: string;
  baseUrl: string;
  chatModel: string;
  visionModel: string;
  transcriptionModel: string;
}

export type TabId =
  | 'dashboard'
  | 'lectures'
  | 'review-desk'
  | 'exam-builder'
  | 'test-series'
  | 'question-bank'
  | 'sessions'
  | 'proctoring'
  | 'screen-time'
  | 'cohorts'
  | 'students-reports'
  | 'analytics'
  | 'fees-payouts'
  | 'doubt-desk'
  | 'mentoring'
  | 'library'
  | 'daily-warmup'
  | 'notices'
  | 'admin';

export interface TabConfig {
  id: TabId;
  label: string;
  roles: UserRole[];
  section: 'main' | 'academic' | 'supervision' | 'operations' | 'admin';
}

export interface DailyWarmup {
  date: string;
  teacherId: string;
  questions: QuestionDraft[];
  completed: boolean;
  streak: number;
}

