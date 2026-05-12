const app = require("./app");
const connectDB = require("./config/database");
const ENV = require("./config/env");

(async () => {
  await connectDB();
  app.listen(ENV.PORT, () => {
    console.log(`[server] listening on :${ENV.PORT}`);
    console.log(`[server] root domain: ${ENV.ROOT_DOMAIN}`);
  });
})();
