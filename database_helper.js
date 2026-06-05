/**
 * Basic local database helper class (sqlite-style stub).
 */
class DatabaseHelper {
  constructor(dbPath = 'gramcare_local.db') {
    this.dbPath = dbPath;
  }

  async initialize() {
    return { initialized: true, dbPath: this.dbPath };
  }

  async insert(table, payload) {
    return { table, payload, status: 'queued' };
  }

  async list(table) {
    return { table, rows: [] };
  }
}

module.exports = DatabaseHelper;
