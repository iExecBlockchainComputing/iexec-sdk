const { exec } = require('child_process');

const execAsync = (cmd) =>
  new Promise((res, rej) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        rej(Error(stdout + stderr));
      }
      res(stdout + stderr);
    });
  });

module.exports = {
  execAsync,
};
