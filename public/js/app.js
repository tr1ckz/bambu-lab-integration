// App state
let currentPrinters = [];

// Check authentication on load
window.addEventListener('DOMContentLoaded', async () => {
    const status = await checkAuth();
    if (status.authenticated) {
        showDashboard();
    } else {
        showLogin();
    }
});

// Bambu Lab login button handler (opens popup)
document.getElementById('bambuLoginBtn').addEventListener('click', async () => {
    const errorDiv = document.getElementById('loginError');
    errorDiv.classList.remove('show');
    
    try {
        // Open our proxy page that will handle the login
        const width = 700;
        const height = 800;
        const left = (screen.width - width) / 2;
        const top = (screen.height - height) / 2;
        
        const loginWindow = window.open(
            '/bambu-proxy/login-proxy',
            'Bambu Lab Login',
            `width=${width},height=${height},left=${left},top=${top}`
        );
        
        if (!loginWindow) {
            errorDiv.textContent = 'Please allow popups for this site';
            errorDiv.classList.add('show');
            return;
        }
        
        // Listen for success message from popup
        const messageHandler = async (event) => {
            if (event.data.type === 'BAMBU_LOGIN_SUCCESS') {
                window.removeEventListener('message', messageHandler);
                
                // Check if we're authenticated
                const status = await checkAuth();
                if (status.authenticated) {
                    showDashboard();
                }
            }
        };
        
        window.addEventListener('message', messageHandler);
        
    } catch (error) {
        errorDiv.textContent = 'Failed to open login window';
        errorDiv.classList.add('show');
    }
});

// Token login form handler (manual fallback)
document.getElementById('tokenForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const authToken = document.getElementById('authToken').value.trim();
    const errorDiv = document.getElementById('loginError');
    
    errorDiv.classList.remove('show');
    
    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ authToken })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showDashboard();
        } else {
            errorDiv.textContent = data.error || 'Token login failed';
            errorDiv.classList.add('show');
        }
    } catch (error) {
        errorDiv.textContent = 'Connection error. Please try again.';
        errorDiv.classList.add('show');
    }
});

// Logout handler
document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch('/auth/logout', { method: 'POST' });
    showLogin();
});

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        switchTab(tabName);
    });
});

// Device filter
document.getElementById('deviceFilter').addEventListener('change', (e) => {
    loadTimelapses(e.target.value);
});

// Helper functions
async function checkAuth() {
    try {
        const response = await fetch('/auth/status');
        return await response.json();
    } catch (error) {
        return { authenticated: false };
    }
}

function showLogin() {
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('dashboardScreen').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('dashboardScreen').classList.remove('hidden');
    
    // Load initial data
    loadPrinters();
    loadModels();
    loadTimelapses();
}

function switchTab(tabName) {
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

async function loadPrinters() {
    const container = document.getElementById('printersList');
    container.innerHTML = '<div class="loading">Loading printers...</div>';
    
    try {
        const response = await fetch('/api/printers', {
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                showLogin();
                return;
            }
            throw new Error('Failed to fetch printers');
        }
        
        const printers = await response.json();
        
        currentPrinters = printers;
        
        // Update device filter
        const deviceFilter = document.getElementById('deviceFilter');
        deviceFilter.innerHTML = '<option value="">All Printers</option>';
        printers.forEach(printer => {
            const option = document.createElement('option');
            option.value = printer.dev_id;
            option.textContent = printer.name || printer.dev_id;
            deviceFilter.appendChild(option);
        });
        
        if (printers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No printers found</h3>
                    <p>Connect a printer to your Bambu Cloud account</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        printers.forEach(printer => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <h3>${printer.name || 'Unnamed Printer'}</h3>
                <p><strong>Model:</strong> ${printer.dev_model_name || 'Unknown'}</p>
                <p><strong>ID:</strong> ${printer.dev_id}</p>
                <p><strong>Status:</strong> 
                    <span class="status-badge ${printer.online ? 'status-online' : 'status-offline'}">
                        ${printer.online ? 'Online' : 'Offline'}
                    </span>
                </p>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        container.innerHTML = '<div class="error-message show">Failed to load printers</div>';
    }
}

async function loadModels() {
    const container = document.getElementById('modelsList');
    container.innerHTML = '<div class="loading">Loading models...</div>';
    
    try {
        const response = await fetch('/api/models', {
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                showLogin();
                return;
            }
            throw new Error('Failed to fetch models');
        }
        
        const models = await response.json();
        
        if (models.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No print history found</h3>
                    <p>Your completed prints will appear here</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        models.forEach(model => {
            const card = document.createElement('div');
            card.className = 'card';
            
            const date = model.endTime ? new Date(model.endTime * 1000).toLocaleDateString() : 'Unknown';
            
            card.innerHTML = `
                <h3>${model.title || 'Unnamed Model'}</h3>
                <p><strong>Date:</strong> ${date}</p>
                <p><strong>Weight:</strong> ${model.weight ? model.weight + 'g' : 'N/A'}</p>
                <p><strong>Time:</strong> ${model.costTime ? formatTime(model.costTime) : 'N/A'}</p>
                ${model.cover ? `<img src="${model.cover}" alt="Model preview">` : ''}
            `;
            container.appendChild(card);
        });
    } catch (error) {
        container.innerHTML = '<div class="error-message show">Failed to load models</div>';
    }
}

async function loadTimelapses(deviceId = '') {
    const container = document.getElementById('timelapsesList');
    container.innerHTML = '<div class="loading">Loading timelapses...</div>';
    
    try {
        let url = '/api/timelapses';
        if (deviceId) {
            url += `?deviceId=${deviceId}`;
        }
        
        const response = await fetch(url, {
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                showLogin();
                return;
            }
            throw new Error('Failed to fetch timelapses');
        }
        
        const timelapses = await response.json();
        
        if (timelapses.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No timelapses found</h3>
                    <p>Your print timelapses will appear here</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        timelapses.forEach(timelapse => {
            const card = document.createElement('div');
            card.className = 'card';
            
            const date = timelapse.createTime ? new Date(timelapse.createTime * 1000).toLocaleDateString() : 'Unknown';
            
            card.innerHTML = `
                <h3>${timelapse.title || 'Unnamed Timelapse'}</h3>
                <p><strong>Date:</strong> ${date}</p>
                <p><strong>Model:</strong> ${timelapse.modelTitle || 'N/A'}</p>
                ${timelapse.url ? `
                    <video controls>
                        <source src="${timelapse.url}" type="video/mp4">
                        Your browser doesn't support video.
                    </video>
                ` : '<p>Video not available</p>'}
            `;
            container.appendChild(card);
        });
    } catch (error) {
        container.innerHTML = '<div class="error-message show">Failed to load timelapses</div>';
    }
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
}
