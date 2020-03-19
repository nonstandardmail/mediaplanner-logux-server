class WriteModel {
  constructor(resourceName, server, ds) {
    server.channel(resourceName, {
      access(ctx, action, meta) {
        return true;
      },
      async init(ctx, action, meta) {
        for (let instance of await ds.getAll()) {
          ctx.sendBack({
            type: `${resourceName}/add`,
            payload: instance
          });
        }
      }
    });
  }
}

module.exports = WriteModel;
