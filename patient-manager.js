
// Patient Management Module

// Local state for full user object (to avoid conflict with global window.currentUser string)
let currentUser = null;

// State
window.currentPatientId = localStorage.getItem('currentPatientId') || null;
window.currentPatientData = null;
window.accessiblePatients = [];

// Initialize
function initPatientManager() {
    console.log('Initializing Patient Manager...');
    
    // Get auth instance safely
    const authInstance = (typeof firebase !== 'undefined') ? firebase.auth() : null;
    
    // Listen for auth changes to load accessible patients
    if (authInstance) {
        authInstance.onAuthStateChanged(async (user) => {
            console.log('PatientManager: Auth state changed', user ? user.email : 'Logged out');
            currentUser = user; // Update local state with full user object
            
            if (user) {
                await loadAccessiblePatients(user);
                
                // If no patient selected, or selected patient not accessible, select first available
                if (!window.currentPatientId && window.accessiblePatients.length > 0) {
                    switchPatient(window.accessiblePatients[0].id);
                } else if (window.currentPatientId) {
                    // Verify access
                    const hasAccess = window.accessiblePatients.some(p => p.id === window.currentPatientId);
                    if (hasAccess) {
                        loadPatientData(window.currentPatientId);
                    } else if (window.accessiblePatients.length > 0) {
                        switchPatient(window.accessiblePatients[0].id);
                    } else {
                        // No patients accessible
                        window.currentPatientId = null;
                        window.currentPatientData = null;
                        updatePatientUI();
                        // Prompt to create or join
                        showPatientSelectorModal();
                    }
                } else {
                    // No patients at all
                    showPatientSelectorModal();
                }
            } else {
                window.accessiblePatients = [];
                window.currentPatientId = null;
                window.currentPatientData = null;
            }
        });
    }
}

