const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Helper for standardized fetch requests
export const fetchAPI = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 401 && endpoint !== '/auth/login') {
        localStorage.removeItem('token');
      }
      throw new Error(data.message || 'API Request failed');
    }
    return data;
  } catch (error) {
    console.warn(`[API Service Notice]: ${error.message}`);
    throw error;
  }
};

// ==================================================
// STUDENT API SERVICES
// ==================================================

export const getStudentsAPI = async ({ search, standard, status } = {}) => {
  const params = new URLSearchParams();
  if (search && search.trim()) params.append('search', search.trim());
  if (standard && standard !== 'Select Class' && standard !== 'All Classes' && standard !== 'All') {
    params.append('standard', standard);
  }
  if (status && status !== 'All') params.append('status', status);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  return await fetchAPI(`/students${queryString}`);
};

export const getStudentByIdAPI = async (id) => {
  return await fetchAPI(`/students/${id}`);
};

export const getNextStudentIdAPI = async (standard) => {
  const params = new URLSearchParams();
  if (standard) params.append('standard', standard);
  return await fetchAPI(`/students/next-id?${params.toString()}`);
};

export const createStudentAPI = async (studentData) => {
  return await fetchAPI('/students', {
    method: 'POST',
    body: JSON.stringify(studentData),
  });
};

export const exportStudentsAPI = async ({ scope = 'all', search, standard, status } = {}) => {
  const params = new URLSearchParams();
  params.append('scope', scope);
  if (scope === 'filtered') {
    if (search && search.trim()) params.append('search', search.trim());
    if (standard && standard !== 'Select Class' && standard !== 'All Classes' && standard !== 'All') {
      params.append('standard', standard);
    }
    if (status && status !== 'All') params.append('status', status);
  }

  const response = await fetch(`${API_BASE_URL}/students/export?${params.toString()}`);
  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    throw new Error(errorJson.message || 'Unable to export student data.');
  }

  const blob = await response.blob();
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `Students_${dateStr}.xlsx`;

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);

  return { success: true };
};

export const updateStudentAPI = async (id, studentData) => {
  return await fetchAPI(`/students/${id}`, {
    method: 'PUT',
    body: JSON.stringify(studentData),
  });
};

export const deleteStudentAPI = async (id) => {
  return await fetchAPI(`/students/${id}`, {
    method: 'DELETE',
  });
};

export const getCurrentStudentProfileAPI = async (studentId) => {
  const headers = {};
  if (studentId) headers['x-student-id'] = studentId;
  const params = studentId ? `?studentId=${studentId}` : '';
  return await fetchAPI(`/students/me${params}`, { headers });
};

export const getStudentDashboardAPI = async ({ studentId, month, year } = {}) => {
  const headers = {};
  if (studentId) headers['x-student-id'] = studentId;
  const params = new URLSearchParams();
  if (studentId) params.append('studentId', studentId);
  if (month) params.append('month', month);
  if (year) params.append('year', year);
  const queryString = params.toString() ? `?${params.toString()}` : '';
  return await fetchAPI(`/students/dashboard${queryString}`, { headers });
};

// ==================================================
// TEACHER API SERVICES
// ==================================================

export const getTeachersAPI = async ({ search, subject, class: classFilter, status } = {}) => {
  const params = new URLSearchParams();
  if (search && search.trim()) params.append('search', search.trim());
  if (subject && subject !== 'All Subjects' && subject !== 'All') {
    params.append('subject', subject);
  }
  if (classFilter && classFilter !== 'All Classes' && classFilter !== 'All') {
    params.append('class', classFilter);
  }
  if (status && status !== 'All') params.append('status', status);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  return await fetchAPI(`/teachers${queryString}`);
};

export const getTeacherByIdAPI = async (id) => {
  return await fetchAPI(`/teachers/${id}`);
};

export const createTeacherAPI = async (teacherData) => {
  return await fetchAPI('/teachers', {
    method: 'POST',
    body: JSON.stringify(teacherData),
  });
};

