'use babel';

import PyOcdView from './pyocd-view';
import { CompositeDisposable } from 'atom';

import fs from 'fs';
import path from 'path';
import findit from 'findit';

import PyOcdSettings from './pyocd-settings';
import PyOcdProgrammer from './pyocd-programmer';
import getCurrentProjectDir from './pyocd-util';

export default {

  pyOcdSettings: null,
  pyOcdView: null,
  pyOcdModalPanel: null,
  subscriptions: null,
  busyRegistry: null,

  config: {
    pyocdFlashtoolBinary: {
      title: 'pyocd-flashtool binary',
      description: 'binary (with our without path) for the `pyocd-flashtool` command',
      type: 'string',
      default: 'pyocd-flashtool',
      order: 10
    },
  },

  activate(state) {

    require('atom-package-deps').install('pyocd', true)
        .then(function() {
          console.log('dependencies installed for pyocd');
    });

    this.pyOcdSettings = new PyOcdSettings();
    this.pyOcdView = new PyOcdView(state.pyOcdViewState);

    this.pyOcdSettings.read();
    this.pyOcdView.fromSettings(this.pyOcdSettings);

    this.pyOcdView.onFlash(
        () => this.flash()
    );

    this.pyOcdView.onErase(
        () => this.erase()
    );

    this.pyOcdView.onClose(
        () => this.toggle()
    );

    this.pyOcdModalPanel = atom.workspace.addModalPanel({
      item: this.pyOcdView.getElement(),
      visible: false
    });

    this.subscriptions = new CompositeDisposable();

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'pyocd:toggle': () => this.toggle()
    }));

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'pyocd:flash': () => this.flash()
    }));

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'pyocd:erase': () => this.erase()
    }));

    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'pyocd:test': () => this.guessBinaryOutput((files) => {
          atom.notifications.addInfo('Found binary files', {detail: files})
        })
      }));
  },

  consumeBusy(registry) {
    this.busyRegistry = registry;
  },

  deactivate() {
    this.pyOcdModalPanel.destroy();
    this.subscriptions.dispose();
    this.pyOcdView.destroy();
  },

  serialize() {
    return {
      pyOcdViewState: this.pyOcdView.serialize()
    };
  },

  guessBinaryOutput(callback) {

    var prjDir = getCurrentProjectDir();
    var finder = findit(prjDir);
    var binaryFiles = [];

    finder.on('file', function (file, stat) {
        if(file.endsWith('.hex') || file.endsWith('.bin')) {
          console.log('found binary: ' + file);
          callback(file.substr(prjDir.length + 1));
          this.stop();
        }
    });

    finder.on('end', function () {
      if(callback) {
        callback(null);
      }
    });
  },

  notifySuccess(message) {

    var parts = message.split('\n');
    var header = 'pyOCD success!';
    var body = null;

    if(parts.length) {
      if(parts[0]) {
        header = parts[0];
      }
      if(parts.length > 1) {
        body = parts.splice(1, parts.length).join('<br/>')
      }
    }

    if(this.pyOcdModalPanel.isVisible()) {
      var m = header;

      if(body) {
          m = m + '<br/><pre>' + body + '</div>'
      }
      this.pyOcdView.setOutput(m);
      this.pyOcdView.showOutput(true);
    }
    else {
      if(body) {
        atom.notifications.addSuccess(header, {detail: body});
      }
      else {
        atom.notifications.addSuccess(header);
      }
    }
  },

  notifyError(message) {

    var parts = message.split('\n');
    var header = 'pyOCD failed!';
    var body = null;

    if(parts.length) {
      if(parts[0]) {
        header = parts[0];
      }
      if(parts.length > 1) {
        body = parts.splice(1, parts.length).join('\n')
      }
    }

    if(this.pyOcdModalPanel.isVisible()) {
      var m = header;

      if(body) {
        m = m + '<br/><div style="width: 450px; overflow-x: auto;"><pre>' + body + '<pre></div>'
      }

      this.pyOcdView.setError(m);
      this.pyOcdView.showError(true);
    }
    else {
      if(body) {
        atom.notifications.addError(header, {detail: body});
      }
      else {
        atom.notifications.addError(header);
      }
    }
  },

  showProgress(running) {
    if(this.pyOcdModalPanel.isVisible()) {
      this.pyOcdView.programmerRunning(running);
    }
  },

  flash() {

    var prog = new PyOcdProgrammer(this.busyRegistry);

    if(this.pyOcdModalPanel.isVisible()) {
      this.pyOcdSettings = this.pyOcdView.toSettings();
    }
    else {
      this.pyOcdSettings.read();
    }

    this.pyOcdSettings.dump();

    if(this.pyOcdSettings.file.length == 0) {
        this.notifyError('No file to flash was given!');
        return;
    }

    this.showProgress(true);

    prog.flash(
      this.pyOcdSettings,
      (message) => {
        this.showProgress(false);
        this.notifySuccess(message);
      },
      (message) => {
        this.showProgress(false);
        this.notifyError(message);
      }
    );
  },

  erase() {

    var prog = new PyOcdProgrammer(this.busyRegistry);

    if(this.pyOcdModalPanel.isVisible()) {
      this.pyOcdSettings = this.pyOcdView.toSettings();
    }
    else {
      this.pyOcdSettings.read();
    }

    this.pyOcdSettings.dump();

    this.pyOcdView.programmerRunning(true);

    prog.erase(
      this.pyOcdSettings,
      (message) => {
        this.showProgress(false);
        this.notifySuccess(message);
      },
      (message) => {
        this.showProgress(false);
        this.notifyError(message);
      }
    );
  },

  toggle() {

    var prog = new PyOcdProgrammer(this.busyRegistry);

    if(prog.killRunning()) {
      if(this.pyOcdModalPanel.isVisible()) {
          this.pyOcdSettings = this.pyOcdView.toSettings();
          this.pyOcdSettings.write();
          return this.pyOcdModalPanel.hide();
      }
      else {
          this.pyOcdSettings = new PyOcdSettings();
          this.pyOcdSettings.read();

          this.guessBinaryOutput((binfile) => {
            if(this.pyOcdSettings.file == '') {
              console.log('Settig file to: ' + binfile);
              this.pyOcdSettings.file = binfile;
            }

            this.pyOcdView.fromSettings(this.pyOcdSettings);
            this.pyOcdView.hideExtra();

            var prog = new PyOcdProgrammer(this.busyRegistry);

            prog.list(
              this.pyOcdSettings,
              (message) => {
                var bids = [];
                var lines = message.split('\n');

                for(var l in lines) {

                  var parts = lines[l].split(' => ');

                  if(parts.length >= 2) {
                    bids = bids.concat({name: parts[1], id: parts[2]});
                  }
                }
                this.pyOcdView.setBoardIds(this.pyOcdSettings, bids);
              },
              (message) => {
                this.notifyError(message);
              }
            );
          });

          return this.pyOcdModalPanel.show();
      }
    }
  }
};
