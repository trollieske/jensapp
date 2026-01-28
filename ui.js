
// --- AI Assistant UI Functions ---

async function runAiAnalysis() {
    const btn = document.getElementById('btnAiAnalysis');
    const resultDiv = document.getElementById('aiAnalysisResult');
    
    if (!btn || !resultDiv) return;
    
    // UI Loading state
    const originalContent = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<div class="d-flex align-items-center justify-content-center w-100 gap-2"><div class="spinner-border spinner-border-sm text-primary"></div><span>Analyserer data...</span></div>`;
    resultDiv.style.display = 'none';
    resultDiv.innerHTML = '';
    
    try {
        // Prepare data: Last 30 days history
        // window.logs is global
        const history = window.logs || [];
        
        // Filter and map to simpler structure for AI
        // Sort descending by time
        const sortedHistory = [...history].sort((a, b) => new Date(b.time) - new Date(a.time));
        
        // Check if aiAssistant is available
        if (typeof aiAssistant === 'undefined') {
            throw new Error('AI Service not loaded');
        }

        const aiResult = await aiAssistant.analyserAdherence(sortedHistory);
        
        // Render result
        let html = `<div class="card border-0 shadow-sm bg-white rounded-4 overflow-hidden">
            <div class="card-header bg-indigo text-white p-3" style="background: linear-gradient(135deg, #6610f2, #520dc2);">
                <h6 class="mb-0 fw-bold"><i class="bi bi-stars me-2"></i>AI Analyse</h6>
            </div>
            <div class="card-body p-0">`;
            
        // Warnings
        if (aiResult.varsler && aiResult.varsler.length > 0) {
            html += `<div class="p-3 border-bottom">
                <h6 class="text-danger fw-bold small text-uppercase mb-2"><i class="bi bi-exclamation-triangle-fill me-1"></i> Risiko</h6>
                <ul class="mb-0 ps-3 small text-secondary">
                    ${aiResult.varsler.map(v => `<li>${v}</li>`).join('')}
                </ul>
            </div>`;
        }
        
        // Patterns
        if (aiResult.mønstre) {
            html += `<div class="p-3 border-bottom">
                <h6 class="text-primary fw-bold small text-uppercase mb-2"><i class="bi bi-search me-1"></i> Mønstre</h6>
                <p class="small text-secondary mb-0">${aiResult.mønstre}</p>
            </div>`;
        }
        
        // Tips
        if (aiResult.tips) {
            html += `<div class="p-3 bg-light">
                <h6 class="text-success fw-bold small text-uppercase mb-2"><i class="bi bi-lightbulb-fill me-1"></i> Tips</h6>
                <p class="small text-secondary mb-0">${aiResult.tips}</p>
            </div>`;
        }
        
        html += `</div></div>`;
        
        resultDiv.innerHTML = html;
        resultDiv.style.display = 'block';
        
    } catch (e) {
        console.error('AI Analysis failed:', e);
        resultDiv.innerHTML = `
            <div class="alert alert-danger rounded-4 border-0 shadow-sm d-flex align-items-center">
                <i class="bi bi-exclamation-circle-fill fs-4 me-3"></i>
                <div>
                    <strong>Kunne ikke analysere</strong>
                    <div class="small">Sjekk nettverk eller prøv igjen senere.</div>
                    <div class="x-small text-muted mt-1">${e.message}</div>
                </div>
            </div>
        `;
        resultDiv.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalContent;
    }
}
