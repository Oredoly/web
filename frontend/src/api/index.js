import client from './client';

export const authAPI = {
  login: (real_name, password) => client.post('/auth/login', { real_name, password }),
  register: (data) => client.post('/auth/register', data),
  me: () => client.get('/auth/me'),
  getSchools: () => client.get('/auth/schools'),
  getClasses: (schoolId) => client.get(`/auth/classes?school_id=${schoolId}`),
};

export const dashboardAPI = {
  getIndex: () => client.get('/dashboard'),
  getSchools: () => client.get('/dashboard/schools'),
  addSchool: (data) => client.post('/dashboard/schools', data),
  getSchool: (id) => client.get(`/dashboard/schools/${id}`),
  deleteSchool: (id) => client.post(`/dashboard/schools/${id}/delete`),
  addClass: (schoolId, data) => client.post(`/dashboard/schools/${schoolId}/classes`, data),
  deleteClass: (schoolId, classId) => client.post(`/dashboard/schools/${schoolId}/classes/${classId}/delete`),
};

export const courseAPI = {
  list: (params) => client.get('/courses', { params }),
  create: (data) => client.post('/courses', data),
  detail: (id) => client.get(`/courses/${id}`),
  update: (id, data) => client.put(`/courses/${id}`, data),
  delete: (id) => client.delete(`/courses/${id}`),
  addLesson: (courseId, data) => client.post(`/courses/${courseId}/lessons`, data),
  addTask: (lessonId, data) => client.post(`/courses/lessons/${lessonId}/tasks`, data),
  uploadResource: (courseId, formData) => client.post(`/courses/${courseId}/resources`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  enroll: (courseId, studentIds) => client.post(`/courses/${courseId}/enroll`, { student_ids: studentIds }),
  studentEnroll: (courseId) => client.post('/courses/enroll', { course_id: courseId }),
};

export const studentAPI = {
  list: (params) => client.get('/students', { params }),
  create: (data) => client.post('/students', data),
  detail: (id) => client.get(`/students/${id}`),
  update: (id, data) => client.put(`/students/${id}`, data),
  delete: (id) => client.delete(`/students/${id}`),
  batchImport: (data) => client.post('/students/import', data),
  getClasses: (schoolId) => client.get(`/students/classes/${schoolId}`),
  createSchool: (data) => client.post('/students/schools', data),
  deleteSchool: (id) => client.delete(`/students/schools/${id}`),
  createClass: (data) => client.post('/students/classes', data),
  deleteClass: (id) => client.delete(`/students/classes/${id}`),
  createUser: (data) => client.post('/students/users', data),
  updateUser: (id, data) => client.put(`/students/users/${id}`, data),
  deleteUser: (id) => client.delete(`/students/users/${id}`),
  batchDeleteUsers: (ids) => client.post('/students/users/batch-delete', { ids }),
};

export const workAPI = {
  list: (params) => client.get('/works', { params }),
  uploadOptions: () => client.get('/works/upload-options'),
  upload: (formData) => client.post('/works', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  detail: (id) => client.get(`/works/${id}`),
  delete: (id) => client.delete(`/works/${id}`),
  reject: (id, reason) => client.post(`/works/${id}/reject`, { reason }),
};

export const archiveAPI = {
  getTree: (params) => client.get('/archives/tree', { params }),
  generate: (studentId) => client.get('/archives/generate', { params: { student_id: studentId } }),
  generateBatch: (params) => client.get('/archives/generate-batch', { params }),
  getReflections: () => client.get('/archives/reflection'),
  submitReflection: (data) => client.post('/archives/reflection', data),
  submitEvaluation: (data) => client.post('/archives/evaluation', data),
};

export const aiAPI = {
  getCourses: () => client.get('/dashboard/ai/courses'),
  ask: (question, course_id) => client.post('/dashboard/ai/ask', { question, course_id }),
};
