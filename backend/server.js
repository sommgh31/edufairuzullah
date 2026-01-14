// server.js
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
require('dotenv').config();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK
// You need to download your service account key from Firebase Console
// and save it as serviceAccountKey.json
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ==================== USER ROUTES ====================

// Create User (Educator or Learner)
app.post('/api/users', async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    
    if (!name || !email || !role || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (role !== 'educator' && role !== 'learner') {
      return res.status(400).json({ error: 'Role must be educator or learner' });
    }

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name
    });

    // Store user data in Firestore
    const userData = {
      uid: userRecord.uid,
      name,
      email,
      role,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('users').doc(userRecord.uid).set(userData);

    res.status(201).json({ 
      message: 'User created successfully', 
      user: { uid: userRecord.uid, name, email, role } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get All Users
app.get('/api/users', async (req, res) => {
  try {
    const { role } = req.query;
    let query = db.collection('users');
    
    if (role) {
      query = query.where('role', '==', role);
    }

    const snapshot = await query.get();
    const users = [];
    
    snapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() });
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Single User
app.get('/api/users/:id', async (req, res) => {
  try {
    const doc = await db.collection('users').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update User
app.put('/api/users/:id', async (req, res) => {
  try {
    const { name, email } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await db.collection('users').doc(req.params.id).update(updateData);

    // Update Firebase Auth if email changed
    if (email) {
      await admin.auth().updateUser(req.params.id, { email });
    }

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete User
app.delete('/api/users/:id', async (req, res) => {
  try {
    await admin.auth().deleteUser(req.params.id);
    await db.collection('users').doc(req.params.id).delete();
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== COURSE ROUTES ====================

// Create Course (Educators only)
app.post('/api/courses', async (req, res) => {
  try {
    const { title, description, educatorId, duration, category } = req.body;

    if (!title || !description || !educatorId) {
      return res.status(400).json({ error: 'Title, description, and educatorId are required' });
    }

    // Verify educator exists
    const educator = await db.collection('users').doc(educatorId).get();
    if (!educator.exists || educator.data().role !== 'educator') {
      return res.status(403).json({ error: 'Only educators can create courses' });
    }

    const courseData = {
      title,
      description,
      educatorId,
      educatorName: educator.data().name,
      duration: duration || '',
      category: category || 'General',
      enrolledStudents: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('courses').add(courseData);

    res.status(201).json({ 
      message: 'Course created successfully', 
      courseId: docRef.id,
      course: courseData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get All Courses
app.get('/api/courses', async (req, res) => {
  try {
    const { educatorId, category } = req.query;
    let query = db.collection('courses');
    
    if (educatorId) {
      query = query.where('educatorId', '==', educatorId);
    }
    if (category) {
      query = query.where('category', '==', category);
    }

    const snapshot = await query.get();
    const courses = [];
    
    snapshot.forEach(doc => {
      courses.push({ id: doc.id, ...doc.data() });
    });

    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Single Course
app.get('/api/courses/:id', async (req, res) => {
  try {
    const doc = await db.collection('courses').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Course
app.put('/api/courses/:id', async (req, res) => {
  try {
    const { title, description, duration, category } = req.body;
    const updateData = {};

    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (duration) updateData.duration = duration;
    if (category) updateData.category = category;
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await db.collection('courses').doc(req.params.id).update(updateData);

    res.json({ message: 'Course updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Course
app.delete('/api/courses/:id', async (req, res) => {
  try {
    // Delete all materials in the course
    const materialsSnapshot = await db.collection('courses').doc(req.params.id)
      .collection('materials').get();
    
    const batch = db.batch();
    materialsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Delete the course
    await db.collection('courses').doc(req.params.id).delete();
    
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enroll Student in Course
app.post('/api/courses/:id/enroll', async (req, res) => {
  try {
    const { studentId } = req.body;
    const courseId = req.params.id;

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    // Verify student exists
    const student = await db.collection('users').doc(studentId).get();
    if (!student.exists || student.data().role !== 'learner') {
      return res.status(403).json({ error: 'Only learners can enroll in courses' });
    }

    // Add student to course
    await db.collection('courses').doc(courseId).update({
      enrolledStudents: admin.firestore.FieldValue.arrayUnion(studentId)
    });

    res.json({ message: 'Student enrolled successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== LEARNING MATERIAL ROUTES ====================

// Create Learning Material
app.post('/api/courses/:courseId/materials', async (req, res) => {
  try {
    const { title, type, content, url } = req.body;
    const courseId = req.params.courseId;

    if (!title || !type) {
      return res.status(400).json({ error: 'Title and type are required' });
    }

    const materialData = {
      title,
      type, // 'document', 'video', 'link', etc.
      content: content || '',
      url: url || '',
      courseId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('courses').doc(courseId)
      .collection('materials').add(materialData);

    res.status(201).json({ 
      message: 'Material created successfully', 
      materialId: docRef.id,
      material: materialData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get All Materials for a Course
app.get('/api/courses/:courseId/materials', async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const snapshot = await db.collection('courses').doc(courseId)
      .collection('materials').get();
    
    const materials = [];
    snapshot.forEach(doc => {
      materials.push({ id: doc.id, ...doc.data() });
    });

    res.json(materials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Single Material
app.get('/api/courses/:courseId/materials/:materialId', async (req, res) => {
  try {
    const { courseId, materialId } = req.params;
    const doc = await db.collection('courses').doc(courseId)
      .collection('materials').doc(materialId).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Material not found' });
    }

    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Material
app.put('/api/courses/:courseId/materials/:materialId', async (req, res) => {
  try {
    const { courseId, materialId } = req.params;
    const { title, type, content, url } = req.body;
    const updateData = {};

    if (title) updateData.title = title;
    if (type) updateData.type = type;
    if (content !== undefined) updateData.content = content;
    if (url !== undefined) updateData.url = url;
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await db.collection('courses').doc(courseId)
      .collection('materials').doc(materialId).update(updateData);

    res.json({ message: 'Material updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Material
app.delete('/api/courses/:courseId/materials/:materialId', async (req, res) => {
  try {
    const { courseId, materialId } = req.params;
    await db.collection('courses').doc(courseId)
      .collection('materials').doc(materialId).delete();
    
    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== ASSESSMENT ROUTES ====================

// Create Assessment
app.post('/api/courses/:courseId/assessments', async (req, res) => {
  try {
    const { title, description, dueDate, totalMarks } = req.body;
    const courseId = req.params.courseId;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const assessmentData = {
      title,
      description: description || '',
      dueDate: dueDate || null,
      totalMarks: totalMarks || 100,
      courseId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('courses').doc(courseId)
      .collection('assessments').add(assessmentData);

    res.status(201).json({ 
      message: 'Assessment created successfully', 
      assessmentId: docRef.id,
      assessment: assessmentData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get All Assessments for a Course
app.get('/api/courses/:courseId/assessments', async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const snapshot = await db.collection('courses').doc(courseId)
      .collection('assessments').get();
    
    const assessments = [];
    snapshot.forEach(doc => {
      assessments.push({ id: doc.id, ...doc.data() });
    });

    res.json(assessments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit Assessment (Student)
app.post('/api/courses/:courseId/assessments/:assessmentId/submit', async (req, res) => {
  try {
    const { courseId, assessmentId } = req.params;
    const { studentId, submissionContent } = req.body;

    if (!studentId || !submissionContent) {
      return res.status(400).json({ error: 'Student ID and submission content are required' });
    }

    const submissionData = {
      studentId,
      assessmentId,
      courseId,
      submissionContent,
      marks: null,
      feedback: '',
      submittedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('submissions').add(submissionData);

    res.status(201).json({ 
      message: 'Assessment submitted successfully', 
      submissionId: docRef.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Grade Assessment (Educator)
app.put('/api/submissions/:submissionId/grade', async (req, res) => {
  try {
    const { marks, feedback } = req.body;
    
    if (marks === undefined) {
      return res.status(400).json({ error: 'Marks are required' });
    }

    await db.collection('submissions').doc(req.params.submissionId).update({
      marks,
      feedback: feedback || '',
      gradedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Assessment graded successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Student Submissions
app.get('/api/submissions', async (req, res) => {
  try {
    const { studentId, courseId, assessmentId } = req.query;
    let query = db.collection('submissions');
    
    if (studentId) query = query.where('studentId', '==', studentId);
    if (courseId) query = query.where('courseId', '==', courseId);
    if (assessmentId) query = query.where('assessmentId', '==', assessmentId);

    const snapshot = await query.get();
    const submissions = [];
    
    snapshot.forEach(doc => {
      submissions.push({ id: doc.id, ...doc.data() });
    });

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Edu Fairuzullah LMS API',
    version: '1.0.0'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Edu Fairuzullah LMS server running on port ${PORT}`);
});

// Unenroll Student from Course
app.post('/api/courses/:id/unenroll', async (req, res) => {
    try {
        const { studentId } = req.body;
        const courseId = req.params.id;

        if (!studentId) {
            return res.status(400).json({ error: 'Student ID is required' });
        }

        // Remove student from course
        await db.collection('courses').doc(courseId).update({
            enrolledStudents: admin.firestore.FieldValue.arrayRemove(studentId)
        });

        res.json({ message: 'Student unenrolled successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});