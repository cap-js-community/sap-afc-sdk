"use strict";

const cds = require("@sap/cds");

cds.test(__dirname + "/../..");

process.env.PORT = 0; // Random

describe("i18n", () => {
  it("Check labels existing", () => {
    const entityNames = Object.keys(cds.model.definitions).filter((name) => {
      const definition = cds.model.definitions[name];
      return (
        definition.kind === "entity" &&
        !definition.query &&
        definition.name.startsWith("scheduling.") &&
        !definition.name.endsWith(".texts")
      );
    });
    for (const name of entityNames) {
      const entity = cds.model.definitions[name];
      expect(entity["@title"] ? entity.name : "@title missing").toBe(entity.name);
      let i18n = `${entity.name} -> ${cds.i18n.labels.at(entity)}`;
      expect(cds.i18n.labels.at(entity) ? i18n : "i18n missing").toBe(i18n);
      for (const element of entity.elements) {
        if (["ID", "texts", "localized"].includes(element.name)) {
          continue;
        }
        expect(element["@title"] ? `${entity.name}.${element.name}` : "@title missing").toBe(
          `${entity.name}.${element.name}`,
        );
        let i18n = `${entity.name}.${element.name} -> ${cds.i18n.labels.at(element)}`;
        expect(cds.i18n.labels.at(element) ? i18n : "i18n missing").toBe(i18n);
      }
    }
  });
});
