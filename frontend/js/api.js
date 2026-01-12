// API functions
const API_BASE = () => {
    const stored = localStorage.getItem('apiBaseUrl');
    return stored || 'http://localhost:3000';
};

// User API
async function createUser(userData) {
    const response = await fetch(`${API_BASE()}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });
    return await response.json();
}

async function getUsers(role = null) {
    const url = role ? `${API_BASE()}/api/users?role=${role}` : `${API_BASE()}/api/users`;
    const response = await fetch(url);
    return await response.json();
}

async function getUser(userId) {
    const response = await fetch(`${API_BASE()}/api/users/${userId}`);
    return await response.json();
}

async function updateUser(userId, userData) {
    const response = await fetch(`${API_BASE()}/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });
    return await response.json();
}

async function deleteUser(userId) {
    const response = await fetch(`${API_BASE()}/api/users/${userId}`, {
        method: 'DELETE'
    });
    return await response.json();
}

// Course API
async function createCourse(courseData) {
    const response = await fetch(`${API_BASE()}/api/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData)
    });
    return await response.json();
}

async function getCourses(educatorId = null, category = null) {
    let url = `${API_BASE()}/api/courses`;
    const params = [];
    if (educatorId) params.push(`educatorId=${educatorId}`);
    if (category) params.push(`category=${category}`);
    if (params.length > 0) url += '?' + params.join('&');
    
    const response = await fetch(url);
    return await response.json();
}

async function getCourse(courseId) {
    const response = await fetch(`${API_BASE()}/api/courses/${courseId}`);
    return await response.json();
}

async function updateCourse(courseId, courseData) {
    const response = await fetch(`${API_BASE()}/api/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseData)
    });
    return await response.json();
}

async function deleteCourse(courseId) {
    const response = await fetch(`${API_BASE()}/api/courses/${courseId}`, {
        method: 'DELETE'
    });
    return await response.json();
}

async function enrollStudent(courseId, studentId) {
    const response = await fetch(`${API_BASE()}/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId })
    });
    return await response.json();
}

// Material API
async function createMaterial(courseId, materialData) {
    const response = await fetch(`${API_BASE()}/api/courses/${courseId}/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(materialData)
    });
    return await response.json();
}

async function getMaterials(courseId) {
    const response = await fetch(`${API_BASE()}/api/courses/${courseId}/materials`);
    return await response.json();
}

async function getMaterial(courseId, materialId) {
    const response = await fetch(`${API_BASE()}/api/courses/${courseId}/materials/${materialId}`);
    return await response.json();
}

async function updateMaterial(courseId, materialId, materialData) {
    const response = await fetch(`${API_BASE()}/api/courses/${courseId}/materials/${materialId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(materialData)
    });
    return await response.json();
}

async function deleteMaterial(courseId, materialId) {
    const response = await fetch(`${API_BASE()}/api/courses/${courseId}/materials/${materialId}`, {
        method: 'DELETE'
    });
    return await response.json();
}

// Assessment API
async function createAssessment(courseId, assessmentData) {
    const response = await fetch(`${API_BASE()}/api/courses/${courseId}/assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assessmentData)
    });
    return await response.json();
}

async function getAssessments(courseId) {
    const response = await fetch(`${API_BASE()}/api/courses/${courseId}/assessments`);
    return await response.json();
}

async function submitAssessment(courseId, assessmentId, submissionData) {
    const response = await fetch(`${API_BASE()}/api/courses/${courseId}/assessments/${assessmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData)
    });
    return await response.json();
}

async function getSubmissions(studentId = null, courseId = null, assessmentId = null) {
    let url = `${API_BASE()}/api/submissions`;
    const params = [];
    if (studentId) params.push(`studentId=${studentId}`);
    if (courseId) params.push(`courseId=${courseId}`);
    if (assessmentId) params.push(`assessmentId=${assessmentId}`);
    if (params.length > 0) url += '?' + params.join('&');
    
    const response = await fetch(url);
    return await response.json();
}

async function gradeSubmission(submissionId, marks, feedback = '') {
    const response = await fetch(`${API_BASE()}/api/submissions/${submissionId}/grade`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marks, feedback })
    });
    return await response.json();
}
