import {
  Account,
  Cohort,
  FeePlan,
  Institute,
  Lecture,
  LibraryItem,
  Notice,
  QuestionDraft,
  Student
} from '../types';
import { runQuestionChecks } from '../utils/questionChecks';

export const SEED_INSTITUTE: Institute = {
  id: 'inst_phi_01',
  name: 'Phi Coaching Institute',
  inviteCode: 'PHI-2026',
  settlementUpi: 'phi.coaching@icici',
  settlementAccountName: 'Phi Coaching Trust Educational Fund',
  brandingLine: 'Excellence & Precision Coaching for IIT-JEE & Medical Entrances',
  address: '12 Science Square, Knowledge Corridor, Mumbai 400001',
  createdAt: '2025-01-15T09:00:00Z',
  courses: [
    {
      id: 'c_jee_adv',
      name: 'JEE Advanced Elite',
      code: 'JEE-ADV',
      subjects: ['Physics', 'Chemistry', 'Mathematics']
    },
    {
      id: 'c_neet_prep',
      name: 'NEET Medical Pioneer',
      code: 'NEET-MED',
      subjects: ['Physics', 'Chemistry', 'Biology']
    }
  ]
};

// Seed accounts: 1 admin (owner), 1 teacher
export const SEED_ACCOUNTS: Account[] = [
  {
    id: 'acc_admin_owner',
    role: 'admin',
    name: 'Dr. Vikramaditya Sharma',
    email: 'admin@phi.edu',
    subject: 'Physics',
    courses: ['JEE Advanced Elite', 'NEET Medical Pioneer'],
    phone: '+91 98450 11223',
    qualification: 'Ph.D. Theoretical Physics (IIT Bombay)',
    yearsExperience: 22,
    instituteId: 'inst_phi_01',
    createdAt: '2025-01-15T09:00:00Z',
    payout: {
      upiId: 'phi.coaching@icici',
      accountName: 'Phi Coaching Trust'
    }
  },
  {
    id: 'acc_teacher_prof',
    role: 'teacher',
    name: 'Prof. Ananya Sen',
    email: 'ananya@phi.edu',
    subject: 'Physics',
    courses: ['JEE Advanced Elite'],
    phone: '+91 97312 88764',
    qualification: 'M.Tech Applied Optics (IISc Bengaluru)',
    yearsExperience: 9,
    instituteId: 'inst_phi_01',
    createdAt: '2025-02-01T10:30:00Z',
    payout: {
      upiId: 'ananya.sen@axisbank',
      accountName: 'Prof. Ananya Sen Faculty Settlement'
    }
  }
];

export const SEED_COHORTS: Cohort[] = [
  {
    id: 'coh_jee_alpha',
    name: 'Batch Alpha (JEE 2026)',
    code: 'ALPHA-26',
    course: 'JEE Advanced Elite',
    subject: 'Physics',
    startDate: '2025-04-01',
    endDate: '2026-05-30',
    teacherIds: ['acc_admin_owner', 'acc_teacher_prof'],
    feePlanId: 'plan_jee_annual',
    createdAt: '2025-03-01T10:00:00Z'
  },
  {
    id: 'coh_neet_phoenix',
    name: 'Batch Phoenix (NEET 2026)',
    code: 'PHOENIX-26',
    course: 'NEET Medical Pioneer',
    subject: 'Physics',
    startDate: '2025-04-15',
    endDate: '2026-05-15',
    teacherIds: ['acc_admin_owner'],
    feePlanId: 'plan_neet_annual',
    createdAt: '2025-03-05T11:00:00Z'
  }
];

