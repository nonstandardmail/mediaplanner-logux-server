require("dotenv").config();

const debug = require("debug")("boot");
const jwt = require("jsonwebtoken");
const { Server } = require("@logux/server");
const LoguxResource = require("./LoguxResource");
const ProductsWatcher = require("./ProductsWatcher");

debug("instantiating logux server");
const server = new Server(
  Server.loadOptions(process, {
    subprotocol: "1.0.0",
    supports: "1.x",
    root: __dirname,
    port: process.env["PORT"]
  })
);

debug("registering logux resources");

["plan", "user", "list", "client", "product"].forEach(resourceName => {
  server[`${resourceName}s`] = new LoguxResource(server, resourceName);
});

debug("setting up products watcher");
server.productsWatcher = new ProductsWatcher({
  server,
  frequency: process.env["INVENTORY_UPDATE_FREQUENCY_SEC"],
  inventoryServiceURL: process.env["INVENTORY_URL"]
});

debug("setting up authentication");
server.auth((userId, token) => {
  debug(`authenticating user with id ${userId} with auth token ${token}`);
  const jwtPayload = jwt.verify(token, process.env["JWT_SECRET"]);
  return userId == jwtPayload.id;
});

server.listen().then(() => {
  debug("starting products watcher");
  server.productsWatcher.start();
});
