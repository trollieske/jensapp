// Utility functions for Dosevakt

// Toast notification
function showToast(message) {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #28a745;
        color: white;
        padding: 15px 25px;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        z-index: 9999;
        animation: slideIn 0.3s ease-out;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

// Date/Time helpers
function setDefaultDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const timeInput = document.getElementById('time');
    if (timeInput) {
        timeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
}

function formatTime(datetime) {
    const date = new Date(datetime);
    return date.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(datetime) {
    const date = new Date(datetime);
    return date.toLocaleString('no-NO', { 
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('no-NO', { 
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}

// UI Helpers (depend on AppConfig)
function getTypeIcon(type) {
    if (typeof AppConfig !== 'undefined') {
        return AppConfig.ui.typeIcons[type] || '📝';
    }
    return '📝';
}

function getTypeColor(type) {
    if (typeof AppConfig !== 'undefined') {
        return AppConfig.ui.typeColors[type] || 'linear-gradient(135deg, #607D8B, #90A4AE)';
    }
    return '#607D8B';
}

function getDetails(log) {
    if (log.type === 'Medisin' || log.type === 'Sondemat' || log.type === 'Annet') {
        let detail = log.name || '';
        if (log.amount) {
            detail += `: ${log.amount}`;
            if (log.unit) {
                detail += ` ${log.unit}`;
            }
        }
        return detail || '-';
    } else if (log.type === 'Avføring') {
        const bristolShort = log.bmConsistency ? 
            log.bmConsistency.split(':')[0] : '';
        return `Mengde: ${log.bmAmount || '-'}, ${bristolShort}, Farge: ${log.bmColor || '-'}`;
    } else if (log.type === 'vannlating') {
        return `Mengde: ${log.urineAmount || '-'}, Farge: ${log.urineColor || '-'}, Lukt: ${log.urineSmell || '-'}`;
    } else if (log.type === 'Oppkast') {
        return `Mengde: ${log.vomitAmount || '-'}, Farge/Innhold: ${log.vomitColor || '-'}`;
    }
    return '-';
}

// Export function
function exportToCSV() {
    if ((window.logs || []).length === 0) {
        alert('Ingen logger å eksportere');
        return;
    }
    
    // CSV headers
    let csv = 'Dato,Tid,Type,Navn,Mengde,Enhet,Detaljer,Notater\n';
    
    // CSV rows
    (window.logs || []).forEach(log => {
        const date = new Date(log.time);
        const dateStr = date.toLocaleDateString('no-NO');
        const timeStr = date.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
        
        let row = [
            dateStr,
            timeStr,
            log.type,
            log.name || '',
            log.amount || (log.bmAmount || log.urineAmount || log.vomitAmount || ''),
            log.unit || '',
            getDetails(log).replace(/,/g, ';'), // Escape commas in details
            (log.notes || '').replace(/,/g, ';') // Escape commas in notes
        ];
        
        csv += row.join(',') + '\n';
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `jens_logg_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
