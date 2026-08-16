// Minimal-but-valid SystemState/UserAccount fixtures for smoke tests.
// Kept permissive (mostly empty arrays) since these tests only check that
// each tab/mode renders its own content in isolation - not business logic.
import type { UserAccount } from "../types";

export function makeMockSystemState(overrides: Record<string, any> = {}) {
  return {
    registeredStudents: [],
    activeStudents: [],
    attendance: [],
    payments: [],
    salaries: [],
    cashLedger: [],
    inventory: [],
    taxes: [],
    users: [],
    events: [],
    lmsLessons: [],
    lmsQuizzes: [],
    lmsClasses: [],
    chapterAssessments: [],
    jobOrders: [],
    messages: [],
    teacherLeaves: [],
    teacherContracts: [],
    teacherReports: [],
    logs: [],
    slideshows: [],
    galleries: [],
    costConfig: { registration: 0, dp: 0, fullPayment: 0, managementFee: 0 },
    customization: {
      logoText: "Test LPK",
      logoIcon: "book",
      themeColor: "#4f46e5",
      slides: [],
      gallery: [],
    },
    ...overrides,
  };
}

export function makeMockUser(role: UserAccount["role"], overrides: Record<string, any> = {}) {
  return {
    id: "user-1",
    username: "testuser",
    email: "testuser@example.com",
    name: "Test User",
    role,
    ...overrides,
  };
}

export const noopAsync = async () => true;
export const noop = () => {};
