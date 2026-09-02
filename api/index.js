const { createApp } = require('../dist/src/create-app');

let cached;

module.exports = async (req, res) => {
  if (!cached) {
    const { expressApp } = await createApp();
    cached = expressApp;
  }
  return cached(req, res);
};
