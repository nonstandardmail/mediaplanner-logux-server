const DB = require("nedb");

class NEDBDataSource {
  constructor(resourceName) {
    this.db = new DB({
      filename: `${process.env["DB_PATH"]}/data-source-${resourceName}.db`,
      autoload: true
    });
  }

  async add(instance, meta) {
    if (await this.get(instance.id)) return this._denormalize(instance);

    return new Promise((resolve, reject) => {
      this.db.insert([{ ...this._normalize(instance), meta }], err =>
        err ? reject(err) : resolve(instance)
      );
    });
  }

  getAll() {
    return new Promise((resolve, reject) => {
      this.db.find({}, (err, docs) =>
        err ? reject(err) : resolve(docs.map(this._denormalize.bind(this)))
      );
    });
  }

  get(id) {
    return new Promise((resolve, reject) => {
      this.db.findOne({ _id: id }, (err, doc) => {
        if (!err) {
          if (!doc || doc.meta.deleted) {
            resolve(null);
          } else {
            resolve(this._denormalize(doc));
          }
        } else {
          reject(err);
        }
      });
    });
  }

  delete(id) {
    return new Promise((resolve, reject) => {
      this.db.remove({ _id: id }, (err, numRemoved) => {
        if (!err) {
          resolve(numRemoved);
        } else {
          reject(err);
        }
      });
    });
  }

  patch(id, attributes, meta) {
    return new Promise((resolve, reject) => {
      this.db.update({ _id: id }, { $set: { ...attributes, meta } }, err => {
        if (!err) {
          resolve(true);
        } else {
          reject(err);
        }
      });
    });
  }

  _normalize(instance) {
    instance["_id"] = instance.id;
    delete instance["id"];
    return instance;
  }

  _denormalize(instance) {
    instance.id = instance["_id"];
    delete instance["_id"];
    return instance;
  }
}

module.exports = NEDBDataSource;
