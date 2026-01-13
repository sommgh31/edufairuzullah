// ===============================
// Utility Functions (UI & Session)
// ===============================

/**
 * Save API base URL
 */
function setApiBaseUrl(url) {
    if (!url || typeof url !== 'string') return;
    localStorage.setItem('apiBaseUrl', url.trim());
}

/**
 * Show alert message on page
 * type: success | error | warning | info
 */
function showMessage(message, type = 'success') {
    if (!message) return;

    let messageElement = document.getElementById('message');

    // Create message container if it doesn't exist
    if (!messageElement) {
        messageElement = document.createElement('div');
        messageElement.id = 'message';

        const content = document.querySelector('.content');
        if (content) {
            content.prepend(messageElement);
        } else {
            document.body.prepend(messageElement);
        }
    }

    messageElement.innerHTML = `
        <div class="alert alert-${type}">
            ${message}
        </div>
    `;

    // Auto clear message
    setTimeout(() => {
        if (messageElement) {
            messageElement.innerHTML = '';
        }
    }, 4000);
}

/**
 * Format date safely
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Logout user safely
 */
function logout() {
    // Clear session
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');

    // Prevent redirect loops
    if (!window.location.pathname.endsWith('login.html')) {
        window.location.href = 'login.html';
    }
}

/**
 * Get current logged-in user (if any)
 */
function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('currentUser')) || null;
    } catch {
        return null;
    }
}
