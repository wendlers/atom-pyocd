'use babel';

import { BufferedProcess } from 'atom';

import getCurrentProjectDir from './pyocd-util';

// only one instance of a pyOCD process is allowed here ..
var pyocd_proc = null;

export default class PyOcdProgrammer {

  constructor(busyRegistry) {
      this.busyRegistry = busyRegistry;
  }

  exec(command, args, callbackSuccess, callbackFail) {

    console.log(command + ": " + args);

    if(!this.killRunning()) {
        return;
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
              callbackFail(log);
            }
            else {
              callbackSuccess(log);
            }
            if(this.busyRegistry) {
                this.busyRegistry.end('pyocd.exec');
            }
            pyocd_proc = null;
        }
    });

    pyocd_proc.onWillThrowError((err) => {
      err.handle();
      callbackFail(err.error.message);

      if(this.busyRegistry) {
          this.busyRegistry.end('pyocd.exec');
      }
    });
  }

  flashtool(args, callbackSuccess, callbackFail) {
    this.exec(atom.config.get("pyocd.pyocdFlashtoolBinary"), args, callbackSuccess, callbackFail);
  }

  expandVars(input) {
      return input.replace('{PRJDIR}', getCurrentProjectDir());
  }

  makeCommonArgs(settings) {
      var args = ['-hp', '-d', 'error'];

      if(settings.target != 'autodetect') {
        args = args.concat(['-t', settings.target]);
      }

      if(settings.boardid != '' ) {
          args = args.concat(['-b', settings.boardid])
      }

      return args;
  }

  list(settings, callbackSuccess, callbackFail) {
      this.flashtool(['-l', '-d', 'error'], callbackSuccess, callbackFail);
  }

  flash(settings, callbackSuccess, callbackFail) {

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

        args = args.concat(this.expandVars(settings.file));

        this.flashtool(args, callbackSuccess, callbackFail);
      }
  }

  erase(settings, callbackSuccess, callbackFail) {

      var args = this.makeCommonArgs(settings);

      args = args.concat('-ce');

      this.flashtool(args, callbackSuccess, callbackFail);
  }

  killRunning() {

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
        return false;
      }
    }

    return true;
  }

}