export const updateTeacherAPI = async (id, teacherData) => {
  return await fetchAPI(`/teachers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(teacherData),
  });
};

export const deleteTeacherAPI = async (id) => {
  return await fetchAPI(`/teachers/${id}`, {
    method: 'DELETE',
  });
};

export const getAuthenticatedTeacherProfileAPI = async () => {
  return await fetchAPI('/teachers/me');
};

export const getTeacherDashboardAPI = async (teacherId) => {
  const endpoint = teacherId ? `/teachers/${teacherId}/dashboard` : '/teachers/me';
  return await fetchAPI(endpoint);
};

// ==================================================
// OFFICE STAFF API SERVICES
// ==================================================

export const getAuthenticatedStaffProfileAPI = async () => {
  return await fetchAPI('/staff/me');
};

export const getStaffAPI = async ({ search } = {}) => {
  const params = new URLSearchParams();
  if (search && search.trim()) params.append('search', search.trim());

  const queryString = params.toString() ? `?${params.toString()}` : '';
  return await fetchAPI(`/staff${queryString}`);
};

export const getStaffByIdAPI = async (id) => {
  return await fetchAPI(`/staff/${id}`);
};

export const createStaffAPI = async (staffData) => {
  return await fetchAPI('/staff', {
    method: 'POST',
    body: JSON.stringify(staffData),
  });
};

export const updateStaffAPI = async (id, staffData) => {
  return await fetchAPI(`/staff/${id}`, {
    method: 'PUT',
    body: JSON.stringify(staffData),
  });
};

export const deleteStaffAPI = async (id) => {
  return await fetchAPI(`/staff/${id}`, {
    method: 'DELETE',
  });
};

// ==================================================
// COURSES API SERVICES
// ==================================================

export const getCoursesAPI = async ({ search, standard, status } = {}) => {
  const params = new URLSearchParams();
  if (search && search.trim()) params.append('search', search.trim());
  if (standard && standard !== 'All Standards' && standard !== 'All') {
    params.append('standard', standard);
  }
  if (status && status !== 'All Status' && status !== 'All') {
    params.append('status', status);
  }

  const queryString = params.toString() ? `?${params.toString()}` : '';
  return await fetchAPI(`/courses${queryString}`);
};

export const getCourseByIdAPI = async (id) => {
  return await fetchAPI(`/courses/${id}`);
};

export const createCourseAPI = async (courseData) => {
  return await fetchAPI('/courses', {
    method: 'POST',
    body: JSON.stringify(courseData),
  });
};

export const updateCourseAPI = async (id, courseData) => {
  return await fetchAPI(`/courses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(courseData),
  });
};

export const deleteCourseAPI = async (id) => {
  return await fetchAPI(`/courses/${id}`, {
    method: 'DELETE',
  });
};

// ==================================================
// BATCHES / TIMETABLE API SERVICES
// ==================================================

export const getBatchesAPI = async ({ search, standard, subject, teacher, day, schedulePattern, scheduleType } = {}) => {
  const params = new URLSearchParams();
  if (search && search.trim()) params.append('search', search.trim());
  if (standard && standard !== 'All Standards' && standard !== 'All Classes' && standard !== 'All') {
    params.append('standard', standard);
  }
  if (subject && subject !== 'All Subjects' && subject !== 'All') {
    params.append('subject', subject);
  }
  if (teacher && teacher !== 'All Teachers' && teacher !== 'All') {
    params.append('teacher', teacher);
  }
  if (day && day !== 'All Days' && day !== 'All') {
    params.append('day', day);
  }
  if (schedulePattern && schedulePattern !== 'All Patterns') {
    params.append('schedulePattern', schedulePattern);
  }
  if (scheduleType && scheduleType !== 'All Types') {
    params.append('scheduleType', scheduleType);
  }

  const queryString = params.toString() ? `?${params.toString()}` : '';
  return await fetchAPI(`/batches${queryString}`);
};

export const getBatchByIdAPI = async (id) => {
  return await fetchAPI(`/batches/${id}`);
};

export const createBatchAPI = async (batchData) => {
  return await fetchAPI('/batches', {
    method: 'POST',
    body: JSON.stringify(batchData),
  });
};

export const updateBatchAPI = async (id, batchData) => {
  return await fetchAPI(`/batches/${id}`, {
    method: 'PUT',
    body: JSON.stringify(batchData),
  });
};

export const deleteBatchAPI = async (id) => {
  return await fetchAPI(`/batches/${id}`, {
    method: 'DELETE',
  });
};

// ==================================================
// ATTENDANCE API SERVICES
// ==================================================

export const getSubjectsByClassAPI = async (standard) => {
  const params = new URLSearchParams();
  if (standard) params.append('standard', standard);
  const queryString = params.toString() ? `?${params.toString()}` : '';
  return await fetchAPI(`/attendance/subjects${queryString}`);
};

