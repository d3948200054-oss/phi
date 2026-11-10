import { TabConfig, TabId, UserRole } from '../types';

export const TABS: TabConfig[] = [
  // Main
  { id: 'dashboard', label: 'Dashboard', roles: ['teacher', 'admin', 'student'], section: 'main' },
  { id: 'cohorts', label: 'Cohorts & Batches', roles: ['teacher', 'admin'], section: 'main' },
  { id: 'students-reports', label: 'Students & Reports', roles: ['teacher', 'admin'], section: 'main' },
  { id: 'analytics', label: 'Institute Analytics', roles: ['teacher', 'admin'], section: 'main' },

  // Academic / Content
  { id: 'lectures', label: 'Lecture Studio', roles: ['teacher', 'admin', 'student'], section: 'academic' },
  { id: 'review-desk', label: 'Review Desk', roles: ['teacher', 'admin'], section: 'academic' },
  { id: 'exam-builder', label: 'Exam Builder', roles: ['teacher', 'admin'], section: 'academic' },
  { id: 'test-series', label: 'Test Series', roles: ['teacher', 'admin', 'student'], section: 'academic' },
  { id: 'question-bank', label: 'Question Bank', roles: ['teacher', 'admin'], section: 'academic' },
  { id: 'daily-warmup', label: 'Daily Warm-up', roles: ['teacher', 'admin', 'student'], section: 'academic' },
  { id: 'library', label: 'Library & Notes', roles: ['teacher', 'admin', 'student'], section: 'academic' },

  // Supervision & Engines
  { id: 'sessions', label: 'Supervised Exam Runner', roles: ['teacher', 'admin', 'student'], section: 'supervision' },
  { id: 'proctoring', label: 'Proctoring Engine', roles: ['teacher', 'admin'], section: 'supervision' },
  { id: 'screen-time', label: 'Device Screen-Time', roles: ['teacher', 'admin', 'student'], section: 'supervision' },

  // Operations
  { id: 'fees-payouts', label: 'Fees & Payouts', roles: ['teacher', 'admin'], section: 'operations' },
  { id: 'doubt-desk', label: 'Doubt Desk (AI)', roles: ['teacher', 'admin', 'student'], section: 'operations' },
  { id: 'mentoring', label: 'Mentoring & Slots', roles: ['teacher', 'admin', 'student'], section: 'operations' },
  { id: 'notices', label: 'Notice Board', roles: ['teacher', 'admin', 'student'], section: 'operations' },

  // Admin exclusive
  { id: 'admin', label: 'Owner Admin Console', roles: ['admin'], section: 'admin' },
];

export function canAccess(tabId: TabId, role: UserRole): boolean {
  const tab = TABS.find(t => t.id === tabId);
  if (!tab) return false;
  return tab.roles.includes(role);
}

export function getAccessibleTabs(role: UserRole): TabConfig[] {
  return TABS.filter(t => t.roles.includes(role));
}
