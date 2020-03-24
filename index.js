require("dotenv").config();

const jwt = require("jsonwebtoken");
const { Server } = require("@logux/server");
const LoguxResource = require("./LoguxResource");

const server = new Server(
  Server.loadOptions(process, {
    subprotocol: "1.0.0",
    supports: "1.x",
    root: __dirname,
    port: process.env["PORT"]
  })
);

["plan", "user", "list", "client", "product"].forEach(resourceName => {
  server[`${resourceName}s`] = new LoguxResource(server, resourceName);
});

server.auth((userId, token) => {
  const jwtPayload = jwt.verify(token, process.env["JWT_SECRET"]);
  return userId == jwtPayload.id;
});

server.listen();
