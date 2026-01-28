// AI Assistant Service
// Handles requests to local Ollama with fallback to Google Gemini via Firebase Functions

class AiAssistantService {
    constructor() {
        this.ollamaEndpoint = 'http://localhost:11434/api/generate';
        this.geminiFunction = null;
        this.model = 'llama3.2:3b'; // Default local model
    }

    /**
     * Analyzes adherence history to find patterns and risks
     * @param {Array} history - List of dose history objects
     * @returns {Promise<Object>} - Analysis result
     */
    async analyserAdherence(history) {
        // Limit history to last 50 items to avoid excessive tokens
        const relevantHistory = history.slice(0, 50); 
        
        const prompt = this._buildAdherencePrompt(relevantHistory);
        
        try {
            console.log('🤖 AI Service: Attempting local Ollama...');
            const result = await this._callOllama(prompt);
            console.log('✅ AI Service: Ollama success');
            return result;
        } catch (ollamaError) {
            console.warn('⚠️ AI Service: Ollama failed/unavailable, switching to Gemini fallback.');
            // console.error(ollamaError); // Optional logging
            return await this._callGemini(prompt);
        }
    }

    /**
     * Analyzes dose based on vitals and patient data
     * @param {Object} vitals - Current vitals (e.g., BP, pulse)
     * @param {Array} meds - List of active medications
     * @param {Object} patient - Patient profile
     * @returns {Promise<Object>} - Analysis result
     */
    async analyserDose(vitals, meds, patient) {
        const prompt = this._buildDosePrompt(vitals, meds, patient);
        try {
            return await this._callOllama(prompt);
        } catch (e) {
            console.warn('⚠️ AI Service: Ollama failed for dose analysis, switching to Gemini.');
            return await this._callGemini(prompt);
        }
    }

    /**
     * Analyzes symptoms for potential side effects or interactions
     * @param {Array} symptoms - List of reported symptoms
     * @param {Array} meds - List of active medications
     * @returns {Promise<Object>} - Analysis result
     */
    async analyserSymptomer(symptoms, meds) {
        const prompt = this._buildSymptomerPrompt(symptoms, meds);
        try {
            return await this._callOllama(prompt);
        } catch (e) {
            console.warn('⚠️ AI Service: Ollama failed for symptom analysis, switching to Gemini.');
            return await this._callGemini(prompt);
        }
    }

    _buildDosePrompt(vitals, meds, patient) {
        return `
Du er en medisinsk assistent som vurderer dosering.

PASIENTDATA:
${JSON.stringify(patient, null, 2)}

VITALE MÅLINGER:
${JSON.stringify(vitals, null, 2)}

MEDISINLISTE:
${JSON.stringify(meds, null, 2)}

OPPGAVE:
Vurder om dagens vitale målinger tilsier at dosen bør justeres, eller om det er spesielle forholdsregler.

SVAR KUN SOM GYLDIG JSON PÅ NORSK:
{
  "anbefaling": "Kort anbefaling (f.eks. 'Ta som planlagt', 'Kontakt lege', 'Vent 1 time')",
  "risikoNiva": "Lav/Medium/Høy",
  "begrunnelse": "Kort medisinsk begrunnelse"
}
`;
    }

    _buildSymptomerPrompt(symptoms, meds) {
        return `
Du er en medisinsk assistent som analyserer symptomer.

RAPPORTERTE SYMPTOMER:
${JSON.stringify(symptoms, null, 2)}

AKTIVE MEDISINER:
${JSON.stringify(meds, null, 2)}

OPPGAVE:
Analyser om symptomene kan være kjente bivirkninger av medisinene, eller tegn på interaksjoner.

SVAR KUN SOM GYLDIG JSON PÅ NORSK:
{
  "analyse": "Kort oppsummering",
  "muligeBivirkninger": ["Liste over relevante bivirkninger"],
  "rad": "Konkrete råd til pasienten (f.eks. 'Drikk vann', 'Kontakt legevakt')"
}
`;
    }

    _buildAdherencePrompt(history) {
        return `
Du er en norsk medisin-adherence assistent.

HISTORIKK (JSON):
${JSON.stringify(history, null, 2)}

OPPGAVE:
1. Finn mønstre der doser ofte hoppes over (tidspunkt, ukedager).
2. Forutsi hvilke doser neste 24 timer som har høy risiko for å bli glemt.
3. Gi 2–3 konkrete tips for å bedre etterlevelsen.

SVAR KUN SOM GYLDIG JSON PÅ NORSK:
{
  "varsler": ["Tidspunkt og kort begrunnelse"],
  "mønstre": "kort tekst",
  "tips": "kort tekst"
}
Ikke skriv noe utenfor JSON.
`;
    }

    async _callOllama(prompt) {
        // Timeout to fail fast if local server is not running
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

        try {
            const response = await fetch(this.ollamaEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.model,
                    prompt: prompt,
                    stream: false,
                    format: 'json'
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`Ollama status: ${response.status}`);
            
            const data = await response.json();
            return this._parseJson(data.response);
        } catch (e) {
            clearTimeout(timeoutId);
            throw e;
        }
    }

    async _callGemini(prompt) {
        // Initialize functions lazily
        if (!this.geminiFunction) {
             if (typeof firebase === 'undefined') throw new Error('Firebase not initialized');
             this.geminiFunction = firebase.functions().httpsCallable('analyzeWithGemini');
        }

        try {
            console.log('☁️ AI Service: Calling Gemini...');
            const result = await this.geminiFunction({ prompt });
            console.log('✅ AI Service: Gemini success');
            this.lastGeminiCall = Date.now();
            
            // Result.data is the return value from the Callable function
            const text = result.data.text || result.data; // Handle structure
            return this._parseJson(text);
        } catch (e) {
            console.error('❌ AI Service: Gemini fallback failed:', e);
            throw e;
        }
    }

    _parseJson(text) {
        if (typeof text === 'object') return text; // Already parsed
        // Clean markdown code blocks if present
        let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        try {
            return JSON.parse(cleanText);
        } catch (e) {
            console.error('Failed to parse AI JSON:', cleanText);
            throw new Error('Invalid JSON from AI');
        }
    }
}

// Export singleton
const aiAssistant = new AiAssistantService();
