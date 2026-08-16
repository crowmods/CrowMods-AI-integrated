const { app } = require("../../apps/api/src/foundation");

function startServer() {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      resolve({
        server,
        base: `http://127.0.0.1:${server.address().port}`
      });
    });
  });
}

async function stopServer(ctx) {
  await new Promise((resolve) => ctx.server.close(resolve));
}

module.exports = { startServer, stopServer };