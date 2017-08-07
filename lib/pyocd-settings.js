'use babel';

import fs from 'fs';
import path from 'path';

import getCurrentProjectDir from './pyocd-util';


export default class PyOcdSettings {

    constructor() {

      this.reset = false;
      this.ce = false;
      this.fast = false;

      this.target = 'autodetect';
      this.boardid = '';
      this.file = '';
    }

    getSettingsFileName() {

      var p = getCurrentProjectDir();

      if(p) {
          return path.join(p, "pyocd_settings.json");
      }

      return null;
    }

    read() {

      var fname = this.getSettingsFileName();

      if(fname && fs.existsSync(fname)) {

        console.log('reading settings from: ' + fname);

        var json = JSON.parse(fs.readFileSync(fname));

        this.reset = json.reset;
        this.ce = json.ce;
        this.fast = json.fast;

        this.target = json.target;
        this.boardid = json.boardid;
        this.file = json.file;
      }
    }

    write() {

        var fname = this.getSettingsFileName();

        if(fname) {
          console.log('writing settings to: ' + fname);
          fs.writeFileSync(fname, JSON.stringify(this));
        }
        else {
          /* this is OK since it only menas that there is no active project */
          console.log('failed to save settings for pyOCD (no active project?)');
        }
    }

    dump() {

        console.log(
            ';reset=' + this.reset +
            ';ce=' + this.ce +
            ';fast=' + this.fast +
            ';target=' + this.target +
            ';boardid=' + this.boardid +
            ';file=' + this.file
        );
    }
}
