'use babel';

import PyOcdView from './pyocd-view';
import { CompositeDisposable } from 'atom';

import PyOcdSettings from './pyocd-settings';
import PyOcdProgrammer from './pyocd-programmer';


export default {

  pyOcdSettings: null,
  pyOcdView: null,
  pyOcdPanel: null,
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
    pyocdToolBinary: {
      title: 'pyocd-tool binary',
      description: 'binary (with our without path) for the `pyocd-tool` command',
      type: 'string',
      default: 'pyocd-tool',
      order: 20
    },
  },

  activate(state) {

    require('atom-package-deps').install('pyocd', true)
        .then(function() {
          console.log('dependencies installed for pyocd');
    });

    this.pyOcdSettings = new PyOcdSettings();
    this.pyOcdView = new PyOcdView(state.pyOcdViewState);
    this.pyOcdView.fromSettings(this.pyOcdSettings);

    this.pyOcdView.onList(
        () => this.list()
    );

    this.pyOcdView.onFlash(
        () => this.flash()
    );

    this.pyOcdView.onErase(
        () => this.erase()
    );

    this.pyOcdView.onReset(
        () => this.reset()
    );

    this.pyOcdView.onClose(
        () => this.toggle()
    );

    this.pyOcdPanel = atom.workspace.addTopPanel({
      item: this.pyOcdView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
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
      'pyocd:reset': () => this.reset()
    }));

  },

  consumeBusy(registry) {
    this.busyRegistry = registry;
  },

  deactivate() {
    this.pyOcdPanel.destroy();
    this.subscriptions.dispose();
    this.pyOcdView.destroy();
  },

  serialize() {
    return {
      pyOcdViewState: this.pyOcdView.serialize()
    };
  },

  list() {

      prog = new PyOcdProgrammer(this.busyRegistry);

      this.pyOcdSettings = this.pyOcdView.toSettings();
      prog.list(this.pyOcdSettings);
  },

  flash() {

      prog = new PyOcdProgrammer(this.busyRegistry);

      this.pyOcdSettings = this.pyOcdView.toSettings();
      prog.flash(this.pyOcdSettings);
  },

  erase() {

      prog = new PyOcdProgrammer(this.busyRegistry);

      this.pyOcdSettings = this.pyOcdView.toSettings();
      prog.erase(this.pyOcdSettings);
  },

  reset() {
    prog = new PyOcdProgrammer(this.busyRegistry);

    this.pyOcdSettings = this.pyOcdView.toSettings();
    prog.reset(this.pyOcdSettings);
  },

  toggle() {

    if(this.pyOcdPanel.isVisible()) {
        this.pyOcdSettings = this.pyOcdView.toSettings();
        this.pyOcdSettings.write();
        return this.pyOcdPanel.hide();
    }
    else {
        this.pyOcdSettings.read();
        this.pyOcdView.fromSettings(this.pyOcdSettings);
        return this.pyOcdPanel.show();
    }
  }
};
