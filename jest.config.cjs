/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  transform: {},
  roots: ['./test/lib/', './test/cli/'],
};

module.exports = config;
