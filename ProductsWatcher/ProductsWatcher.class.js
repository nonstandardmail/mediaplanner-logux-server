const debug = require("debug")("ProductsWatcher");
const md5 = require("md5");
const {
  without,
  prop,
  map,
  propEq,
  find,
  omit,
  equals,
  not,
  filter
} = require("ramda");

const rp = require("request-promise");

const omitProductMetas = omit(["meta", "updatedAt", "createdAt", "archived"]);
// todo: при удалении ставь archived. В интерфейсе надо будет учесть пометку для таких позиуий в плане
// что позиуия была удалена
class ProductsWatcher {
  constructor(options) {
    debug("initializing products watcher");
    Object.assign(this, options);
    this.previousGroundTruthHash = md5("");
  }

  async runSync(groundTruth) {
    const storedProducts = await this.server.products.ds.getAll();
    const storedProductsIds = map(prop("id"), storedProducts);
    const groundTruthIds = map(prop("id"), groundTruth);
    const productsToDeleteIds = filter(deleteCandidateId => {
      return !find(propEq("id", deleteCandidateId), storedProducts).archived;
    }, without(groundTruthIds, storedProductsIds));
    const productsToAddIds = without(storedProductsIds, groundTruthIds);
    const candidatesToPatchIds = without(productsToAddIds, groundTruthIds);
    const productsToPatchIds = [];
    for (const candidateId of candidatesToPatchIds) {
      const storedProductWithoutMetaFields = omitProductMetas(
        find(propEq("id", candidateId), storedProducts)
      );
      const groundTruthProductWithoutMetaFields = omitProductMetas(
        find(propEq("id", candidateId), groundTruth)
      );
      if (
        not(
          equals(
            storedProductWithoutMetaFields,
            groundTruthProductWithoutMetaFields
          )
        )
      ) {
        productsToPatchIds.push(candidateId);
      }
    }
    debug(`found:`);
    debug(`├── ${productsToAddIds.length} products to add`);
    debug(`├── ${productsToDeleteIds.length} products to delete`);
    debug(`└── ${productsToPatchIds.length} products to patch`);
    for (const productToAddId of productsToAddIds) {
      const productToAdd = find(propEq("id", productToAddId), groundTruth);
      this.server.log.add(
        { type: "product/add", payload: productToAdd },
        { channels: ["product"] }
      );
    }
    for (const productToDeleteId of productsToDeleteIds) {
      this.server.log.add(
        {
          type: "product/patch",
          payload: { id: productToDeleteId, archived: true }
        },
        { channels: ["product"] }
      );
    }
    for (const productsToPatchId of productsToPatchIds) {
      const productToPatch = find(propEq("id", productsToPatchId), groundTruth);
      this.server.log.add(
        {
          type: "product/patch",
          payload: productToPatch
        },
        { channels: ["product"] }
      );
    }
  }

  async checkInventoryForUpdates() {
    const groundTruth = await rp.get(this.inventoryServiceURL);
    const groundTruthHash = md5(groundTruth);
    const groundTruthChanged = groundTruthHash !== this.previousGroundTruthHash;
    this.previousGroundTruthHash = groundTruthHash;
    if (groundTruthChanged) {
      this.runSync(JSON.parse(groundTruth));
    } else {
      debug("inventory has no changes");
    }
  }

  start() {
    setInterval(() => {
      debug("starting scheduled check for inventory updates");
      this.checkInventoryForUpdates();
    }, this.frequency * 1e3);
    debug("starting initial check for inventory updates");
    this.checkInventoryForUpdates();
  }
}

module.exports = ProductsWatcher;