export const checkAttendanceScheduleAPI = async ({ standard, subject, teacherId, date } = {}) => {
  const params = new URLSearchParams();
  if (standard) params.append('standard', standard);
  if (subject) params.append('subject', subject);
  if (teacherId) params.append('teacherId', teacherId);
  if (date) params.append('date', date);
  const queryString = params.toString() ? `?${params.toString()}` : '';
  return await fetchAPI(`/attendance/check-schedule${queryString}`);
};

export const getAssignedTeacherAPI = async ({ standard, subject } = {}) => {
  const params = new URLSearchParams();
  if (standard) params.append('standard', standard);
  if (subject) params.append('subject', subject);
  const queryString = params.toString() ? `?${params.toString()}` : '';
  return await fetchAPI(`/attendance/assigned-teacher${queryString}`);
};

export const getTeacherAllocationsAPI = async (teacherId) => {
  if (teacherId) {
    return await fetchAPI(`/attendance/teacher-allocations/${teacherId}`);
  }
  return await fetchAPI('/teachers/me/permissions');
};

export const getAttendanceStudentsAPI = async ({ teacherId, standard, subject, search } = {}) => {
  const params = new URLSearchParams();
  if (teacherId) params.append('teacherId', teacherId);
  if (standard) params.append('standard', standard);
  if (subject) params.append('subject', subject);
  if (search && search.trim()) params.append('search', search.trim());

  const queryString = params.toString() ? `?${params.toString()}` : '';
  return await fetchAPI(`/attendance/students${queryString}`);
};

export const markAttendanceAPI = async (attendancePayload) => {
  return await fetchAPI('/attendance', {
    method: 'POST',
    body: JSON.stringify(attendancePayload),
  });
};
export const createAttendanceAPI = markAttendanceAPI;
export const getWhatsAppStatusAPI = async () => {
  return await fetchAPI('/attendance/whatsapp-status');
};

export const launchWhatsAppQRSetupAPI = async () => {
  return await fetchAPI('/attendance/whatsapp-qr-setup', { method: 'POST' });
};

export const sendManualWhatsAppAPI = async ({ standard, subject, date, attendanceId, studentIds }) => {
  return await fetchAPI('/attendance/send-whatsapp', {
    method: 'POST',
    body: JSON.stringify({ standard, subject, date, attendanceId, studentIds }),
  });
};

