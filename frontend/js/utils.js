// Utility functions
function setApiBaseUrl(url) {
    localStorage.setItem('apiBaseUrl', url);
}

function showMessage(message, type = 'success') {
    const messageDiv = document.getElementById('message');
    if (!messageDiv) {
        // Create message div if it doesn't exist
        const div = document.createElement('div');
        div.id = 'message';
        document.querySelector('.content')?.prepend(div) || document.body.prepend(div);
    }
    
    const messageElement = document.getElementById('message');
    messageElement.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    setTimeout(() => {
        if (messageElement) {
            messageElement.innerHTML = '';
        }
    }, 5000);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function checkAuth() {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    return user;
}

function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    window.location.href = 'login.html';
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser') || 'null');
}
