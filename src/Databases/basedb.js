'use strict'

/**
 * @class
 * @classdesc A base DB class for game data.
 * @property {Object} last The last piece of data returned from a search.
 * @property {Function} castAs A class object to cast all added members to.
 * @property {LokiDB} db The relevant collection of the master LokiDB.
 */
class BaseDB{
    /**
     * @param {String} name Identifier for the database
     * @param {Array} [indexes] A string array of indexes for the database
     * @param {LokiDB} [master] The master LokiDB object 
     * @param {Function} [cast] A class object to cast all added members to.
     */
    constructor(name, indexes, master, cast){
        this.last = null;
        this.castAs = cast;
        if(master) this.db = master.addCollection(name, indexes);
    }

    /**
     * Returns a single document from the DB based on ID
     * @param {String} id The ID of the document to find
     * @returns {Object}
     */
    GetByID(id){
        return this.db.findOne({id: id});
    }

    /**
     * Returns all documents from the DB.
     */
    GetAll(){
        return this.db.find({});
    }

    /**
     * An asynchronous method to load documents from a JSON file.
     * @param {String} path The path to the JSON file
     * @param {Boolean} [merge=false] Whether documents should be merged or overwritten
     */
    async LoadFromJSON(path, merge = false){
        let self = this;

        return new Promise((resolve, reject) => {
            Utils.File.GetJSON(path).then((data) => {
                if(merge === true) self.BatchMerge(data);
                else self.BatchLoad(data);
                resolve();
            })
        })
    }

    /**
     * Adds all values of the object as entries in the DB.
     * @param {Object} obj A multi-key object
     */
    BatchLoad(obj){
        for(let entry in obj) this.Register(obj[entry]);
    }

    /**
     * Merges all values of the object as entries in the DB.
     * @param {Object} obj A multi-key object
     */
    BatchMerge(obj){
        for(let entry in obj) this.Merge(obj[entry]);
    }

    /**
     * Adds a single object to the DB
     * @param {Object} obj The object to add
     */
    Register(obj){
        if(this.baseClass) this.db.insert(new this.baseClass(obj));
        else this.db.insert(obj);
    }

    /**
     * Merges a single object to the DB
     * @param {Object} obj The object to add
     */
    Merge(obj){
        let old = this.db.findOne({id: obj.id});
        if(!old) this.db.insert(obj);
        else {
            Object.assign(old, obj);
            this.db.update(old);
        }
    }

    /**
     * Searches the DB based on specified parameters.
     * @param {Object} obj The parameters to search for
     * @returns {Array} 
     */
    Search(obj){
        return this.db.find(obj);
    }

    /**
     * Resets the name, indexes, and master LokiDB of the collection.
     * @param {String} name Identifier for the database
     * @param {Array} indexes A string array of indexes for the database
     * @param {LokiDB} master The master LokiDB object 
     */
    SetDB(name, indexes, master){
        this.db = master.addCollection(name, indexes);
    }
}

module.exports = BaseDB;