export const sendManualWhatsAppNotificationsAPI = async (payload) => {
  if (typeof payload === 'string') {
    return await fetchAPI('/attendance/send-whatsapp', {
      method: 'POST',
      body: JSON.stringify({ attendanceId: payload }),
    });
  }
  if (typeof payload === 'object' && payload !== null) {
    return await fetchAPI('/attendance/send-whatsapp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
  return await sendManualWhatsAppAPI(payload || {});
};

export const getAttendanceProgressAPI = async ({ standard, date } = {}) => {
  const params = new URLSearchParams();
  if (standard) params.append('standard', standard);
  if (date) params.append('date', date);
  const queryString = params.toString() ? `?${params.toString()}` : '';
  return await fetchAPI(`/attendance/progress${queryString}`);
};

export const resetTodayAttendanceAPI = async ({ standard, date } = {}) => {
  return await fetchAPI('/attendance/reset-today', {
    method: 'POST',
    body: JSON.stringify({ standard, date })
  });
};

export const getAttendanceAPI = async ({ standard, date, subject, teacher, status } = {}) => {
  const params = new URLSearchParams();
  if (standard && standard !== 'All Standards' && standard !== 'All Classes' && standard !== 'All') {
    params.append('standard', standard);
  }
  if (date) params.append('date', date);
  if (subject && subject !== 'All Subjects' && subject !== 'All') {
    params.append('subject', subject);
  }
  if (teacher && teacher !== 'All Teachers' && teacher !== 'All') {
    params.append('teacher', teacher);
  }
  if (status && status !== 'All') params.append('status', status);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  return await fetchAPI(`/attendance/session${queryString}`);
};
export const getAttendanceByClassAndDateAPI = getAttendanceAPI;

export const getAttendanceByDateAPI = async (date, { standard, subject, teacher } = {}) => {
  const params = new URLSearchParams();
  if (standard && standard !== 'All Standards' && standard !== 'All') {
    params.append('standard', standard);
  }
  if (subject && subject !== 'All Subjects' && subject !== 'All') {
    params.append('subject', subject);
  }
  if (teacher && teacher !== 'All Teachers' && teacher !== 'All') {
    params.append('teacher', teacher);
  }

  const queryString = params.toString() ? `?${params.toString()}` : '';
  return await fetchAPI(`/attendance/session${queryString}&date=${date}`);
};

export const getAttendanceHistoryAPI = async ({ standard, subject, teacher, month, year } = {}) => {
  const params = new URLSearchParams();
  if (standard && standard !== 'All Standards' && standard !== 'All') {
    params.append('standard', standard);
  }
  if (subject && subject !== 'All Subjects' && subject !== 'All') {
    params.append('subject', subject);
  }
  if (teacher && teacher !== 'All Teachers' && teacher !== 'All') {
    params.append('teacher', teacher);
  }
  if (month && month !== 'All') params.append('month', month);
  if (year && year !== 'All') params.append('year', year);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  return await fetchAPI(`/attendance/history${queryString}`);
};

export const getStudentAttendanceSummaryAPI = async (studentId, { month, year } = {}) => {
  const params = new URLSearchParams();
  if (month) params.append('month', month);
  if (year) params.append('year', year);
  const queryString = params.toString() ? `?${params.toString()}` : '';
  return await fetchAPI(`/attendance/student/${studentId}${queryString}`);
};

export const getStudentAttendanceStreakAPI = async (studentId) => {
  return await fetchAPI(`/attendance/student-streak/${studentId}`);
};

export const updateAttendanceAPI = async (id, statusData) => {
  return await fetchAPI(`/attendance/${id}`, {
    method: 'PUT',
    body: JSON.stringify(statusData),
  });
};

// ==================================================
// MARKS & RESULTS API SERVICES
// ==================================================

export const getTestsAPI = async ({ search, standard, subject, teacher, date } = {}) => {
  const params = new URLSearchParams();
  if (search && search.trim()) params.append('search', search.trim());
  if (standard && standard !== 'All Standards' && standard !== 'All Classes' && standard !== 'All') {
    params.append('standard', standard);
  }
  if (subject && subject !== 'All Subjects' && subject !== 'All') {
    params.append('subject', subject);
  }
  if (teacher && teacher !== 'All Teachers' && teacher !== 'All') {
    params.append('teacher', teacher);
  }
  if (date) params.append('date', date);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  return await fetchAPI(`/tests${queryString}`);
};

export const getTestByIdAPI = async (id) => {
  return await fetchAPI(`/tests/${id}`);
};

export const createTestAPI = async (testData) => {
  return await fetchAPI('/tests', {
    method: 'POST',
    body: JSON.stringify(testData),
  });
};

export const updateTestAPI = async (id, testData) => {
  return await fetchAPI(`/tests/${id}`, {
    method: 'PUT',
    body: JSON.stringify(testData),
  });
};

export const deleteTestAPI = async (id) => {
  return await fetchAPI(`/tests/${id}`, {
    method: 'DELETE',
  });
};

export const createResultsAPI = async (resultsData) => {
  return await fetchAPI('/results', {
    method: 'POST',
    body: JSON.stringify(resultsData),
  });
};

export const getResultsByTestAPI = async (testId) => {
  return await fetchAPI(`/results/test/${testId}`);
};

export const getStudentResultsAPI = async (studentId) => {
  return await fetchAPI(`/results/student/${studentId}`);
};

export const getClassLeaderboardAPI = async ({ standard, studentId }) => {
  const params = new URLSearchParams();
  if (standard) params.append('standard', standard);
  if (studentId) params.append('studentId', studentId);
  return await fetchAPI(`/results/leaderboard?${params.toString()}`);
};

export const updateResultAPI = async (id, resultData) => {
  return await fetchAPI(`/results/${id}`, {
    method: 'PUT',
    body: JSON.stringify(resultData),
  });
};

export const sendTestAbsentWhatsAppAPI = async (testId) => {
  return await fetchAPI('/results/send-whatsapp', {
    method: 'POST',
    body: JSON.stringify({ testId }),
  });
};

export const getPublicTestToppersAPI = async (options) => {
  const params = new URLSearchParams();
  const standard = typeof options === 'string' ? options : options?.standard;
  const latestOnly = typeof options === 'object' ? options?.latestOnly : false;

  if (standard && standard !== 'ALL' && standard !== 'All' && standard !== 'All Classes') {
    params.append('standard', standard);
  }
  if (latestOnly) {
    params.append('latestOnly', 'true');
  }

  const queryString = params.toString() ? `?${params.toString()}` : '';
  return await fetchAPI(`/results/public-toppers${queryString}`);
};

/**
 * Public Faculty API Service
 * Fetches real active teachers from MySQL database
 */
export const getPublicFacultyAPI = async () => {
  return await fetchAPI('/teachers/public');
};

// ==================================================
// FEES API SERVICES
// ==================================================

export const getFeesOverviewAPI = async ({ search, standard, status } = {}) => {
  const params = new URLSearchParams();
  if (search && search.trim()) params.append('search', search.trim());
  if (standard && standard !== 'All Standards' && standard !== 'All Classes' && standard !== 'All') {
    params.append('standard', standard);
  }
  if (status && status !== 'All Status' && status !== 'All') {
    params.append('status', status);
  }

  const queryString = params.toString() ? `?${params.toString()}` : '';
  return await fetchAPI(`/fees/overview${queryString}`);
};

export const getFeesAPI = async ({ search, status, standard } = {}) => {
  const params = new URLSearchParams();
  if (search && search.trim()) params.append('search', search.trim());
  if (status && status !== 'All Status' && status !== 'All') {
    params.append('status', status);
  }
  if (standard && standard !== 'All Standards' && standard !== 'All Classes' && standard !== 'All') {
    params.append('standard', standard);
  }

  const queryString = params.toString() ? `?${params.toString()}` : '';
  return await fetchAPI(`/fees${queryString}`);
};

export const getFeeByStudentAPI = async (studentId) => {
  return await fetchAPI(`/fees/student/${studentId}`);
};

export const createFeeAPI = async (feeData) => {
  return await fetchAPI('/fees', {
    method: 'POST',
    body: JSON.stringify(feeData),
  });
};

export const updateFeeAPI = async (id, feeData) => {
  return await fetchAPI(`/fees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(feeData),
  });
};

export const createPaymentAPI = async (paymentData) => {
  return await fetchAPI('/fee-payments', {
    method: 'POST',
    body: JSON.stringify(paymentData),
  });
};

export const getPaymentsByStudentAPI = async (studentId) => {
  return await fetchAPI(`/fee-payments/student/${studentId}`);
};

export const deletePaymentAPI = async (id) => {
  return await fetchAPI(`/fee-payments/${id}`, {
    method: 'DELETE',
  });
};

// ==================================================
// DASHBOARD SUMMARY API SERVICE
// ==================================================

export const getDashboardSummaryAPI = async () => {
  return await fetchAPI('/dashboard/summary');
};

// ==================================================
// ANNOUNCEMENTS API SERVICES (ROLE & AUDIENCE AWARE)
// ==================================================

export const getAnnouncementsAPI = async ({ search, status, date, role, studentId, teacherId, standard, audience } = {}) => {
  const params = new URLSearchParams();
  if (search && search.trim()) params.append('search', search.trim());
  if (status && status !== 'All Status' && status !== 'All') params.append('status', status);
  if (date) params.append('date', date);
  if (role) params.append('role', role);
  if (studentId) params.append('studentId', studentId);
  if (teacherId) params.append('teacherId', teacherId);
  if (standard && standard !== 'All Students' && standard !== 'All Classes' && standard !== 'All') {
    params.append('standard', standard);
  }
  if (audience && audience !== 'All Audience' && audience !== 'All') params.append('audience', audience);

  const headers = {};
  if (role) headers['x-user-role'] = role;
  if (teacherId) headers['x-user-id'] = teacherId;

  const queryString = params.toString() ? `?${params.toString()}` : '';
  return await fetchAPI(`/announcements${queryString}`, { headers });
};

export const getPublicAnnouncementsAPI = async () => {
  return await fetchAPI('/announcements/public');
};

export const getStudentAnnouncementsAPI = async (studentId, standard) => {
  const params = new URLSearchParams();
  if (studentId) params.append('studentId', studentId);
  if (standard && standard !== 'All Students' && standard !== 'All') params.append('standard', standard);
  const queryString = params.toString() ? `?${params.toString()}` : '';
  return await fetchAPI(`/announcements/student${queryString}`);
};

export const markAnnouncementReadAPI = async (id, studentId) => {
  return await fetchAPI(`/announcements/${id}/read`, {
    method: 'POST',
    body: JSON.stringify({ studentId })
  });
};

export const getAnnouncementByIdAPI = async (id) => {
  return await fetchAPI(`/announcements/${id}`);
};

export const createAnnouncementAPI = async (announcementData, role = 'Admin', userId = null) => {
  const headers = {};
  if (role) headers['x-user-role'] = role;
  if (userId) headers['x-user-id'] = userId;

  return await fetchAPI('/announcements', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ...announcementData,
      createdByRole: announcementData.createdByRole || role,
      createdBy: announcementData.createdBy || userId
    }),
  });
};

export const updateAnnouncementAPI = async (id, announcementData, role = 'Admin', userId = null) => {
  const headers = {};
  if (role) headers['x-user-role'] = role;
  if (userId) headers['x-user-id'] = userId;

  return await fetchAPI(`/announcements/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      ...announcementData,
      createdByRole: announcementData.createdByRole || role,
      createdBy: announcementData.createdBy || userId
    }),
  });
};

