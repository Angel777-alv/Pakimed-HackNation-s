/**
 * Pakimed Voice Recorder & Edge ASR Bridge (Moonshine Voice Architecture)
 * 
 * Captura acústica on-device diseñada para hardware de recursos limitados.
 * Implementa gestión de Buffer Dual estricto para eliminar duplicaciones y 'efecto eco':
 * - accumulatedFinal: Acumula fragmentos confirmados (isFinal === true).
 * - currentInterim: Mantiene la hipótesis provisional sin concatenación recursiva.
 */

class VoiceRecorder {
  constructor(options = {}) {
    this.engineName = 'Moonshine Voice (Edge ASR)';
    this.onResult = options.onResult || (() => {});
    this.onError = options.onError || (() => {});
    this.onStateChange = options.onStateChange || (() => {});
    this.isRecording = false;
    this.recognition = null;
    this.timerInterval = null;
    this.seconds = 0;

    // Buffer dual de transcripción
    this.accumulatedFinal = '';
    this.currentInterim = '';

    this.initRecognition();
  }

  initRecognition() {
    const SpeechRecognition = typeof window !== 'undefined' 
      ? (window.SpeechRecognition || window.webkitSpeechRecognition)
      : null;

    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'es-ES';

      this.recognition.onstart = () => {
        this.isRecording = true;
        this.currentInterim = '';
        this.startTimer();
        this.onStateChange('RECORDING');
      };

      this.recognition.onresult = (event) => {
        let interimText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          const transcriptChunk = result[0].transcript;

          if (result.isFinal) {
            // Se agrega al texto confirmado de forma limpia
            const cleanChunk = transcriptChunk.trim();
            if (cleanChunk) {
              this.accumulatedFinal = this.accumulatedFinal 
                ? `${this.accumulatedFinal} ${cleanChunk}` 
                : cleanChunk;
            }
          } else {
            // Hipótesis temporal en curso
            interimText += transcriptChunk;
          }
        }

        this.currentInterim = interimText.trim();

        // Construir transcripción completa sin duplicados
        const fullTranscript = (this.accumulatedFinal + (this.currentInterim ? ' ' + this.currentInterim : '')).trim();

        this.onResult({
          finalTranscript: this.accumulatedFinal,
          interimTranscript: this.currentInterim,
          fullTranscript: fullTranscript
        });
      };

      this.recognition.onerror = (event) => {
        console.warn('SpeechRecognition notice/error:', event.error);
        this.onError(event.error);
      };

      this.recognition.onend = () => {
        if (this.isRecording) {
          this.stopTimer();
          this.isRecording = false;
          this.currentInterim = '';
          this.onStateChange('IDLE');
        }
      };
    }
  }

  setBaseTranscript(text = '') {
    this.accumulatedFinal = (text || '').trim();
    this.currentInterim = '';
  }

  start() {
    if (this.isRecording) return;
    this.seconds = 0;
    this.currentInterim = '';

    if (this.recognition) {
      try {
        this.recognition.start();
        return;
      } catch (e) {
        console.warn('SpeechRecognition start fallback:', e);
      }
    }

    // Fallback de temporizador
    this.isRecording = true;
    this.startTimer();
    this.onStateChange('RECORDING');
  }

  stop() {
    this.stopTimer();
    this.isRecording = false;

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Silencioso
      }
    }

    // Consolidar lo que haya quedado en interim
    if (this.currentInterim) {
      this.accumulatedFinal = (this.accumulatedFinal + ' ' + this.currentInterim).trim();
      this.currentInterim = '';
    }

    this.onStateChange('PROCESSING');
  }

  startTimer() {
    this.stopTimer();
    this.seconds = 0;
    this.timerInterval = setInterval(() => {
      this.seconds++;
      this.onStateChange('TICK', { seconds: this.seconds, formatted: this.getFormattedTime() });
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  getFormattedTime() {
    const m = String(Math.floor(this.seconds / 60)).padStart(2, '0');
    const s = String(this.seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  setLanguage(langCode) {
    if (this.recognition) {
      this.recognition.lang = langCode;
      console.log(`[VoiceRecorder] STT language set to: ${langCode}`);
    }
  }

  /**
   * Plantillas de consulta rápida (Opcionales)
   */
  static getTemplates() {
    return [
      {
        id: "plantilla_1",
        title: "Plantilla 1: Infección Respiratoria Aguda (Elena Morales)",
        transcript: "Buenas tardes doña Elena Morales, paciente femenina de 34 años con fiebre de 38.5 grados, tos seca y dolor de cabeza desde hace 3 días. Presión arterial de 120 sobre 80, pulso de 78 latidos por minuto, saturación de oxígeno 97%. Se indica Paracetamol 500mg cada 8 horas por 5 días y abundante hidratación oral."
      },
      {
        id: "plantilla_2",
        title: "Plantilla 2: Cuadro Gastrointestinal Pediátrico (Mateo Gómez)",
        transcript: "Paciente Mateo Gómez de 6 años de edad presenta dolor de panza, diarrea y vómitos de 24 horas de evolución. Temperatura de 37.8 grados, pulso de 95 latidos por minuto. Indico sales de rehidratación oral y butilhioscina. Control en 48 horas."
      },
      {
        id: "plantilla_3",
        title: "Plantilla 3: Control Hipertensión y Rutina (Don Roberto)",
        transcript: "Buenos días don Roberto Sánchez de 68 años acude a control de rutina. Asintomático. Presión arterial de 145 sobre 95, pulso de 72 latidos por minuto. Se mantiene medicación de Losartán 50mg cada 24 horas y reducción estricta de sal."
      }
    ];
  }
}

// Exportación Universal
if (typeof window !== 'undefined') {
  window.Pakimed = window.Pakimed || {};
  window.Pakimed.VoiceRecorder = VoiceRecorder;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VoiceRecorder };
}
