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

    this.element.querySelector('#pyocd-list').addEventListener('click', () => {
        this.emitter.emit('list');
    });

    this.element.querySelector('#pyocd-flash').addEventListener('click', () => {
        this.emitter.emit('flash');
    });

    this.element.querySelector('#pyocd-flasherase').addEventListener('click', () => {
        this.emitter.emit('erase');
    });

    /*
    this.element.querySelector('#pyocd-boardreset').addEventListener('click', () => {
        this.emitter.emit('reset');
    });
    */
    
    this.element.querySelector('#pyocd-close').addEventListener('click', () => {
        this.emitter.emit('close');
    });

    // this.reset = this.element.querySelector('#pyocd-reset');
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

    // this.reset.checked = settings.reset;
    this.ce.checked = settings.ce;
    this.fast.checked = settings.fast;
  }

  toSettings() {

    var settings = new PyOcdSettings();

    settings.target = this.target.value;
    settings.boardid = this.boardid.value;
    settings.file = this.file.value;

    // settings.reset = this.reset.checked;
    settings.reset = false;
    settings.ce = this.ce.checked;
    settings.fast = this.fast.checked;

    return settings;
  }
}
