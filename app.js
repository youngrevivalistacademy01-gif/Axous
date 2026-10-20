// Main Application Controller & UI bindings for Phase 1
import { setSessionPassphrase, saveClientProfile, getAllClientProfiles, removeClientProfile } from './vault.js';

let unlocked = false;

document.getElementById('unlock-btn').addEventListener('click', async () => {
    const pass = document.getElementById('passphrase-input').value;
    if (!pass) return alert('Please enter a passphrase.');
    
    try {
        setSessionPassphrase(pass);
        // Test decryption/read
        await getAllClientProfiles();
        unlocked = true;
        document.getElementById('lock-screen').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        const statusBadge = document.getElementById('auth-status');
        statusBadge.textContent = 'Vault Unlocked';
        statusBadge.className = 'badge unlocked';
        loadClientsUI();
    } catch (err) {
        alert('Incorrect passphrase or initialization error.');
    }
});

// Tab Navigation
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        e.target.classList.add('active');
        document.getElementById(e.target.dataset.tab).classList.add('active');
    });
});

// Modal Controls
const modal = document.getElementById('client-modal');
document.getElementById('new-client-btn').addEventListener('click', () => {
    document.getElementById('client-form').reset();
    document.getElementById('client-id').value = '';
    document.getElementById('modal-title').textContent = 'Add Client';
    modal.classList.remove('hidden');
});

document.getElementById('close-modal-btn').addEventListener('click', () => {
    modal.classList.add('hidden');
});

document.getElementById('client-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const idVal = document.getElementById('client-id').value;
    const clientObj = {
        id: idVal ? Number(idVal) : undefined,
        name: document.getElementById('client-name').value,
        targetRoles: document.getElementById('client-roles').value.split(',').map(s => s.trim()),
        workAuth: document.getElementById('client-auth').value,
        masterCV: document.getElementById('client-cv').value
    };

    try {
        await saveClientProfile(clientObj);
        modal.classList.add('hidden');
        loadClientsUI();
    } catch (err) {
        alert('Error saving client: ' + err.message);
    }
});

async function loadClientsUI() {
    const clientListDiv = document.getElementById('client-list');
    try {
        const clients = await getAllClientProfiles();
        if (clients.length === 0) {
            clientListDiv.innerHTML = '<p>No clients found in vault. Add your first client above.</p>';
            return;
        }
        
        clientListDiv.innerHTML = clients.map(c => `
            <div class="card" style="margin-top: 1rem;">
                <h3>${c.name}</h3>
                <p><strong>Target Roles:</strong> ${c.targetRoles.join(', ')}</p>
                <p><strong>Work Auth:</strong> ${c.workAuth}</p>
                <button onclick="window.deleteClient(${c.id})" style="background-color: #e53e3e;">Delete Client</button>
            </div>
        `).join('');
    } catch (e) {
        clientListDiv.innerHTML = '<p style="color: red;">Error loading vault data.</p>';
    }
}

window.deleteClient = async function(id) {
    if (confirm('Are you sure you want to delete this client data?')) {
        await removeClientProfile(id);
        loadClientsUI();
    }
};

// Backup / Restore UI hooks
document.getElementById('export-backup-btn').addEventListener('click', async () => {
    const clients = await getAllClientProfiles();
    const blob = new Blob([JSON.stringify(clients, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aptus-pipeline-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
});
