// ===============================
// API Client (Safe & Centralized)
// ===============================

function API_BASE() {
    const stored = localStorage.getItem('apiBaseUrl');
    return stored && stored.trim()
        ? stored.trim()
        : 'http://localhost:3000';
}

/**
 * Centralized fetch wrapper
 */
async function apiFetch(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE()}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            },
            ...options
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API error:', error.message);
        throw error;
    }
}

// ================= USER API =================

async function createUser(userData) {
    return apiFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
}

async function getUsers(role = null) {
    const query = role ? `?role=${encodeURIComponent(role)}` : '';
    return apiFetch(`/api/users${query}`);
}

async function getUser(userId) {
    return apiFetch(`/api/users/${userId}`);
}

async function updateUser(userId, userData) {
    return apiFetch(`/api/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(userData)
    });
}

async function deleteUser(userId) {
    return apiFetch(`/api/users/${userId}`, {
        method: 'DELETE'
    });
}

// ================= COURSE API =================

async function createCourse(courseData) {
    return apiFetch('/api/courses', {
        method: 'POST',
        body: JSON.stringify(courseData)
    });
}

async function getCourses(educatorId = null, category = null) {
    const params = [];
    if (educatorId) params.push(`educatorId=${encodeURIComponent(educatorId)}`);
    if (category) params.push(`category=${encodeURIComponent(category)}`);
    const query = params.length ? `?${params.join('&')}` : '';

    return apiFetch(`/api/courses${query}`);
}

async function getCourse(courseId) {
    return apiFetch(`/api/courses/${courseId}`);
}

async function updateCourse(courseId, courseData) {
    return apiFetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        body: JSON.stringify(courseData)
    });
}

async function deleteCourse(courseId) {
    return apiFetch(`/api/courses/${courseId}`, {
        method: 'DELETE'
    });
}

async function enrollStudent(courseId, studentId) {
    return apiFetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
        body: JSON.stringify({ studentId })
    });
}

async function unenrollStudent(courseId, studentId) {
    return apiFetch(`/api/courses/${courseId}/unenroll`, {
        method: 'POST',
        body: JSON.stringify({ studentId })
    });
}

// ================= MATERIAL API =================

async function createMaterial(courseId, materialData) {
    return apiFetch(`/api/courses/${courseId}/materials`, {
        method: 'POST',
        body: JSON.stringify(materialData)
    });
}

async function getMaterials(courseId) {
    return apiFetch(`/api/courses/${courseId}/materials`);
}

async function getMaterial(courseId, materialId) {
    return apiFetch(`/api/courses/${courseId}/materials/${materialId}`);
}

async function updateMaterial(courseId, materialId, materialData) {
    return apiFetch(`/api/courses/${courseId}/materials/${materialId}`, {
        method: 'PUT',
        body: JSON.stringify(materialData)
    });
}

async function deleteMaterial(courseId, materialId) {
    return apiFetch(`/api/courses/${courseId}/materials/${materialId}`, {
        method: 'DELETE'
    });
}

// ================= ASSESSMENT API =================

async function createAssessment(courseId, assessmentData) {
    return apiFetch(`/api/courses/${courseId}/assessments`, {
        method: 'POST',
        body: JSON.stringify(assessmentData)
    });
}

async function getAssessments(courseId) {
    return apiFetch(`/api/courses/${courseId}/assessments`);
}

async function submitAssessment(courseId, assessmentId, submissionData) {
    return apiFetch(
        `/api/courses/${courseId}/assessments/${assessmentId}/submit`,
        {
            method: 'POST',
            body: JSON.stringify(submissionData)
        }
    );
}

// ================= SUBMISSION API =================

async function getSubmissions(studentId = null, courseId = null, assessmentId = null) {
    const params = [];
    if (studentId) params.push(`studentId=${encodeURIComponent(studentId)}`);
    if (courseId) params.push(`courseId=${encodeURIComponent(courseId)}`);
    if (assessmentId) params.push(`assessmentId=${encodeURIComponent(assessmentId)}`);
    const query = params.length ? `?${params.join('&')}` : '';

    return apiFetch(`/api/submissions${query}`);
}

async function gradeSubmission(submissionId, marks, feedback = '') {
    return apiFetch(`/api/submissions/${submissionId}/grade`, {
        method: 'PUT',
        body: JSON.stringify({ marks, feedback })
    });
}

async function updateSubmission(submissionId, submissionData) {
    return apiFetch(`/api/submissions/${submissionId}`, {
        method: 'PUT',
        body: JSON.stringify(submissionData)
    });
}

async function deleteSubmission(submissionId) {
    return apiFetch(`/api/submissions/${submissionId}`, {
        method: 'DELETE'
    });
}

// ================= DERIVED / HELPER API =================

/**
 * Get courses enrolled by a learner
 * (Client-side derived API)
 */
async function getEnrolledCourses(studentId) {
    if (!studentId) {
        throw new Error('Student ID is required');
    }

    const courses = await getCourses();

    return courses.filter(course =>
        Array.isArray(course.enrolledStudents) &&
        course.enrolledStudents.includes(studentId)
    );
}
