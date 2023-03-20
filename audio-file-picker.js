class AudioFilePicker extends HTMLElement {
  constructor() {
    super();
    const template = document.getElementById('audio-file-picker-template');
    const templateContent = template.content;
    this.appendChild(templateContent.cloneNode(true));
    const canvas = this.querySelector('canvas');
    this.ctx = canvas.getContext('2d');
    this.analyser = null;
    this.sourceNode = null;
    this.buffer = null;
    this.width = canvas.width;
    this.height = canvas.height;
    this.audioFileInput = this.querySelector('input[type="file"]');
    this.audioFileInput.addEventListener('change', this.handleAudioFileSelected.bind(this));
  }

  handleAudioFileSelected(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      this.audioCtx = new AudioContext();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.audioCtx.decodeAudioData(reader.result)
        .then(buffer => {
          this.buffer = buffer;
          this.drawSpectrogram();
        });
    };
    reader.readAsArrayBuffer(file);
  }

  drawSpectrogram() {
    const audioBuffer = this.buffer;
    const audioSource = this.audioCtx.createBufferSource();
    audioSource.buffer = audioBuffer;
    audioSource.connect(this.analyser);
    this.analyser.connect(this.audioCtx.destination);
    audioSource.start();

    const draw = () => {
      const freqData = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(freqData);
      this.ctx.clearRect(0, 0, this.width, this.height);
      const barWidth = this.width / freqData.length;
      for (let i = 0; i < freqData.length; i++) {
        const barHeight = freqData[i];
        this.ctx.fillStyle = `rgb(${barHeight},${barHeight},${barHeight})`;
        this.ctx.fillRect(i * barWidth, this.height - barHeight, barWidth, barHeight);
      }
      requestAnimationFrame(draw);
    };

    requestAnimationFrame(draw);
  }
}

customElements.define('audio-file-picker', AudioFilePicker);