export const SEED_STUDENTS: Student[] = [
  {
    id: 'stu_101',
    name: 'Aarav Narang',
    rollNo: '26-JEE-001',
    phone: '+91 98111 23456',
    parentPhone: '+91 98111 23450',
    course: 'JEE Advanced Elite',
    cohortId: 'coh_jee_alpha',
    enrolledAt: '2025-04-02',
    feePlanId: 'plan_jee_annual',
    paymentStatus: 'verified',
    flags: [],
    academicTags: ['Top Decile', 'Strong Mechanics']
  },
  {
    id: 'stu_102',
    name: 'Devika Krishnan',
    rollNo: '26-JEE-002',
    phone: '+91 98222 34567',
    parentPhone: '+91 98222 34560',
    course: 'JEE Advanced Elite',
    cohortId: 'coh_jee_alpha',
    enrolledAt: '2025-04-02',
    feePlanId: 'plan_jee_annual',
    paymentStatus: 'verified',
    flags: [],
    academicTags: ['Calculus Prodigy']
  },
  {
    id: 'stu_103',
    name: 'Rohan Deshmukh',
    rollNo: '26-JEE-003',
    phone: '+91 98333 45678',
    parentPhone: '+91 98333 45670',
    course: 'JEE Advanced Elite',
    cohortId: 'coh_jee_alpha',
    enrolledAt: '2025-04-03',
    feePlanId: 'plan_jee_annual',
    paymentStatus: 'submitted',
    flags: [{ id: 'flg_1', date: '2025-05-12', reason: 'Late homework submission on rotational dynamics', teacherName: 'Prof. Priya Sharma' }],
    academicTags: ['Needs Practice in Optics']
  },
  {
    id: 'stu_104',
    name: 'Pooja Venkatesh',
    rollNo: '26-JEE-004',
    phone: '+91 98444 56789',
    parentPhone: '+91 98444 56780',
    course: 'JEE Advanced Elite',
    cohortId: 'coh_jee_alpha',
    enrolledAt: '2025-04-04',
    feePlanId: 'plan_jee_annual',
    paymentStatus: 'pending',
    flags: [],
    academicTags: ['Consistent Attendance']
  },
  {
    id: 'stu_105',
    name: 'Siddharth Iyer',
    rollNo: '26-JEE-005',
    phone: '+91 98555 67890',
    parentPhone: '+91 98555 67891',
    course: 'JEE Advanced Elite',
    cohortId: 'coh_jee_alpha',
    enrolledAt: '2025-04-05',
    feePlanId: 'plan_jee_annual',
    paymentStatus: 'verified',
    flags: [],
    academicTags: ['Fast Solver']
  },
  {
    id: 'stu_106',
    name: 'Meera Chawla',
    rollNo: '26-NEET-001',
    phone: '+91 98666 78901',
    parentPhone: '+91 98666 78902',
    course: 'NEET Medical Pioneer',
    cohortId: 'coh_neet_phoenix',
    enrolledAt: '2025-04-16',
    feePlanId: 'plan_neet_annual',
    paymentStatus: 'verified',
    flags: [],
    academicTags: ['High Biology Aptitude']
  },
  {
    id: 'stu_107',
    name: 'Tanmay Kulkarni',
    rollNo: '26-NEET-002',
    phone: '+91 98777 89012',
    parentPhone: '+91 98777 89013',
    course: 'NEET Medical Pioneer',
    cohortId: 'coh_neet_phoenix',
    enrolledAt: '2025-04-17',
    feePlanId: 'plan_neet_annual',
    paymentStatus: 'overdue',
    flags: [{ id: 'flg_2', date: '2025-05-18', reason: 'Absent without leave during unit test 3', teacherName: 'Dr. Rajan Mehta' }],
    academicTags: ['Focus Support Needed']
  }
];

export const SEED_FEE_PLANS: FeePlan[] = [
  {
    id: 'plan_jee_annual',
    course: 'JEE Advanced Elite',
    cohortId: 'coh_jee_alpha',
    cohortName: 'Batch Alpha (JEE 2026)',
    amount: 145000,
    currency: 'INR',
    durationMonths: 12,
    payeeId: 'acc_admin_owner',
    payeeName: 'Dr. Vikramaditya Sharma (Phi Coaching Trust)',
    payeeUpi: 'phi.coaching@icici',
    isActive: true,
    createdAt: '2025-03-01T09:00:00Z'
  },
  {
    id: 'plan_neet_annual',
    course: 'NEET Medical Pioneer',
    cohortId: 'coh_neet_phoenix',
    cohortName: 'Batch Phoenix (NEET 2026)',
    amount: 135000,
    currency: 'INR',
    durationMonths: 12,
    payeeId: 'acc_admin_owner',
    payeeName: 'Dr. Vikramaditya Sharma (Phi Coaching Trust)',
    payeeUpi: 'phi.coaching@icici',
    isActive: true,
    createdAt: '2025-03-05T09:00:00Z'
  },
  {
    id: 'plan_physics_special',
    course: 'JEE Advanced Elite',
    cohortId: 'coh_jee_alpha',
    cohortName: 'Batch Alpha (JEE 2026)',
    amount: 35000,
    currency: 'INR',
    durationMonths: 4,
    payeeId: 'acc_teacher_prof',
    payeeName: 'Prof. Ananya Sen Faculty Settlement',
    payeeUpi: 'ananya.sen@axisbank',
    isActive: true,
    createdAt: '2025-04-01T10:00:00Z'
  }
];

