// server.js
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
require('dotenv').config();

// ==================== APP SETUP ====================
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// ==================== FIREBASE INIT ====================
// Cloud Run uses Application Default Credentials
admin.initializeApp();
const db = admin.firestore();

// ==================== ROOT ====================
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Edu Fairuzullah LMS API',
    version: '1.0.0'
  });
});

// ==================== USERS ====================
app.post('/api/users', async (req, res) => {
  try {
    const { name, email, role, password } = req.body;

    if (!name || !email || !role || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['educator', 'learner'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name
    });

    const userData = {
      uid: userRecord.uid,
      name,
      email,
      role,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('users').doc(userRecord.uid).set(userData);

    res.status(201).json(userData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== COURSES ====================
app.post('/api/courses', async (req, res) => {
  try {
    const { title, description, educatorId, category } = req.body;

    if (!title || !description || !educatorId) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const educator = await db.collection('users').doc(educatorId).get();
    if (!educator.exists || educator.data().role !== 'educator') {
      return res.status(403).json({ error: 'Only educators can create courses' });
    }

    const course = {
      title,
      description,
      educatorId,
      educatorName: educator.data().name,
      category: category || 'General',
      enrolledStudents: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const ref = await db.collection('courses').add(course);
    res.status(201).json({ id: ref.id, ...course });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/courses', async (req, res) => {
  try {
    const snapshot = await db.collection('courses').get();
    const courses = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/courses/:id', async (req, res) => {
  try {
    const doc = await db.collection('courses').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Course not found' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/courses/:id/enroll', async (req, res) => {
  try {
    const { studentId } = req.body;
    await db.collection('courses').doc(req.params.id).update({
      enrolledStudents: admin.firestore.FieldValue.arrayUnion(studentId)
    });
    res.json({ message: 'Enrolled successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/courses/:id/unenroll', async (req, res) => {
  try {
    const { studentId } = req.body;
    await db.collection('courses').doc(req.params.id).update({
      enrolledStudents: admin.firestore.FieldValue.arrayRemove(studentId)
    });
    res.json({ message: 'Unenrolled successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== MATERIALS ====================
app.post('/api/courses/:courseId/materials', async (req, res) => {
  try {
    const { title, type, content, url } = req.body;

    if (!title || !type) {
      return res.status(400).json({ error: 'Title and type required' });
    }

    const material = {
      title,
      type,
      content: content || '',
      url: url || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const ref = await db
      .collection('courses')
      .doc(req.params.courseId)
      .collection('materials')
      .add(material);

    res.status(201).json({ id: ref.id, ...material });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/courses/:courseId/materials', async (req, res) => {
  try {
    const snapshot = await db
      .collection('courses')
      .doc(req.params.courseId)
      .collection('materials')
      .get();

    const materials = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(materials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== ASSESSMENTS ====================
app.post('/api/courses/:courseId/assessments', async (req, res) => {
  try {
    const { title, description, totalMarks } = req.body;

    if (!title) return res.status(400).json({ error: 'Title required' });

    const assessment = {
      title,
      description: description || '',
      totalMarks: totalMarks || 100,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const ref = await db
      .collection('courses')
      .doc(req.params.courseId)
      .collection('assessments')
      .add(assessment);

    res.status(201).json({ id: ref.id, ...assessment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/courses/:courseId/assessments', async (req, res) => {
  try {
    const snapshot = await db
      .collection('courses')
      .doc(req.params.courseId)
      .collection('assessments')
      .get();

    const assessments = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(assessments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== SUBMISSIONS ====================
app.post('/api/courses/:courseId/assessments/:assessmentId/submit', async (req, res) => {
  try {
    const { studentId, submissionContent } = req.body;

    const submission = {
      studentId,
      assessmentId: req.params.assessmentId,
      courseId: req.params.courseId,
      submissionContent,
      marks: null,
      feedback: '',
      submittedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const ref = await db.collection('submissions').add(submission);
    res.status(201).json({ id: ref.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/submissions/:id/grade', async (req, res) => {
  try {
    const { marks, feedback } = req.body;

    await db.collection('submissions').doc(req.params.id).update({
      marks,
      feedback: feedback || '',
      gradedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Graded successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/submissions', async (req, res) => {
  try {
    let query = db.collection('submissions');
    if (req.query.studentId) query = query.where('studentId', '==', req.query.studentId);
    if (req.query.courseId) query = query.where('courseId', '==', req.query.courseId);
    if (req.query.assessmentId) query = query.where('assessmentId', '==', req.query.assessmentId);

    const snapshot = await query.get();
    const submissions = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== START SERVER (ONLY ONCE) ====================
app.listen(PORT, () => {
  console.log(`Edu Fairuzullah LMS server running on port ${PORT}`);
});
