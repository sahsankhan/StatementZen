module.exports = {
  // glue-like: where step defs live
  stepDefinitions: [
    "cypress/support/step_definitions/*.js",  // your current path
  ],
  messages: {
    enabled: false,
  },
  json: {
    enabled: false,
  },
  html: {
    enabled: false,
  },
};
