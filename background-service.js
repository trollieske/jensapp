// background-service.js

window.BackgroundService = {
    // Background Library
    library: {
        'natur': {
            name: 'Natur',
            items: [
                { id: 'forest', name: 'Skog', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80' },
                { id: 'ocean', name: 'Hav', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80' },
                { id: 'mountain', name: 'Fjell', url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80' },
                { id: 'leaves', name: 'Blader', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80' }
            ]
        },
        'abstrakt': {
            name: 'Abstrakt',
            items: [
                { id: 'fluid', name: 'Flytende', url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=80' },
                { id: 'neon', name: 'Neon', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80' },
                { id: 'paint', name: 'Maling', url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=80' }, // Duplicate url fixed in logic if needed
                { id: 'colorful', name: 'Fargerik', url: 'https://images.unsplash.com/photo-1502691876148-a84978e59af8?w=800&q=80' }
            ]
        },
        'rolig': {
            name: 'Rolig',
            items: [
                { id: 'clouds', name: 'Skyer', url: 'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?w=800&q=80' },
                { id: 'minimal', name: 'Minimal', url: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=800&q=80' },
                { id: 'white', name: 'Hvit', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80' }, // Placeholder
                { id: 'sand', name: 'Sand', url: 'https://images.unsplash.com/photo-1533158388470-9a56699990c6?w=800&q=80' }
            ]
        },
        'mork': {
            name: 'Mørk',
            items: [
                { id: 'stars', name: 'Stjerner', url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&q=80' },
                { id: 'night', name: 'Natt', url: 'https://images.unsplash.com/photo-1472552944129-b035e9ea43cc?w=800&q=80' },
                { id: 'aurora', name: 'Nordlys', url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80' },
                { id: 'city', name: 'By', url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&q=80' }
            ]
        },
        'gradient': {
            name: 'Farger',
            items: [
                { id: 'grad-1', name: 'Sunset', url: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)', isGradient: true },
                { id: 'grad-2', name: 'Ocean', url: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)', isGradient: true },
                { id: 'grad-3', name: 'Berry', url: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', isGradient: true },
                { id: 'grad-4', name: 'Night', url: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', isGradient: true }
            ]
        }
    },

    init: function() {
        this.applySavedBackground();
        this.setupEventListeners();
    },

    applySavedBackground: function() {
        const bg = localStorage.getItem('app_background');
        const bgType = localStorage.getItem('app_background_type'); // 'image', 'gradient', 'upload'
        let opacity = localStorage.getItem('app_background_opacity');

        // Default opacity if not set
        if (opacity === null) {
            opacity = 0.85;
        } else {
            opacity = parseFloat(opacity);
        }

        // Update slider if it exists
        const slider = document.getElementById('bg-opacity-slider');
        if (slider) slider.value = opacity * 100;
        const sliderValue = document.getElementById('bg-opacity-value');
        if (sliderValue) sliderValue.textContent = Math.round(opacity * 100) + '%';

        if (bg) {
            if (bgType === 'gradient') {
                document.body.style.backgroundImage = bg;
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundAttachment = 'fixed';
            } else {
                // Image (URL or Base64)
                document.body.style.backgroundImage = `url('${bg}')`;
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundPosition = 'center center';
                document.body.style.backgroundAttachment = 'fixed';
                document.body.style.backgroundRepeat = 'no-repeat';
            }
            
            // Add or update overlay
            let overlay = document.getElementById('bg-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'bg-overlay';
                overlay.style.position = 'fixed';
                overlay.style.top = '0';
                overlay.style.left = '0';
                overlay.style.width = '100%';
                overlay.style.height = '100%';
                overlay.style.zIndex = '-1';
                overlay.style.pointerEvents = 'none';
                document.body.appendChild(overlay);
            }
            overlay.style.backgroundColor = `rgba(255, 255, 255, ${opacity})`;
        }
    },

    setOpacity: function(value) {
        // Value between 0 and 1
        localStorage.setItem('app_background_opacity', value);
        
        // Update overlay directly for immediate feedback
        const overlay = document.getElementById('bg-overlay');
        if (overlay) {
            overlay.style.backgroundColor = `rgba(255, 255, 255, ${value})`;
        }
        
        const sliderValue = document.getElementById('bg-opacity-value');
        if (sliderValue) sliderValue.textContent = Math.round(value * 100) + '%';
    },

    setBackground: function(value, type) {
        localStorage.setItem('app_background', value);
        localStorage.setItem('app_background_type', type);
        this.applySavedBackground();
        showToast('🎨 Bakgrunn oppdatert');
    },

    resetBackground: function() {
        localStorage.removeItem('app_background');
        localStorage.removeItem('app_background_type');
        localStorage.removeItem('app_background_opacity');
        document.body.style.backgroundImage = '';
        const overlay = document.getElementById('bg-overlay');
        if (overlay) overlay.remove();
        showToast('🔄 Bakgrunn tilbakestilt');
    },

    handleFileUpload: function(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onloadend = function() {
            // Compress/Resize logic could go here, but for now raw base64
            // Check size roughly
            if (reader.result.length > 2000000) { // ~1.5MB limit
                showToast('⚠️ Bildet er for stort for lagring i nettleseren');
                return;
            }
            BackgroundService.setBackground(reader.result, 'upload');
        }
        reader.readAsDataURL(file);
    },

    setupEventListeners: function() {
        // File input listener
        const fileInput = document.getElementById('bg-upload-input');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleFileUpload(e.target.files[0]);
            });
        }

        // Opacity slider listener
        const opacitySlider = document.getElementById('bg-opacity-slider');
        if (opacitySlider) {
            opacitySlider.addEventListener('input', (e) => {
                const val = e.target.value / 100;
                this.setOpacity(val);
            });
        }
    },

    renderLibrary: function(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        Object.keys(this.library).forEach(themeKey => {
            const theme = this.library[themeKey];
            
            const themeSection = document.createElement('div');
            themeSection.className = 'mb-4';
            themeSection.innerHTML = `<h6 class="fw-bold mb-2 text-muted">${theme.name}</h6>`;
            
            const grid = document.createElement('div');
            grid.className = 'd-grid gap-2';
            grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
            
            theme.items.forEach(item => {
                const btn = document.createElement('div');
                btn.className = 'position-relative rounded-3 overflow-hidden shadow-sm cursor-pointer border';
                btn.style.height = '80px';
                btn.style.cursor = 'pointer';
                
                if (item.isGradient) {
                    btn.style.background = item.url;
                } else {
                    btn.style.backgroundImage = `url('${item.url}')`;
                    btn.style.backgroundSize = 'cover';
                    btn.style.backgroundPosition = 'center';
                }

                btn.onclick = () => {
                    this.setBackground(item.url, item.isGradient ? 'gradient' : 'image');
                    // Visual feedback
                    document.querySelectorAll('.bg-selected-indicator').forEach(el => el.remove());
                    const check = document.createElement('div');
                    check.className = 'bg-selected-indicator position-absolute top-50 start-50 translate-middle bg-white rounded-circle d-flex align-items-center justify-content-center';
                    check.style.width = '30px';
                    check.style.height = '30px';
                    check.innerHTML = '<i class="bi bi-check-lg text-success"></i>';
                    btn.appendChild(check);
                };
                
                // Label
                const label = document.createElement('div');
                label.className = 'position-absolute bottom-0 start-0 w-100 bg-dark bg-opacity-50 text-white text-center small py-1 text-truncate';
                label.textContent = item.name;
                
                btn.appendChild(label);
                grid.appendChild(btn);
            });
            
            themeSection.appendChild(grid);
            container.appendChild(themeSection);
        });
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    BackgroundService.init();
});