export const deleteAnnouncementAPI = async (id, role = 'Admin', userId = null) => {
  const headers = {};
  if (role) headers['x-user-role'] = role;
  if (userId) headers['x-user-id'] = userId;

  return await fetchAPI(`/announcements/${id}`, {
    method: 'DELETE',
    headers
  });
};

// ==================================================
// GALLERY API SERVICES (ADMIN ONLY)
// ==================================================

export const getGalleryItemsAPI = async ({ search, category, status, date } = {}) => {
  const params = new URLSearchParams();
  if (search && search.trim()) params.append('search', search.trim());
  if (category && category !== 'All Category' && category !== 'All') params.append('category', category);
  if (status && status !== 'All Status' && status !== 'All') params.append('status', status);
  if (date) params.append('date', date);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  return await fetchAPI(`/gallery${queryString}`);
};

export const getGalleryItemByIdAPI = async (id) => {
  return await fetchAPI(`/gallery/${id}`);
};

export const createGalleryItemAPI = async (galleryData) => {
  return await fetchAPI('/gallery', {
    method: 'POST',
    body: JSON.stringify(galleryData),
  });
};

export const updateGalleryItemAPI = async (id, galleryData) => {
  return await fetchAPI(`/gallery/${id}`, {
    method: 'PUT',
    body: JSON.stringify(galleryData),
  });
};

