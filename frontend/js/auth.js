// Authentication functions
// Note: Since the backend uses Firebase Admin SDK, we'll use a simple authentication
// system that stores user info in localStorage after registration/login
// In production, you should integrate with Firebase Client SDK for proper authentication

async function register(name, email, password, role) {
    try {
        const result = await createUser({ name, email, password, role });
        
        if (result.user) {
            // Store user info in localStorage
            const userData = {
                uid: result.user.uid,
                name: result.user.name,
                email: result.user.email,
                role: result.user.role
            };
            localStorage.setItem('currentUser', JSON.stringify(userData));
            return { success: true, user: userData };
        } else {
            return { success: false, error: result.error || 'Registration failed' };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Simple login - in production, use Firebase Auth
// For now, we'll check if user exists and allow login
async function login(email, password) {
    try {
        // Get all users and find matching email
        const users = await getUsers();
        const user = users.find(u => u.email === email);
        
        if (!user) {
            return { success: false, error: 'User not found' };
        }
        
        // In production, verify password with Firebase Auth
        // For now, we'll just check if user exists
        const userData = {
            uid: user.uid || user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userData));
        return { success: true, user: userData };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function isAuthenticated() {
    const user = localStorage.getItem('currentUser');
    return user !== null;
}

function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}
