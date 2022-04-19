const category = require('./category');
const registries = require('./registries');
const protocol = require('./protocol');

module.exports = { ...category, ...registries, ...protocol };