export const deleteGalleryItemAPI = async (id) => {
  return await fetchAPI(`/gallery/${id}`, {
    method: 'DELETE',
  });
};

// ==================================================
// ASSIGNMENT API SERVICES
// ==================================================

export const getAssignmentsAPI = async ({ search, standard, subject, teacherId } = {}) => {
  const params = new URLSearchParams();
  if (search && search.trim()) params.append('search', search.trim());
  if (standard && standard !== 'All Classes' && standard !== 'All Standards' && standard !== 'All') {
    params.append('standard', standard);
  }
  if (subject && subject !== 'All Subjects' && subject !== 'All') {
    params.append('subject', subject);
  }
  if (teacherId) params.append('teacherId', teacherId);

  const queryString = params.toString() ? `?${params.toString()}` : '';
  return await fetchAPI(`/assignments${queryString}`);
};

export const getStudentAssignmentsAPI = async (studentId, { subject } = {}) => {
  const params = new URLSearchParams();
  if (subject) params.append('subject', subject);
  const queryString = params.toString() ? `?${params.toString()}` : '';
  return await fetchAPI(`/assignments/student/${studentId}${queryString}`);
};

export const getTeacherAssignmentAllocationsAPI = async (teacherId) => {
  const queryString = teacherId ? `?teacherId=${teacherId}` : '';
  return await fetchAPI(`/assignments/allocations${queryString}`);
};

export const getAssignmentByIdAPI = async (id) => {
  return await fetchAPI(`/assignments/${id}`);
};

export const createAssignmentAPI = async (assignmentData) => {
  return await fetchAPI('/assignments', {
    method: 'POST',
    body: JSON.stringify(assignmentData),
  });
};

export const updateAssignmentAPI = async (id, assignmentData) => {
  return await fetchAPI(`/assignments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(assignmentData),
  });
};

export const deleteAssignmentAPI = async (id) => {
  return await fetchAPI(`/assignments/${id}`, {
    method: 'DELETE',
  });
};



