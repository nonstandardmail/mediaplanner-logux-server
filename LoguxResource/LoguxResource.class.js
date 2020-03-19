const NEDBDataSource = require("./NEDBDataSource.class.js");
const WriteModel = require("./WriteModel.class");
const ReadModel = require("./ReadModel.class");
//Todo: acl
//Todo: schema definition and validation on add and update
//Todo: implement https://logux.io/guide/concepts/subscription/#channel-filters
//Todo: generate atomic actions based on schema?

class LoguxResource {
  constructor(server, resourceName) {
    this.ds = new NEDBDataSource(resourceName);
    this.writeModel = new WriteModel(resourceName, server, this.ds);
    this.readModel = new ReadModel(resourceName, server, this.ds);
  }
}

module.exports = LoguxResource;
