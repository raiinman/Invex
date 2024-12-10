// localStorageDB Modernized (2024)
// Kailash Nadh's original script updated for ES6+ compatibility and modern JavaScript standards

(function (_global) {
    class LocalStorageDB {
        constructor(dbName, engine = localStorage) {
            this.dbPrefix = 'db_';
            this.dbId = `${this.dbPrefix}${dbName}`;
            this.dbNew = false;
            this.storage = engine;
            this.db = null;

            if (!this._isValidName(dbName)) {
                throw new Error(`Invalid database name: '${dbName}'`);
            }

            const existingDB = this.storage[this.dbId];
            if (existingDB) {
                this.db = JSON.parse(existingDB);
                if (!this.db.tables || !this.db.data) {
                    this._initializeDB();
                }
            } else {
                this._initializeDB();
                this.dbNew = true;
            }
        }

        _initializeDB() {
            this.db = { tables: {}, data: {} };
            this._commit();
        }

        _isValidName(name) {
            return /^[a-zA-Z_0-9]+$/.test(name);
        }

        _commit() {
            try {
                this.storage.setItem(this.dbId, JSON.stringify(this.db));
                return true;
            } catch (e) {
                console.error('Failed to commit database:', e);
                return false;
            }
        }

        _clone(obj) {
            return JSON.parse(JSON.stringify(obj));
        }

        // Public Methods

        drop() {
            delete this.storage[this.dbId];
            this.db = null;
        }

        isNew() {
            return this.dbNew;
        }

        createTable(tableName, fields) {
            if (!this._isValidName(tableName)) {
                throw new Error(`Invalid table name: '${tableName}'`);
            }
            if (this.db.tables[tableName]) {
                throw new Error(`Table '${tableName}' already exists.`);
            }
            const validFields = ['ID', ...new Set(fields.filter(this._isValidName))];
            this.db.tables[tableName] = { fields: validFields, autoIncrement: 1 };
            this.db.data[tableName] = {};
            this._commit();
        }

        dropTable(tableName) {
            if (!this.db.tables[tableName]) {
                throw new Error(`Table '${tableName}' does not exist.`);
            }
            delete this.db.tables[tableName];
            delete this.db.data[tableName];
            this._commit();
        }

        insert(tableName, rowData) {
            const table = this.db.tables[tableName];
            if (!table) {
                throw new Error(`Table '${tableName}' does not exist.`);
            }
            const id = table.autoIncrement;
            const newRow = { ID: id, ...rowData };

            table.autoIncrement++;
            this.db.data[tableName][id] = this._filterFields(tableName, newRow);
            this._commit();
            return id;
        }

        query(tableName, queryFn = () => true) {
            const table = this.db.tables[tableName];
            if (!table) {
                throw new Error(`Table '${tableName}' does not exist.`);
            }
            return Object.values(this.db.data[tableName]).filter(queryFn);
        }

        update(tableName, queryFn, updateFn) {
            const table = this.db.tables[tableName];
            if (!table) {
                throw new Error(`Table '${tableName}' does not exist.`);
            }

            const rows = this.query(tableName, queryFn);
            rows.forEach(row => {
                const updatedRow = { ...row, ...updateFn(this._clone(row)) };
                this.db.data[tableName][row.ID] = this._filterFields(tableName, updatedRow);
            });
            this._commit();
        }

        delete(tableName, queryFn) {
            const table = this.db.tables[tableName];
            if (!table) {
                throw new Error(`Table '${tableName}' does not exist.`);
            }

            const rowsToDelete = this.query(tableName, queryFn);
            rowsToDelete.forEach(row => {
                delete this.db.data[tableName][row.ID];
            });
            this._commit();
        }

        _filterFields(tableName, data) {
            const table = this.db.tables[tableName];
            const validFields = new Set(table.fields);
            return Object.keys(data).reduce((filtered, key) => {
                if (validFields.has(key)) {
                    filtered[key] = data[key];
                }
                return filtered;
            }, {});
        }
    }

    // Expose as a global or a module
    if (typeof define === 'function' && define.amd) {
        define(() => LocalStorageDB);
    } else {
        _global.LocalStorageDB = LocalStorageDB;
    }
})(typeof window !== 'undefined' ? window : global);
