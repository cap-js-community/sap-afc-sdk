"use strict";

const os = require("os");
const path = require("path");

const SQLiteService = require("@cap-js/sqlite/lib/SQLiteService");

const Defaults = {
  ttl: 1000 * 60 * 10, // 10 minutes
  size: 100, // 100 MB (for all tenants)
  wait: true,
};

class ReplicationCache {
  constructor(service, options) {
    this.service = service;
    this.options = { ...(cds.env.replicationCache || {}), ...options };
    this.service.prepend(() => {
      this.service.on("READ", this.read.bind(this));
    });
    this.cache = new Map();
    this.ttl = this.options.ttl ?? Defaults.ttl;
    this.maxSize = (this.options.size ?? Defaults.size) * 1024;
    this.wait = this.options.wait ?? Defaults.wait;
    this.log = cds.log("/replicationCache");
  }

  async read(req, next) {
    if (!req.query._replication && (await this.active(req.tenant))) {
      const refs = refsQuery(req.query);
      if (this.relevant(refs)) {
        const tenant = await cached(this.cache, req.tenant, async () => {
          const model = req.model ?? cds.model;
          return {
            id: req.tenant,
            csn: model.definitions,
            db: await db(req.tenant, model, this.options),
            cache: new Map(),
          };
        });
        let prepares = [];
        for (const ref of refs) {
          const entry = await cached(tenant.cache, ref, () => {
            return new ReplicationCacheEntry(this, tenant, ref);
          });
          if (!entry.ready) {
            prepares.push(entry.prepare(req));
          }
          entry.touched = Date.now();
        }
        if (this.wait) {
          await Promise.all(prepares);
          prepares = [];
        }
        if (prepares.length === 0) {
          try {
            return tenant.db.tx({ ...req.context }, async (tx) => {
              return tx.run(req.query);
            });
          } catch (err) {
            this.log.error("Reading from replication cache failed", err, req.query);
          }
        }
      }
    }
    return await next();
  }

  relevant(refs) {
    if (refs.length === 0) {
      this.log.debug("Replication cache not relevant for query without refs");
      return false;
    }
    const ref = refs.find((ref) => !cds.model.definitions[ref]?.["@cds.replicate"]);
    if (ref) {
      this.log.debug("Replication cache not relevant for query including ref", ref);
      return false;
    }
    return true;
  }

  async invalidate(tenant, ref) {
    const tenants = tenant ? [tenant] : this.cache.keys();
    for (const key of tenants) {
      const tenant = this.cache.get(key);
      if (tenant) {
        const refs = ref ? [ref] : tenant.cache.keys();
        for (const ref of refs) {
          tenant.cache.get(ref)?.clear();
        }
      }
    }
  }

  async size(tenant) {
    let size = 0;
    const tenants = tenant ? [tenant] : this.cache.keys();
    for (const key of tenants) {
      const tenant = this.cache.get(key);
      await tenant.db.tx(async (tx) => {
        const result = await tx.run("select page_size * page_count as bytes from pragma_page_count(), pragma_page_size()");
        size += result[0]?.bytes ?? 0;
      });
    }
    return size;
  }

  async active(tenant) {
    if (typeof this.options.active === "function") {
      await typeof this.options.active(tenant);
    }
    return true;
  }
}

class ReplicationCacheEntry {
  constructor(cache, tenant, ref) {
    this.cache = cache;
    this.service = cache.service;
    this.tenant = tenant;
    this.csn = tenant.csn;
    this.db = tenant.db;
    this.ref = ref;
    this.name = "";
    this.definition = this.csn[ref];
    this.initialized = false;
    this.ready = false;
    this.touched = Date.now();
    this.timestamp = Date.now();
    this.timeout = null;
    this.ttl = this.definition["@cds.replicate.ttl"] || this.cache.ttl;
    this.size = 0; // bytes
  }

  async prepare(req) {
    if (!this.preparing) {
      // eslint-disable-next-line no-async-promise-executor
      this.preparing = new Promise(async (resolve) => {
        if (!this.initialized) {
          await this.initialize();
        }
        if (!this.ready) {
          await this.load(req);
          this.timeout = setTimeout(async () => {
            await this.clear();
          }, this.ttl).unref();
        }
        resolve();
        this.preparing = null;
      });
    }
    return this.preparing;
  }

