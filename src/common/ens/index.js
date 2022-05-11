const registration = require('./registration');
const resolution = require('./resolution');
const textRecord = require('./text-record');

module.exports = {
  ...registration,
  ...resolution,
  ...textRecord,
};