// Ensure legacy patient document exists
async function ensureLegacyPatientExists(user) {
    if (!db) return;
    
    const legacyId = 'jens-legacy';
    const docRef = db.collection('patients').doc(legacyId);
    
    try {
        const doc = await docRef.get();
        if (!doc.exists) {
            console.log('Creating legacy patient document for Jens...');
            await docRef.set({
                name: 'Jens',
                description: 'Hovedpasient (Legacy)',
                needs: 'Standard oppsett',
                ownerId: user.uid,
                allowedEmails: user.email ? [user.email] : [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: user.uid,
                isLegacy: true
            });
            console.log('Legacy patient created.');
        }
    } catch (error) {
        console.error('Error ensuring legacy patient:', error);
    }
}

// Load accessible patients for user
async function loadAccessiblePatients(user) {
    if (!db) return;
    
    try {
        const patients = [];
        const patientIds = new Set();
        const requestCounts = {}; // Store pending request counts

        // Superadmin bypass
        if (user.email && user.email.toLowerCase() === 'superadmin@jensapp.no') {
            const allSnapshot = await db.collection('patients').get();
            const countPromises = [];
            
            allSnapshot.forEach(doc => {
                patients.push({ id: doc.id, ...doc.data() });
                patientIds.add(doc.id);
                
                // Fetch request counts
                const p = db.collection('patients').doc(doc.id).collection('access_requests')
                    .where('status', '==', 'pending')
                    .get()
                    .then(snap => {
                         if (!snap.empty) {
                             requestCounts[doc.id] = snap.size;
                         }
                    })
                    .catch(e => console.error('Error fetching count for', doc.id, e));
                countPromises.push(p);
            });
            await Promise.all(countPromises);
            
            window.accessiblePatients = patients;
            window.patientRequestCounts = requestCounts;
            updatePatientMenu();
            return;
        }

        // 1. Fetch patients owned by user
        const ownedSnapshot = await db.collection('patients')
            .where('ownerId', '==', user.uid)
            .get();
        
        // Fetch request counts for owned patients in parallel
        const countPromises = [];
        
        ownedSnapshot.forEach(doc => {
            if (!patientIds.has(doc.id)) {
                patients.push({ id: doc.id, ...doc.data() });
                patientIds.add(doc.id);
                
                // Check for pending requests
                const p = db.collection('patients').doc(doc.id).collection('access_requests')
                    .where('status', '==', 'pending')
                    .get()
                    .then(snap => {
                        if (!snap.empty) {
                            requestCounts[doc.id] = snap.size;
                        }
                    })
                    .catch(e => console.error('Error fetching count for', doc.id, e));
                countPromises.push(p);
            }
        });

        await Promise.all(countPromises);

        // 2. Fetch patients shared with user (via email)
        if (user.email) {
            try {
                // Check both original and lowercase email to handle casing issues
                const emailsToCheck = [user.email];
                if (user.email.toLowerCase() !== user.email) {
                    emailsToCheck.push(user.email.toLowerCase());
                }

                const sharedSnapshot = await db.collection('patients')
                    .where('allowedEmails', 'array-contains-any', emailsToCheck)
                    .get();
                
                sharedSnapshot.forEach(doc => {
                    if (!patientIds.has(doc.id)) {
                        patients.push({ id: doc.id, ...doc.data() });
                        patientIds.add(doc.id);
                    }
                });
            } catch (e) {
                console.error("Error fetching shared patients:", e);
            }
        }
        
        window.accessiblePatients = patients;
        window.patientRequestCounts = requestCounts; // Store globally
        updatePatientMenu();
        
    } catch (error) {
        console.error('Error loading patients:', error);
    }
}

// Switch current patient
function switchPatient(patientId) {
    if (window.currentPatientId === patientId) return;
    
    console.log('Switching to patient:', patientId);
    
    // Clear current data to prevent bleeding
    window.currentPatientId = patientId;
    window.currentPatientData = null;
    window.logs = [];
    window.reminders = [];
    window.customPlans = [];
    window.customMedicines = {};
    window.checklistItems = {};
    
    // Clear UI immediately
    if (typeof displayToday === 'function') displayToday();
    if (typeof displayHistory === 'function') displayHistory();
    
    localStorage.setItem('currentPatientId', patientId);
    
    loadPatientData(patientId).then(() => {
        // Restart sync with new patient path
        if (typeof startRealtimeSync === 'function') {
            startRealtimeSync(); 
        }
        
        showToast(`Byttet til pasient: ${window.currentPatientData?.name || 'Ukjent'}`);
        
        // Refresh UI
        updatePatientUI();
        
        // Reload dashboard
        if (typeof initializeApp === 'function') {
            initializeApp();
        }
    });
}

// Load patient metadata
async function loadPatientData(patientId) {
    if (!db) return;
    
    try {
        const doc = await db.collection('patients').doc(patientId).get();
        if (doc.exists) {
            window.currentPatientData = doc.data();
            updatePatientUI();
        }
    } catch (error) {
        console.error('Error loading patient data:', error);
    }
}

// Create new patient
async function createNewPatient(name, description, needs, birthDate, medicationNotes) {
    if (!db || !currentUser) return;
    
    const user = firebase.auth().currentUser;
    const email = user ? user.email : null;

    try {
        const patientData = {
            name: name,
            description: description || '',
            needs: needs || '',
            birthDate: birthDate || null,
            medicationNotes: medicationNotes || '',
            ownerId: user.uid,
            allowedEmails: email ? [email] : [],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: {
                uid: currentUser.uid,
                email: currentUser.email || 'unknown'
            }
        };
        
        // Create patient doc
        const docRef = await db.collection('patients').add(patientData);
        const patientId = docRef.id;
        
        // Reload list and switch
        await loadAccessiblePatients(user);
        switchPatient(patientId);
        
        return patientId;
    } catch (error) {
        console.error('Error creating patient:', error);
        throw error;
    }
}

// Update patient
async function updatePatient(patientId, updates) {
    if (!db) return;
    
    try {
        await db.collection('patients').doc(patientId).update(updates);
        
        // Update local data if it's the current patient
        if (patientId === window.currentPatientId) {
            window.currentPatientData = { ...window.currentPatientData, ...updates };
            updatePatientUI();
        }
        
        showToast('✅ Pasient oppdatert!');
    } catch (error) {
        console.error('Error updating patient:', error);
        showToast('⚠️ Feil ved oppdatering');
        throw error;
    }
}

// Add access to patient
async function addPatientAccess(patientId, email) {
    if (!db) return;
    
    try {
        await db.collection('patients').doc(patientId).update({
            allowedEmails: firebase.firestore.FieldValue.arrayUnion(email)
        });
        showToast(`✅ Tilgang gitt til ${email}`);
        
        // Reload if it's current patient to update UI if needed
        if (patientId === window.currentPatientId) {
            loadPatientData(patientId);
        }
    } catch (error) {
        console.error('Error adding access:', error);
        showToast('⚠️ Kunne ikke gi tilgang');
    }
}

// Remove access from patient
async function removePatientAccess(patientId, email) {
    if (!db) return;
    
    try {
        await db.collection('patients').doc(patientId).update({
            allowedEmails: firebase.firestore.FieldValue.arrayRemove(email)
        });
        showToast(`🗑️ Tilgang fjernet for ${email}`);
        
        if (patientId === window.currentPatientId) {
            loadPatientData(patientId);
        }
    } catch (error) {
        console.error('Error removing access:', error);
        showToast('⚠️ Kunne ikke fjerne tilgang');
    }
}

// UI Updates
function updatePatientUI() {
    const headerTitle = document.getElementById('header-patient-name');
    if (headerTitle && window.currentPatientData) {
        headerTitle.textContent = window.currentPatientData.name;
    }
    
    const menuTitle = document.getElementById('currentPatientNameMenu');
    if (menuTitle) {
        menuTitle.textContent = window.currentPatientData ? window.currentPatientData.name : 'Velg pasient';
    }
    
    
    const menuRole = document.getElementById('currentPatientRoleMenu');
    if (menuRole) {
        const isSuperAdmin = currentUser && currentUser.email === 'superadmin@jensapp.no';
        // Check ownerId, fallback to createdBy.uid if legacy data
        const ownerId = window.currentPatientData ? (window.currentPatientData.ownerId || (window.currentPatientData.createdBy ? window.currentPatientData.createdBy.uid : null)) : null;
        const isOwner = window.currentPatientData && (currentUser && (ownerId === currentUser.uid) || isSuperAdmin);
        
        let roleText = 'Gjest (Klikk for å bytte)';
        if (isOwner) {
            roleText = isSuperAdmin && ownerId !== (currentUser ? currentUser.uid : '') ? 'Superadmin (Klikk for å bytte)' : 'Eier (Klikk for å bytte)';
        }
        menuRole.textContent = roleText;
        
        // Add debug info on click if Gjest
        if (!isOwner && currentUser && window.currentPatientData) {
            menuRole.onclick = () => {
                // Show debug info only if holding Shift or just always for now since it's a requested fix
                // But better to just show it briefly then open modal
                console.log('Debug Gjest:', { myUid: currentUser.uid, ownerId: ownerId, patient: window.currentPatientData });
                showToast(`Info: Eier-ID: ${ownerId ? ownerId.slice(0,6)+'...' : 'Mangler'} | Din ID: ${currentUser.uid.slice(0,6)}...`);
                setTimeout(() => showPatientSelectorModal(), 2000);
            };
        } else {
            menuRole.onclick = () => showPatientSelectorModal();
        }
    }

    // Check for pending requests if owner or superadmin
    const ownerId = window.currentPatientData ? (window.currentPatientData.ownerId || (window.currentPatientData.createdBy ? window.currentPatientData.createdBy.uid : null)) : null;
    if (window.currentPatientData && (currentUser && (ownerId === currentUser.uid) || (currentUser && currentUser.email === 'superadmin@jensapp.no'))) {
        checkPendingRequests(window.currentPatientId);
    }
}

async function checkPendingRequests(patientId) {
    if (!db) return;
    try {
        const snapshot = await db.collection('patients').doc(patientId).collection('access_requests')
            .where('status', '==', 'pending')
            .get();
        
        const btn = document.getElementById('patientSettingsBtn'); // We might need to add this ID to the button
        if (snapshot.size > 0) {
            // Show badge or notification
            showToast(`🔔 Du har ${snapshot.size} ventende forespørsler om tilgang!`);
            // Could add visual indicator to settings button if we had a reference
        }
    } catch (e) {
        console.error('Error checking requests:', e);
    }
}

function updatePatientMenu() {
    const listContainer = document.getElementById('patientListContainer');
    if (!listContainer) return;
    
    let html = '';
    
    if (window.accessiblePatients.length === 0) {
        html = `
            <div class="text-center text-muted py-4">
                <i class="bi bi-person-x fs-1 mb-2 d-block"></i>
                <p>Ingen pasienter funnet</p>
                <div class="small mb-3 alert alert-light d-inline-block text-start">
                    <i class="bi bi-info-circle me-1"></i>Debug Info:<br>
                    E-post: <strong>${currentUser ? currentUser.email : 'Ikke logget inn'}</strong><br>
                    UID: <span class="text-break" style="font-size: 0.7em">${currentUser ? currentUser.uid : '-'}</span>
                </div>
                <br>
                <button class="btn btn-outline-primary rounded-pill btn-sm mt-2" onclick="showJoinPatientModal()">
                    <i class="bi bi-search me-1"></i>Finn eksisterende
                </button>
            </div>
        `;
    } else {
        window.accessiblePatients.forEach(p => {
            const isActive = p.id === window.currentPatientId;
            const isSuperAdmin = currentUser && currentUser.email === 'superadmin@jensapp.no';
            // Check ownerId, fallback to createdBy.uid if legacy data
            const ownerId = p.ownerId || (p.createdBy ? p.createdBy.uid : null);
            const isOwner = (currentUser && ownerId === currentUser.uid) || isSuperAdmin;
            
            // Badge logic
            let badgeHtml = '<span class="badge bg-info ms-2" style="font-size: 0.7em;">GJEST</span>';
            if (isOwner) {
                if (isSuperAdmin && ownerId !== (currentUser ? currentUser.uid : null)) {
                    badgeHtml = '<span class="badge bg-danger ms-2" style="font-size: 0.7em;">SUPERADMIN</span>';
                } else {
                    badgeHtml = '<span class="badge bg-warning text-dark ms-2" style="font-size: 0.7em;">EIER</span>';
                }
            }
            
            html += `
                <div class="d-flex align-items-center mb-2">
                    <button class="list-group-item list-group-item-action border-0 rounded-4 px-3 py-3 d-flex align-items-center flex-grow-1 ${isActive ? 'bg-primary bg-opacity-10' : 'bg-light'}" 
                            onclick="switchPatient('${p.id}'); bootstrap.Modal.getInstance(document.getElementById('patientSelectorModal')).hide();">
                        <div style="width: 40px; height: 40px; background: ${isActive ? '#4CAF50' : '#e9ecef'}; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-right: 16px; color: ${isActive ? 'white' : '#666'}; font-size: 1.2rem;">
                            <i class="bi bi-person-fill"></i>
                        </div>
                        <div class="flex-grow-1 text-start">
                            <div style="font-weight: 600; color: #333; font-size: 1.05rem;">
                                ${p.name} 
                                ${badgeHtml}
                            </div>
                            <div style="font-size: 0.8rem; color: #888;">
                                ${p.description || 'Ingen beskrivelse'}
                                <div class="mt-1 d-flex align-items-center">
                                    <code class="user-select-all bg-light px-2 py-1 rounded border" style="color: #666;">${p.id}</code>
                                </div>
                            </div>
                        </div>
                        ${isActive ? '<i class="bi bi-check-circle-fill text-primary"></i>' : ''}
                    </button>
                    
                    ${isOwner ? `
                        <button class="btn btn-light ms-2 rounded-circle p-0 d-flex align-items-center justify-content-center position-relative" style="width: 48px; height: 48px;" onclick="showPatientSettingsModal('${p.id}'); bootstrap.Modal.getInstance(document.getElementById('patientSelectorModal')).hide();">
                            <i class="bi bi-gear-fill text-muted"></i>
                        </button>
                    ` : ''}
                </div>
            `;
        });
        
        // Add "Join" button at bottom
        html += `
            <div class="mt-3 pt-3 border-top">
                <button class="btn btn-outline-secondary w-100 rounded-pill py-2" onclick="showJoinPatientModal()">
                    <i class="bi bi-person-plus me-2"></i>Koble til eksisterende pasient
                </button>
            </div>
        `;
    }
    
    listContainer.innerHTML = html;
}

// Join Patient Modal
function showJoinPatientModal() {
    // Close selector
    const selector = bootstrap.Modal.getInstance(document.getElementById('patientSelectorModal'));
    if (selector) selector.hide();
    
    const modalHtml = `
        <div class="modal fade" id="joinPatientModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content rounded-5 border-0 shadow-lg">
                    <div class="modal-header border-0 pb-0">
                        <h5 class="modal-title fw-bold">Koble til pasient</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4">
                        <p class="text-muted small mb-4">Be eieren av pasientprofilen om <strong>Pasient-ID</strong> for å be om tilgang.</p>
                        
                        <form id="joinPatientForm">
                            <div class="mb-4">
                                <label class="form-label fw-bold">Pasient-ID</label>
                                <input type="text" class="form-control form-control-lg rounded-4 text-center font-monospace" id="joinPatientId" required placeholder="Lim inn ID her...">
                            </div>
                            <button type="submit" class="btn btn-primary w-100 py-3 rounded-pill fw-bold shadow-sm">
                                <i class="bi bi-send me-2"></i>Send forespørsel
                            </button>
                        </form>
                        
                        <div class="text-center mt-3">
                            <button type="button" class="btn btn-link text-muted text-decoration-none" onclick="bootstrap.Modal.getInstance(document.getElementById('joinPatientModal')).hide(); showPatientSelectorModal();">
                                Avbryt
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const old = document.getElementById('joinPatientModal');
    if (old) old.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modal = new bootstrap.Modal(document.getElementById('joinPatientModal'));
    modal.show();
    
    document.getElementById('joinPatientForm').onsubmit = async (e) => {
        e.preventDefault();
        const pid = document.getElementById('joinPatientId').value.trim();
        if (pid) {
            await requestAccess(pid);
            modal.hide();
        }
    };
}

async function requestAccess(patientId) {
    if (!db || !currentUser) return;
    
    try {
        // Check if patient exists first
        const doc = await db.collection('patients').doc(patientId).get();
        if (!doc.exists) {
            showToast('⚠️ Fant ingen pasient med denne ID-en');
            return;
        }
        
        // Add request
        await db.collection('patients').doc(patientId).collection('access_requests').add({
            userId: currentUser.uid,
            userEmail: currentUser.email,
            userName: currentUser.displayName || 'Ukjent bruker',
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('✅ Forespørsel sendt til eier!');
    } catch (error) {
        console.error('Error requesting access:', error);
        showToast('⚠️ Kunne ikke sende forespørsel');
    }
}


// Modals
function showCreatePatientModal() {
    // Close selector if open
    const selector = bootstrap.Modal.getInstance(document.getElementById('patientSelectorModal'));
    if (selector) selector.hide();
    
    const modalHtml = `
        <div class="modal fade" id="createPatientModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content rounded-5 border-0 shadow-lg">
                    <div class="modal-header border-0 pb-0">
                        <h5 class="modal-title fw-bold">Ny Pasient</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4">
                        <form id="createPatientForm">
                            <div class="mb-3">
                                <label class="form-label fw-bold">Navn</label>
                                <input type="text" class="form-control form-control-lg rounded-4" id="newPatientName" required placeholder="F.eks. Jens">
                            </div>
                            <div class="mb-3">
                                <label class="form-label fw-bold">Fødselsdato</label>
                                <input type="date" class="form-control rounded-4" id="newPatientDob">
                            </div>
                            <div class="mb-3">
                                <label class="form-label fw-bold">Beskrivelse / Diagnose</label>
                                <textarea class="form-control rounded-4" id="newPatientDesc" rows="2" placeholder="Kort beskrivelse av helsetilstand..."></textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label fw-bold">Medisiner</label>
                                <textarea class="form-control rounded-4" id="newPatientMeds" rows="2" placeholder="Liste over medisiner..."></textarea>
                            </div>
                            <div class="mb-4">
                                <label class="form-label fw-bold">Andre Behov</label>
                                <textarea class="form-control rounded-4" id="newPatientNeeds" rows="2" placeholder="Andre viktige behov..."></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary w-100 py-3 rounded-pill fw-bold shadow-sm">
                                Opprett Pasient
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Cleanup old
    const old = document.getElementById('createPatientModal');
    if (old) old.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modal = new bootstrap.Modal(document.getElementById('createPatientModal'));
    modal.show();
    
    document.getElementById('createPatientForm').onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('newPatientName').value;
        const dob = document.getElementById('newPatientDob').value;
        const desc = document.getElementById('newPatientDesc').value;
        const meds = document.getElementById('newPatientMeds').value;
        const needs = document.getElementById('newPatientNeeds').value;
        
        try {
            await createNewPatient(name, desc, needs, dob, meds);
            modal.hide();
            showToast('✅ Pasient opprettet!');
        } catch (err) {
            showToast('⚠️ Feil ved opprettelse');
        }
    };
}

