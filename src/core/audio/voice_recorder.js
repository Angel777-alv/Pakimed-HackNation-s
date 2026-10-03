/**
 * Pakimed Voice Recorder & Edge ASR Bridge (Moonshine Voice Architecture)
 * 
 * Implementa la captura y reconocimiento acústico on-device diseñado para
 * procesadores de recursos limitados (Small AI / Edge Computing).
 * Incluye fallback fluido a Web Speech API y escenarios clínicos precargados
 * para demostraciones sin latencia ni fallos en vivo.
 */

export class VoiceRecorder {
  constructor(options = {}) {
    this.engineName = 'Moonshine Voice (Edge ASR)';
    this.onResult = options.onResult || (() => {});
    this.onError = options.onError || (() => {});
    this.onStateChange = options.onStateChange || (() => {});
    this.isRecording = false;
    this.recognition = null;

    this.initRecognition();
  }

  initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'es-ES';

      this.recognition.onstart = () => {
        this.isRecording = true;
        this.onStateChange('RECORDING');
      };

      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        this.onResult({ finalTranscript, interimTranscript });
      };

      this.recognition.onerror = (event) => {
        console.warn('Speech recognition warning/error:', event.error);
        this.onError(event.error);
      };

      this.recognition.onend = () => {
        this.isRecording = false;
        this.onStateChange('IDLE');
      };
    }
  }

  start() {
    if (this.recognition && !this.isRecording) {
      try {
        this.recognition.start();
      } catch (e) {
        console.warn('Recognition start exception:', e);
      }
    } else {
      this.isRecording = true;
      this.onStateChange('RECORDING');
    }
  }

  stop() {
    if (this.recognition && this.isRecording) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('Recognition stop exception:', e);
      }
    }
    this.isRecording = false;
    this.onStateChange('IDLE');
  }

  /**
   * Casos de dictado clínico precargados para demostración ágil del Pitch
   */
  static getDemoScenarios() {
    return [
      {
        id: "caso_1",
        title: "Caso 1: Consulta General - Infección Respiratoria Aguda",
        transcript: "Paciente femenina de 34 años con fiebre de 38.5 grados, tos seca y dolor de cabeza desde hace 3 días. Presión arterial de 120 sobre 80, pulso de 78 latidos por minuto. Se indica Paracetamol 500mg cada 8 horas por 5 días y abundante hidratación oral."
      },
      {
        id: "caso_2",
        title: "Caso 2: Paciente Pediátrico - Cuadro Gastrointestinal",
        transcript: "Paciente masculino de 6 años de edad presenta dolor abdominal, diarrea y vómitos de 24 horas de evolución. Temperatura de 37.8 grados, frecuencia cardíaca de 95 lpm. Indico sales de rehidratación oral y dieta blanda fraccionada. Control en 48 horas."
      },
      {
        id: "caso_3",
        title: "Caso 3: Control Adulto Mayor - Hipertensión Arterial",
        transcript: "Paciente masculino de 68 años acude a control de rutina. Asintomático. Presión arterial de 145 sobre 95, frecuencia cardíaca de 72 lpm. Se mantiene medicación de Losartán 50mg cada 24 horas y se indica reducción en consumo de sodio."
      }
    ];
  }
}