export const SEED_LECTURES: Lecture[] = [
  {
    id: 'lec_rotational_dynamics',
    title: 'Rotational Dynamics & Moment of Inertia of Complex Symmetrical Bodies',
    subject: 'Physics',
    course: 'JEE Advanced Elite',
    teacherId: 'acc_teacher_prof',
    teacherName: 'Prof. Priya Sharma',
    status: 'published',
    durationSeconds: 3840,
    chapters: [
      { start: 0, title: 'Introduction & Parallel Axis Theorem Recap' },
      { start: 680, title: 'Moment of Inertia of Truncated Cones & Hollow Cylinders' },
      { start: 1620, title: 'Pure Rolling on Inclined Surfaces without Slipping' },
      { start: 2750, title: 'Angular Momentum Conservation in Collision Problems' },
      { start: 3400, title: 'Summary & JEE Advanced 2024 Problem Dissection' }
    ],
    transcript: [
      { t: 0, text: '[00:00] Good morning class. Today we resolve the most intricate domain of rigid body mechanics: rotational dynamics.' },
      { t: 45, text: '[00:45] Notice that in pure rolling, the instantaneous point of contact with the ground possesses zero linear velocity.' },
      { t: 680, text: '[11:20] Now consider the parallel axis theorem: I = I_cm + M * d^2. Remember that d is strictly measured from the center of mass, never an arbitrary point.' },
      { t: 1620, text: '[27:00] For a solid cylinder rolling down an incline of angle theta, acceleration a_cm equals (g sin theta) / (1 + I_cm / (M R^2)). For a solid cylinder, I_cm / MR^2 is 1/2, so acceleration is 2/3 g sin theta.' },
      { t: 2750, text: '[45:50] When a projectile strikes a pivoted rod, linear momentum is not conserved due to the hinge force at pivot O, but angular momentum about pivot O is strictly conserved.' }
    ],
    batchIds: ['coh_jee_alpha'],
    sizeBytes: 312000000,
    publishedAt: '2025-04-20T11:00:00Z',
    notes: 'Assign Practice Sheet 04 on rolling constraints before the Wednesday test.'
  },
  {
    id: 'lec_wave_optics',
    title: 'Wave Optics: Young\'s Double Slit Experiment & Thin Film Interference',
    subject: 'Physics',
    course: 'JEE Advanced Elite',
    teacherId: 'acc_teacher_prof',
    teacherName: 'Prof. Priya Sharma',
    status: 'ready',
    durationSeconds: 3150,
    chapters: [
      { start: 0, title: 'Huygens\' Principle and Wavefront Construction' },
      { start: 720, title: 'YDSE Path Difference & Fringe Width Derivation' },
      { start: 1950, title: 'Introduction of a Thin Mica Sheet in One Beam' }
    ],
    transcript: [
      { t: 0, text: '[00:00] We begin wave optics by questioning ray approximations when apertures approach the wavelength of light.' },
      { t: 720, text: '[12:00] In YDSE with slit separation d and screen distance D, the fringe width beta = lambda * D / d.' },
      { t: 1950, text: '[32:30] Introducing a transparent sheet of refractive index mu and thickness t introduces an optical path difference of (mu - 1) * t.' }
    ],
    batchIds: ['coh_jee_alpha'],
    sizeBytes: 245000000,
    publishedAt: '2025-05-02T15:00:00Z',
    notes: 'Crucial for JEE wave optics conceptual mastery.'
  }
];

