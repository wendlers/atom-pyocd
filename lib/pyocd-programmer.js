'use babel';

import { BufferedProcess } from 'atom';

import getCurrentProjectDir from './pyocd-util';

// only one instance of a pyOCD process is allowed here ..
var pyocd_proc = null;

export default class PyOcdProgrammer {

  constructor(busyRegistry) {
      this.busyRegistry = busyRegistry;
  }

  exec(command, args) {

    console.log(command + ": " + args);

    if(pyocd_proc != null) {
      var choice = atom.confirm(
        {
          message: "A pyOCD instance is already running!",
          detailedMessage: "Terminate running instance?",
          buttons: ['No', 'Yes']
        }
      );

      if(choice == 1) {
        if(pyocd_proc != null) {
          pyocd_proc.kill();

          if(this.busyRegistry) {
              this.busyRegistry.end('pyocd.exec');
          }
          pyocd_proc = null;
        }
      }
      else {
        return;
      }
    }

    var log = '';

    var notify = (data) => {
        log += data;
    }

    const stdout = (output) => notify(output);

    if(this.busyRegistry) {
        this.busyRegistry.begin('pyocd.exec', command);
    }

    pyocd_proc = new BufferedProcess({
        command: command,
        args: args,
        stdout: stdout,
        stderr: stdout,
        exit: (code) => {
            if(code) {
                atom.notifications.addError("Failed to run " + command, {detail: log});
            }
            else {
                atom.notifications.addSuccess("Success running " + command, {detail: log});
            }
            if(this.busyRegistry) {
                this.busyRegistry.end('pyocd.exec');
            }
            pyocd_proc = null;
        }
    });

    pyocd_proc.onWillThrowError((err) => {
      err.handle();
      atom.notifications.addError(command, {detail: err.error.message});
      if(this.busyRegistry) {
          this.busyRegistry.end('pyocd.exec');
      }
    });
  }

  tool(args) {
    this.exec(atom.config.get("pyocd.pyocdToolBinary"), args);
  }

  flashtool(args) {
    this.exec(atom.config.get("pyocd.pyocdFlashtoolBinary"), args);
  }

  expandVars(input) {
      return input.replace('{PRJDIR}', getCurrentProjectDir());
  }

  makeCommonArgs(settings) {
      var args = ['-hp'];

      if(settings.target != 'autodetect') {
        args = args.concat(['-t', settings.target]);
      }

      if(settings.boardid != '' ) {
          args = args.concat(['-b', settings.boardid])
      }

      return args;
  }

  list(settings) {
      this.flashtool(['-l']);
  }

  flash(settings) {

      if(settings.file != '') {

        var args = this.makeCommonArgs(settings);

        if(settings.fast) {
          args = args.concat('-fp');
        }

        if(settings.ce) {
          args = args.concat('-ce');
        }
        else {
          args = args.concat('-se');
        }

        args = args.concat(settings.file);

        this.flashtool(args);
      }
  }

  erase(settings) {

      var args = this.makeCommonArgs(settings);

      args = args.concat('-ce');

      this.flashtool(args);
  }

  reset(settings) {

    var args = [];

    if(settings.target != 'autodetect') {
      args = args.concat(['-t', settings.target]);
    }

    if(settings.boardid != '' ) {
        args = args.concat(['-b', settings.boardid])
    }

    args = args.concat('reset');

    this.tool(args);
  }
}
