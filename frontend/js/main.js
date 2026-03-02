// RIAPMS Main JavaScript

// API Base URL
const API_URL = '/api';

// Store token
const getToken = () => localStorage.getItem('riapms_token');
const setToken = (token) => localStorage.setItem('riapms_token', token);
const removeToken = () => localStorage.removeItem('riapms_token');

// Store user
const getUser = () => {
    const user = localStorage.getItem('riapms_user');
    return user ? JSON.parse(user) : null;
};
const setUser = (user) => localStorage.setItem('riapms_user', JSON.stringify(user));
const removeUser = () => localStorage.removeItem('riapms_user');

// Check if user is logged in
const isLoggedIn = () => !!getToken();

// Redirect if not logged in
const requireAuth = () => {
    if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
};

// API Helper
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    const token = getToken();
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Something went wrong');
        }

        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    const container = document.querySelector('.toast-container') || createToastContainer();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
    <span>${message}</span>
  `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Counter animation
function animateCounters() {
    const counters = document.querySelectorAll('.counter');

    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;

        const updateCounter = () => {
            current += step;
            if (current < target) {
                counter.textContent = Math.floor(current).toLocaleString();
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target.toLocaleString() + '+';
            }
        };

        updateCounter();
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Animate counters on home page
    if (document.querySelector('.counter')) {
        animateCounters();
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Logout function
function logout() {
    removeToken();
    removeUser();
    window.location.href = 'index.html';
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Get initials from name
function getInitials(name) {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Validate email
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Rwanda provinces
const provinces = [
    'Kigali',
    'Northern',
    'Southern',
    'Eastern',
    'Western'
];

// Rwanda districts by province
const districtsByProvince = {
    'Kigali': ['Gasabo', 'Kicukiro', 'Nyarugenge'],
    'Northern': ['Burera', 'Gakenke', 'Gicumbi', 'Musanze', 'Rulindo'],
    'Southern': ['Gisagara', 'Huye', 'Kamonyi', 'Muhanga', 'Nyamagabe', 'Nyanza', 'Nyaruguru', 'Ruhango'],
    'Eastern': ['Bugesera', 'Gatsibo', 'Kayonza', 'Kirehe', 'Ngoma', 'Nyagatare', 'Rwamagana'],
    'Western': ['Karongi', 'Ngororero', 'Nyabihu', 'Nyamasheke', 'Rubavu', 'Rusizi', 'Rutsiro']
};

// Fields of study
const fieldsOfStudy = [
    'IT',
    'Computer Science',
    'Engineering',
    'Business',
    'Marketing',
    'Finance',
    'Accounting',
    'Health',
    'Education',
    'Agriculture',
    'Tourism',
    'Hospitality',
    'Law',
    'Arts',
    'Science',
    'Other'
];

// Industries
const industries = [
    'IT',
    'Finance',
    'Healthcare',
    'Education',
    'Agriculture',
    'Tourism',
    'Hospitality',
    'Manufacturing',
    'Retail',
    'Construction',
    'Media',
    'Telecommunications',
    'Consulting',
    'NGO',
    'Government',
    'Other'
];

// Skills suggestions
const skillsList = [
    'JavaScript',
    'Python',
    'Java',
    'C++',
    'HTML/CSS',
    'React',
    'Node.js',
    'MongoDB',
    'SQL',
    'Data Analysis',
    'Machine Learning',
    'Excel',
    'PowerPoint',
    'Word',
    'Communication',
    'Teamwork',
    'Problem Solving',
    'Project Management',
    'Marketing',
    'Sales',
    'Accounting',
    'Financial Analysis',
    'Graphic Design',
    'Photography',
    'Video Editing',
    'Content Writing',
    'Social Media',
    'Customer Service',
    'Research',
    'Teaching'
];

// Export functions for use in other files
window.RIAPMS = {
    apiCall,
    getToken,
    setToken,
    removeToken,
    getUser,
    setUser,
    removeUser,
    isLoggedIn,
    requireAuth,
    showToast,
    logout,
    formatDate,
    getInitials,
    debounce,
    isValidEmail,
    provinces,
    districtsByProvince,
    fieldsOfStudy,
    industries,
    skillsList
};