function showEditPatientModal(patientId) {
    const patient = window.accessiblePatients.find(p => p.id === patientId);
    if (!patient) return;

    // Close settings if open
    const settings = bootstrap.Modal.getInstance(document.getElementById('patientSettingsModal'));
    if (settings) settings.hide();
    
    const modalHtml = `
        <div class="modal fade" id="editPatientModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content rounded-5 border-0 shadow-lg">
                    <div class="modal-header border-0 pb-0">
                        <h5 class="modal-title fw-bold">Rediger Pasient</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4">
                        <form id="editPatientForm">
                            <div class="mb-3">
                                <label class="form-label fw-bold">Navn</label>
                                <input type="text" class="form-control form-control-lg rounded-4" id="editPatientName" required value="${patient.name || ''}">
                            </div>
                            <div class="mb-3">
                                <label class="form-label fw-bold">Fødselsdato</label>
                                <input type="date" class="form-control rounded-4" id="editPatientDob" value="${patient.birthDate || ''}">
                            </div>
                            <div class="mb-3">
                                <label class="form-label fw-bold">Beskrivelse / Diagnose</label>
                                <textarea class="form-control rounded-4" id="editPatientDesc" rows="2">${patient.description || ''}</textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label fw-bold">Medisiner</label>
                                <textarea class="form-control rounded-4" id="editPatientMeds" rows="2">${patient.medicationNotes || ''}</textarea>
                            </div>
                            <div class="mb-4">
                                <label class="form-label fw-bold">Andre Behov</label>
                                <textarea class="form-control rounded-4" id="editPatientNeeds" rows="2">${patient.needs || ''}</textarea>
                            </div>
                            <button type="submit" class="btn btn-primary w-100 py-3 rounded-pill fw-bold shadow-sm">
                                Lagre Endringer
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Cleanup old
    const old = document.getElementById('editPatientModal');
    if (old) old.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modal = new bootstrap.Modal(document.getElementById('editPatientModal'));
    modal.show();
    
    document.getElementById('editPatientForm').onsubmit = async (e) => {
        e.preventDefault();
        const updates = {
            name: document.getElementById('editPatientName').value,
            birthDate: document.getElementById('editPatientDob').value,
            description: document.getElementById('editPatientDesc').value,
            medicationNotes: document.getElementById('editPatientMeds').value,
            needs: document.getElementById('editPatientNeeds').value
        };
        
        try {
            await updatePatient(patientId, updates);
            modal.hide();
            // Re-open settings? Maybe not needed, user can verify in UI
        } catch (err) {
            showToast('⚠️ Feil ved lagring');
        }
    };
}

function showPatientSelectorModal() {
    // We assume the modal HTML structure is already in index.html, we just update the list
    updatePatientMenu();
    const el = document.getElementById('patientSelectorModal');
    if (el) {
        const modal = new bootstrap.Modal(el);
        modal.show();
    }
}

async function showPatientSettingsModal(patientId) {
    const patient = window.accessiblePatients.find(p => p.id === patientId);
    if (!patient) return;
    
    const allowedEmails = patient.allowedEmails || [];
    
    let emailsHtml = '';
    if (allowedEmails.length === 0) {
        emailsHtml = '<div class="text-muted small fst-italic">Ingen deling aktivert</div>';
    } else {
        allowedEmails.forEach(email => {
            // Don't show remove button for owner if owner is in list (optional, but let's allow removing self if crazy)
            // But usually we don't remove owner access.
            const isMe = email === firebase.auth().currentUser?.email;
            
            emailsHtml += `
                <div class="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded-3">
                    <span class="small fw-bold text-dark">${email} ${isMe ? '(Deg)' : ''}</span>
                    <button class="btn btn-sm btn-outline-danger border-0" onclick="removePatientAccess('${patientId}', '${email}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `;
        });
    }

    // Load access requests
    let requestsHtml = '';
    try {
        const reqSnapshot = await db.collection('patients').doc(patientId).collection('access_requests')
            .where('status', '==', 'pending')
            .get();
        
        if (!reqSnapshot.empty) {
            requestsHtml = '<h6 class="fw-bold mb-2 mt-4 text-warning">Ventende forespørsler</h6>';
            reqSnapshot.forEach(doc => {
                const req = doc.data();
                requestsHtml += `
                    <div class="d-flex justify-content-between align-items-center mb-2 p-2 bg-warning bg-opacity-10 rounded-3 border border-warning">
                        <div>
                            <div class="small fw-bold text-dark">${req.userEmail || 'Ukjent e-post'}</div>
                            <div class="small text-muted" style="font-size: 0.75rem;">${req.userName || 'Ukjent bruker'}</div>
                        </div>
                        <div class="d-flex gap-1">
                            <button class="btn btn-sm btn-success" onclick="approveAccessRequest('${patientId}', '${doc.id}', '${req.userEmail}')">
                                <i class="bi bi-check-lg"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="denyAccessRequest('${patientId}', '${doc.id}')">
                                <i class="bi bi-x-lg"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
        }
    } catch (e) {
        console.error('Error loading requests:', e);
    }

    const ownerId = patient.ownerId || (patient.createdBy ? patient.createdBy.uid : null);
    const isOwner = (currentUser && ownerId === currentUser.uid) || (currentUser && currentUser.email === 'superadmin@jensapp.no');

    const modalHtml = `
        <div class="modal fade" id="patientSettingsModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content rounded-5 border-0 shadow-lg">
                    <div class="modal-header border-0 pb-0">
                        <h5 class="modal-title fw-bold">Innstillinger: ${patient.name}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body p-4">
                        ${isOwner ? `
                        <div class="mb-4">
                            <button class="btn btn-outline-primary w-100 rounded-pill" onclick="showEditPatientModal('${patientId}')">
                                <i class="bi bi-pencil me-2"></i>Rediger Pasientinfo
                            </button>
                        </div>
                        ` : ''}
                        
                        <!-- Patient ID Display -->
                        <div class="bg-light p-3 rounded-4 mb-4 text-center">
                            <label class="small text-muted text-uppercase fw-bold mb-1">Pasient-ID (Del denne)</label>
                            <div class="d-flex align-items-center justify-content-center gap-2">
                                <code class="fs-5 fw-bold text-dark user-select-all" id="pid-display">${patientId}</code>
                                <button class="btn btn-sm btn-link text-muted p-0" onclick="navigator.clipboard.writeText('${patientId}'); showToast('📋 ID kopiert!')">
                                    <i class="bi bi-clipboard"></i>
                                </button>
                            </div>
                        </div>

                        ${requestsHtml}

                        <h6 class="fw-bold mb-3">Deling og Tilgang</h6>
                        <div class="mb-3">
                            <label class="form-label small text-muted">Gi tilgang til e-post</label>
                            <div class="input-group">
                                <input type="email" class="form-control rounded-start-4" id="shareEmailInput" placeholder="bruker@example.com">
                                <button class="btn btn-primary rounded-end-4" type="button" id="shareBtn">
                                    Legg til
                                </button>
                            </div>
                        </div>
                        
                        <div class="mb-4">
                            <label class="form-label small text-muted">Personer med tilgang</label>
                            <div id="accessListContainer" class="border rounded-4 p-3" style="max-height: 200px; overflow-y: auto;">
                                ${emailsHtml}
                            </div>
                        </div>
                        
                        <div class="d-grid gap-2">
                            <button class="btn btn-outline-secondary rounded-pill" onclick="bootstrap.Modal.getInstance(document.getElementById('patientSettingsModal')).hide(); showPatientSelectorModal();">
                                Tilbake til oversikt
                            </button>
                            ${patientId !== 'jens-legacy' ? `
                            <hr class="my-2">
                            <button class="btn btn-warning rounded-pill small" onclick="migrateLegacyData('${patientId}')">
                                <i class="bi bi-database-up me-2"></i>Importer eksisterende data (Legacy)
                            </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Cleanup old
    const old = document.getElementById('patientSettingsModal');
    if (old) old.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    const modal = new bootstrap.Modal(document.getElementById('patientSettingsModal'));
    modal.show();
    
    // Bind Add button
    document.getElementById('shareBtn').onclick = async () => {
        const email = document.getElementById('shareEmailInput').value.trim();
        if (email && email.includes('@')) {
            await addPatientAccess(patientId, email);
            modal.hide();
            showPatientSettingsModal(patientId); // Refresh
        } else {
            showToast('⚠️ Ugyldig e-post');
        }
    };
}

// Import legacy data
async function migrateLegacyData(patientId) {
    if (!db) return;
    if (!confirm('Vil du importere data fra den gamle databasen?')) return;
    
    showToast('🚀 Starter migrering...');
    
    try {
        const batchSize = 500;
        let batch = db.batch();
        let count = 0;
        let total = 0;
        
        // Helper to migrate collection
        const migrateCollection = async (colName) => {
            const snapshot = await db.collection(colName).get();
            console.log(`Migrating ${snapshot.size} docs from ${colName}`);
            
            for (const doc of snapshot.docs) {
                const newRef = db.collection('patients').doc(patientId).collection(colName).doc(doc.id);
                batch.set(newRef, doc.data());
                count++;
                total++;
                
                if (count >= batchSize) {
                    await batch.commit();
                    batch = db.batch();
                    count = 0;
                    showToast(`⏳ Migrert ${total} dokumenter...`);
                }
            }
        };

        // Helper to migrate single document (checklist)
        const migrateChecklist = async () => {
            const doc = await db.collection('checklist').doc('global').get();
            if (doc.exists) {
                console.log('Migrating checklist/global');
                const newRef = db.collection('patients').doc(patientId).collection('checklist').doc('global');
                batch.set(newRef, doc.data());
                count++;
                total++;
            }
        };
        
        await migrateChecklist();
        await migrateCollection('logs');
        await migrateCollection('reminders');
        await migrateCollection('customPlans');
        // customMedicines might be shared, but let's migrate if exists
        await migrateCollection('customMedicines');
        
        if (count > 0) {
            await batch.commit();
        }
        
        showToast('✅ Migrering ferdig!');
        loadPatientData(patientId);
        
    } catch (error) {
        console.error('Migration error:', error);
        showToast('⚠️ Feil under migrering');
    }
}

// Access Request Handlers
async function approveAccessRequest(patientId, requestId, email) {
    if (!db) return;
    
    try {
        const batch = db.batch();
        
        // 1. Add email to allowedEmails
        const patientRef = db.collection('patients').doc(patientId);
        batch.update(patientRef, {
            allowedEmails: firebase.firestore.FieldValue.arrayUnion(email)
        });
        
        // 2. Update request status
        const requestRef = db.collection('patients').doc(patientId).collection('access_requests').doc(requestId);
        batch.update(requestRef, {
            status: 'approved',
            processedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        await batch.commit();
        showToast(`✅ Tilgang gitt til ${email}`);
        
        // Refresh modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('patientSettingsModal'));
        if (modal) modal.hide();
        showPatientSettingsModal(patientId);
        
    } catch (error) {
        console.error('Error approving request:', error);
        showToast('⚠️ Kunne ikke godkjenne');
    }
}

async function denyAccessRequest(patientId, requestId) {
    if (!db) return;
    
    try {
        await db.collection('patients').doc(patientId).collection('access_requests').doc(requestId).update({
            status: 'denied',
            processedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('🚫 Forespørsel avvist');
        
        // Refresh modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('patientSettingsModal'));
        if (modal) modal.hide();
        showPatientSettingsModal(patientId);
        
    } catch (error) {
        console.error('Error denying request:', error);
        showToast('⚠️ Feil ved avvisning');
    }
}
