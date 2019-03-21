"use strict"

let BaseDB = require("./basedb.js");

/**
 * @class
 * @classdesc An extension of the base DB which assumes the Register function is asynchronous
 * @extends BaseDB
 */
class AsyncDB extends BaseDB{
    constructor(name, indexes, master, cast){
        super(name, indexes, master, cast)
    }

    async BatchLoad(arr){
        for(let i = 0, keys = Object.keys(arr); i < keys.length; i++){
            await this.Register(arr[keys[i]]);
        }
    }

    async LoadFromJSON(path, merge){
        let self = this;
        return new Promise( (resolve, reject) => {
            $.getJSON(path, async function(data){
                await self.BatchLoad(data);
                resolve();
            });
        })
    }
}

module.exports = AsyncDB;