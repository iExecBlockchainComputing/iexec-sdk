const category = require('./category');
const registries = require('./registries');
const protocol = require('./configuration');

module.exports = { ...category, ...registries, ...protocol };
