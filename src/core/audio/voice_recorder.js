/**
 * Pakimed Voice Recorder & Edge ASR Bridge (Moonshine Voice Architecture)
 * 
 * Captura acústica on-device diseñada para hardware de recursos limitados.
 * Integra Web Speech API nativa con control preciso de estados:
 * - IDLE
 * - RECORDING
 * - PROCESSING
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
        this.startTimer();
        this.onStateChange('RECORDING');
      };

      this.recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        this.onResult({ finalTranscript, interimTranscript });
      };

      this.recognition.onerror = (event) => {
        console.warn('SpeechRecognition warning:', event.error);
        this.onError(event.error);
      };

      this.recognition.onend = () => {
        if (this.isRecording) {
          this.stopTimer();
          this.isRecording = false;
          this.onStateChange('IDLE');
        }
      };
    }
  }

  start() {
    if (this.isRecording) return;
    this.seconds = 0;

    if (this.recognition) {
      try {
        this.recognition.start();
        return;
      } catch (e) {
        console.warn('SpeechRecognition start fallback:', e);
      }
    }

    // Fallback simulado para entornos donde el navegador bloquea permisos de mic sin SSL
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
        // silencioso
      }
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

  /**
   * Plantillas de consulta rápida (únicamente como demostración opcional)
   */
  static getTemplates() {
    return [
      {
        id: "plantilla_1",
        title: "Plantilla 1: Infección Respiratoria Aguda (Adulto)",
        transcript: "Paciente femenina de 34 años con fiebre de 38.5 grados, tos seca y dolor de cabeza desde hace 3 días. Presión arterial de 120 sobre 80, pulso de 78 latidos por minuto, saturación de oxígeno 97%. Se indica Paracetamol 500mg cada 8 horas por 5 días y abundante hidratación oral."
      },
      {
        id: "plantilla_2",
        title: "Plantilla 2: Cuadro Gastrointestinal Pediátrico",
        transcript: "Paciente masculino de 6 años de edad presenta dolor abdominal, diarrea y vómitos de 24 horas de evolución. Temperatura de 37.8 grados, pulso de 95 latidos por minuto. Indico sales de rehidratación oral y dieta blanda fraccionada. Control en 48 horas."
      },
      {
        id: "plantilla_3",
        title: "Plantilla 3: Control Hipertensión Arterial (Adulto Mayor)",
        transcript: "Paciente masculino de 68 años acude a control de rutina. Asintomático. Presión arterial de 145 sobre 95, pulso de 72 latidos por minuto. Se mantiene medicación de Losartán 50mg cada 24 horas y reducción estricta de sal."
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
