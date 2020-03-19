const isFirstOlder = require("@logux/core/is-first-older");
const { omit } = require("ramda");

class WriteModel {
  constructor(resourceName, server, ds) {
    server.type(`${resourceName}/add`, {
      access(ctx, action, meta) {
        return true;
      },
      resend(ctx, action, meta) {
        return { channel: resourceName };
      },
      async process(ctx, action, meta) {
        await ds.add(action.payload, meta);
      }
    });

    server.type(`${resourceName}/patch`, {
      access(ctx, action, meta) {
        return true;
      },
      resend(ctx, action, meta) {
        return { channel: resourceName };
      },
      async process(ctx, action, meta) {
        const resource = await ds.get(action.payload.id);
        if (isFirstOlder(resource && resource.meta, meta)) {
          await ds.patch(action.payload.id, omit(["id"], action.payload), meta);
        }
      }
    });

    server.type(`${resourceName}/delete`, {
      access(ctx, action, meta) {
        return true;
      },
      resend(ctx, action, meta) {
        return { channel: resourceName };
      },
      async process(ctx, action, meta) {
        await ds.delete(action.payload);
      }
    });
  }
}

module.exports = WriteModel;