  async initialize() {
    const csn = {
      definitions: {
        [this.definition.name]: {
          name: this.definition.name,
          kind: "entity",
          elements: Object.keys(this.definition.elements).reduce((result, name) => {
            const element = this.definition.elements[name];
            if (element.type !== "cds.Association" && element.type !== "cds.Composition") {
              result[name] = element;
            }
            return result;
          }, {}),
        },
      },
    };
    // TODO: Localized: Create View with localized elements to _texts table
    const ddl = cds.compile(csn).to.sql({ dialect: "sqlite" })?.[0]?.replace(/\n/g, "");
    this.name = /CREATE (TABLE|VIEW) ([^ ]*?) /.exec(ddl)?.[2] || this.name.replace(/\./gi, "_");
    await this.db.tx(async (tx) => {
      const result = await tx.run("SELECT name FROM sqlite_schema WHERE type = 'table' and name = ?", [this.name]);
      if (result.length === 0) {
        await tx.run(ddl);
      }
    });
    this.timestamp = Date.now();
    this.initialized = true;
  }

  async load(req) {
    await this.clear();
    const tx =
      this.service instanceof SQLiteService ? this.service.tx(req) : this.service.tx({ tenant: this.tenant.id });
    const query = SELECT.from(this.definition);
    query._replication = true;
    const data = await tx.run(query);
    // TODO: chunked / stream
    await this.db.tx(async (tx) => {
      await tx.run(INSERT.into(this.definition).entries(data));
      const result = await tx.run("select sum(pgsize) as bytes from dbstat where name = ?", [this.name]);
      this.size = result[0]?.bytes ?? 0;
    });
    this.timestamp = Date.now();
    this.ready = true;
  }

  async clear() {
    this.ready = false;
    await this.db.tx(async (tx) => {
      await tx.run("DELETE from " + this.name);
    });
    this.timestamp = Date.now();
  }
}

module.exports = ReplicationCache;

async function db(tenant, model, options) {
  let database = ":memory:";
  if (options?.credentials?.database && options?.credentials?.database !== database) {
    const tmpDir = os.tmpdir();
    database = options?.credentials?.database;
    if (tenant) {
      const parts = database.split(".");
      const extension = parts.pop();
      database = path.join(tmpDir, `${parts.join(".")}-${tenant}.${extension}`);
    }
    delete options?.credentials?.database;
  }
  const db = new SQLiteService(tenant ?? "-", model, {
    kind: "sqlite",
    impl: "@cap-js/sqlite",
    credentials: {
      database,
    },
    ...options,
  });
  await db.init();
  return db;
}

async function cached(cache, field, call) {
  if (call && !cache.get(field)) {
    cache.set(field, call());
  }
  try {
    return await cache.get(field);
  } catch (err) {
    cache.delete(field);
    throw err;
  }
}

function refsQuery(query) {
  let refs = [];
  for (const result of refsFrom(query)) {
    refs = refs.concat(Array.isArray(result) ? result[0] : result);
  }
  return [...new Set(refs)].sort();
}

function refsFrom(query) {
  if (!query.SELECT) {
    return [];
  }
  let refs = [];
  if (query.SELECT.from.SELECT) {
    return refsFrom(query.SELECT.from);
  }
  if (query.SELECT.from.ref) {
    refs = [query.SELECT.from.ref];
  } else if (query.SELECT.from.join && query.SELECT.from.args) {
    refs = query.SELECT.from.args.map((arg) => {
      return arg.ref || arg;
    });
  } else if (query.SELECT.from.SET) {
    refs = query.SELECT.from.SET.args;
  }
  if (query.target && query.SELECT.columns) {
    refs = refs.concat(refsExpand(query.target, query.SELECT.columns));
  }
  let resultRefs = [];
  for (const ref of refs) {
    if (ref.SELECT) {
      resultRefs = resultRefs.concat(refsFrom(ref));
    } else if (ref.join && ref.args) {
      resultRefs = resultRefs.concat(refsFrom({ SELECT: { from: ref } }));
    } else {
      resultRefs.push(ref);
    }
  }
  return resultRefs;
}

function refsExpand(definition, columns) {
  let refs = [];
  for (const column of columns) {
    if (column.expand) {
      const expandDefinition = definition.elements[column.ref[0]];
      refs.push([expandDefinition._target.name]);
      refs = refs.concat(refsExpand(expandDefinition, column.expand));
    }
  }
  return refs;
}