export function createInitialSeedQuestions(): QuestionDraft[] {
  const q1: QuestionDraft = {
    id: 'q_seed_01',
    questionText: 'A solid uniform cylinder of mass M and radius R rolls without slipping down an inclined plane of inclination angle θ. What is the linear acceleration of its center of mass?',
    subject: 'Physics',
    topic: 'Mechanics',
    difficulty: 'medium',
    options: [
      '(2/3) g sin θ',
      '(1/2) g sin θ',
      '(3/4) g sin θ',
      'g sin θ'
    ],
    correctOptionIndex: 0,
    marks: 4,
    negativeMarks: 1,
    solutionExplanation: 'For rolling without slipping: a = g sin θ / (1 + I_cm / (M R^2)). Since I_cm for a solid cylinder is (1/2) M R^2, the denominator is 1 + 1/2 = 3/2. Thus a = (2/3) g sin θ.',
    diagram: { kind: 'fbd' },
    confidence: 96,
    checks: [],
    reviewStatus: 'approved',
    sourceTimestampSeconds: 1620,
    createdAt: '2025-04-21T08:00:00Z'
  };
  q1.checks = runQuestionChecks(q1);

  const q2: QuestionDraft = {
    id: 'q_seed_02',
    questionText: 'In Young\'s double slit experiment, if a thin transparent glass sheet of refractive index μ and thickness t is placed in front of one of the slits, by what distance does the central fringe shift on the screen (slit separation d, screen distance D)?',
    subject: 'Physics',
    topic: 'Optics',
    difficulty: 'medium',
    options: [
      'D/d * (μ - 1) t',
      'd/D * (μ - 1) t',
      'D/d * μ t',
      '2D/d * (μ - 1) t'
    ],
    correctOptionIndex: 0,
    marks: 4,
    negativeMarks: 1,
    solutionExplanation: 'Additional optical path introduced by the sheet is Δx = (μ - 1)t. Path difference on screen is d * y / D. Equating d * y / D = (μ - 1)t yields y_shift = (D / d) * (μ - 1) t.',
    diagram: { kind: 'wave' },
    confidence: 94,
    checks: [],
    reviewStatus: 'approved',
    sourceTimestampSeconds: 1950,
    createdAt: '2025-05-03T09:00:00Z'
  };
  q2.checks = runQuestionChecks(q2);

  const q3: QuestionDraft = {
    id: 'q_seed_03',
    questionText: 'Three capacitors of capacitance 3 μF, 6 μF, and 12 μF are connected in series across a 220V DC supply as shown in the circuit diagram. What is the total equivalent capacitance of this combination?',
    subject: 'Physics',
    topic: 'Electrodynamics',
    difficulty: 'easy',
    options: [
      '1.71 μF',
      '21 μF',
      '4.5 μF',
      '7 μF'
    ],
    correctOptionIndex: 0,
    marks: 4,
    negativeMarks: 1,
    solutionExplanation: 'For series configuration: 1/C_eq = 1/3 + 1/6 + 1/12 = (4 + 2 + 1)/12 = 7/12 μF⁻¹. Therefore C_eq = 12/7 ≈ 1.714 μF.',
    diagram: { kind: 'circuit' },
    confidence: 98,
    checks: [],
    reviewStatus: 'approved',
    createdAt: '2025-05-04T10:00:00Z'
  };
  q3.checks = runQuestionChecks(q3);

  // A question that deliberately demonstrates a check warning / need for review
  const q4: QuestionDraft = {
    id: 'q_seed_04',
    questionText: 'State the consequence of Lenz\'s law in electromagnetic induction for an approaching bar magnet.',
    subject: 'Physics',
    topic: 'Electrodynamics',
    difficulty: 'easy',
    options: [
      'The induced current produces a magnetic field that opposes the motion of the approaching bar magnet',
      'The magnet accelerates definitely',
      'Both a and b',
      'None of the above'
    ],
    correctOptionIndex: 0,
    marks: 4,
    negativeMarks: 1,
    solutionExplanation: 'Lenz\'s law is a direct consequence of the conservation of energy.',
    diagram: { kind: 'none' },
    confidence: 62,
    checks: [],
    reviewStatus: 'pending',
    createdAt: '2025-05-05T12:00:00Z'
  };
  q4.checks = runQuestionChecks(q4);

  return [q1, q2, q3, q4];
}

export const SEED_LIBRARY: LibraryItem[] = [
  {
    id: 'lib_01',
    title: 'Advanced Mechanics & Angular Momentum Theorems (Formula Sheet)',
    subject: 'Physics',
    type: 'pdf',
    chapters: ['Center of Mass', 'Moment of Inertia Tensors', 'Conservation Laws', 'Collisions in 2D'],
    sizeBytes: 4200000,
    downloadCount: 48,
    uploadedAt: '2025-04-10T10:00:00Z'
  },
  {
    id: 'lib_02',
    title: 'Electromagnetism Master Guide: Maxwell Equations & Boundary Values',
    subject: 'Physics',
    type: 'book',
    chapters: ['Gauss Law Applications', 'Poynting Vectors', 'RLC Resonance Q-Factor', 'Waveguides'],
    sizeBytes: 18500000,
    downloadCount: 36,
    uploadedAt: '2025-04-18T14:30:00Z'
  }
];

export const SEED_NOTICES: Notice[] = [
  {
    id: 'not_01',
    title: 'Lab Attendance & Seat Allocation for Supervised Mock Exam 02',
    body: 'All students enrolled in Batch Alpha are required to report to Lab Floor 3 by 08:45 AM this Saturday. Terminals are pre-assigned on the seat map. Fullscreen enforcement and webcam integrity sampling will be enabled throughout the 180-minute window.',
    audience: 'all_teachers',
    priority: 'urgent',
    createdBy: 'acc_admin_owner',
    createdByName: 'Dr. Rajan Mehta',
    createdAt: '2025-05-10T08:00:00Z'
  },
  {
    id: 'not_02',
    title: 'Updated Syllabus Progress and Doubt Desk Schedule',
    body: 'Faculty members are requested to review candidate question drafts generated from lecture transcripts. Doubt clearing slots for wave optics will open tomorrow 4:00 PM.',
    audience: 'all_teachers',
    priority: 'normal',
    createdBy: 'acc_admin_owner',
    createdByName: 'Dr. Rajan Mehta',
    createdAt: '2025-05-12T10:00:00Z'
  }
];
