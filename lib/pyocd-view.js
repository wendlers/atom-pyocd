'use babel';

import fs from 'fs';
import path from 'path';
import {Emitter} from 'atom';

import PyOcdSettings from './pyocd-settings';


export default class PyOcdView {

  constructor(serializedState) {

    this.emitter = new Emitter();

    this.element = document.createElement('div');
    this.element.classList.add('pyocd');

    this.element.innerHTML = fs.readFileSync(path.join(__dirname, './pyocd-view.html'));

    this.listButton = this.element.querySelector('#pyocd-list');
    this.listButton.addEventListener('click', () => {
        this.emitter.emit('list');
    });

    this.flashButton = this.element.querySelector('#pyocd-flash');
    this.flashButton.addEventListener('click', () => {
        this.emitter.emit('flash');
    });

    this.eraseButton = this.element.querySelector('#pyocd-flasherase');
    this.eraseButton.addEventListener('click', () => {
        this.emitter.emit('erase');
    });

    this.closeButton = this.element.querySelector('#pyocd-close');
    this.closeButton.addEventListener('click', () => {
        this.emitter.emit('close');
    });

    this.settingsPanel = this.element.querySelector('#pyocd-settings-panel');
    this.settingsPanel.style.display = 'block';

    this.progressPanel = this.element.querySelector('#pyocd-progress-panel');
    this.progressPanel.style.display = 'none';
    this.message = this.element.querySelector('#pyocd-message');

    this.errorPanel = this.element.querySelector('#pyocd-error-panel');
    this.errorPanel.style.display = 'none';
    this.error = this.element.querySelector('#pyocd-error');

    this.outputPanel = this.element.querySelector('#pyocd-output-panel');
    this.outputPanel.style.display = 'none';
    this.output = this.element.querySelector('#pyocd-output');

    this.ce = this.element.querySelector('#pyocd-ce');
    this.fast = this.element.querySelector('#pyocd-fast');

    this.target = this.element.querySelector('#pyocd-target');
    this.boardid = this.element.querySelector('#pyocd-boardid');
    this.file = this.element.querySelector('#pyocd-file');
  }

  serialize() {}

  destroy() {
    this.element.remove();
  }

  getElement() {
    return this.element;
  }

  onList(callback) {
    this.emitter.on('list', callback);
  }

  onClose(callback) {
    this.emitter.on('close', callback);
  }

  onFlash(callback) {
    this.emitter.on('flash', callback);
  }

  onErase(callback) {
    this.emitter.on('erase', callback);
  }

  onReset(callback) {
    this.emitter.on('reset', callback);
  }

  fromSettings(settings) {

    this.target.value = settings.target;
    this.boardid.value = settings.boardid;
    this.file.value = settings.file;

    this.ce.checked = settings.ce;
    this.fast.checked = settings.fast;

    this.hideExtra();
    this.programmerRunning(false);
  }

  toSettings() {

    var settings = new PyOcdSettings();

    settings.target = this.target.value;
    settings.boardid = this.boardid.value;
    settings.file = this.file.value;

    settings.reset = false;
    settings.ce = this.ce.checked;
    settings.fast = this.fast.checked;

    return settings;
  }

  programmerRunning(running) {
    if(running) {
      this.progressPanel.style.display = 'block';
      this.settingsPanel.style.display = 'none';
      this.errorPanel.style.display = 'none';
      this.outputPanel.style.display = 'none';

      this.listButton.disabled = true;
      this.flashButton.disabled = true;
      this.eraseButton.disabled = true;
    }
    else {
      this.settingsPanel.style.display = 'block';
      this.progressPanel.style.display = 'none';

      this.listButton.disabled = false;
      this.flashButton.disabled = false;
      this.eraseButton.disabled = false;
    }
  }

  setError(message) {
    this.error.innerHTML = '<div>' + message + '</div>';
  }

  showError() {
    this.errorPanel.style.display = 'block';
  }

  hideError() {
    this.errorPanel.style.display = 'none';
  }

  setOutput(message) {
    this.output.innerHTML = '<div>' + message + '</div>';
  }

  showOutput() {
    this.outputPanel.style.display = 'block';
  }

  hideOutput() {
    this.outputPanel.style.display = 'none';
  }

  hideExtra() {
    this.hideError();
    this.hideOutput();
  }
}
