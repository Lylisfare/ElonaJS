"use strict"

let BaseDB = require("./basedb.js");

/**
 * A database of strings used in the game.
 * @memberOf ElonaJS.Databases
 * @name i18n
 */
let i18n = new BaseDB("i18n");


/**
 * Returns a localized string based on a reference and optional parameters.
 * @memberOf ElonaJS.Databases.i18n
 * @function
 * @param {String} id The identifier for the string
 * @param {Object} params Key-value pairs to modify the returned string
 */
i18n.Get = function(id, params){
    let lv = this.db.findOne({id: id});
    if(lv) lv = lv.value;

    if(!lv) {
        lv = this.db.find({id: {"$contains" : id}});
        if(lv) return lv;
        return null;
    }

    if(!params) return this._ReplaceReferences(id, lv);

    if(lv){
        let keys = Object.keys(params);

        if(params.count !== undefined && params.count != 1){
            let nv = this.db.findOne({id: id + "_plural"});
            if(nv) lv = nv.value;
        }

        for(let i = 0; i < keys.length; i++){
            let val = params[keys[i]];
            lv = lv.replace("%{" + keys[i] + "}", val);
        }

        lv = this._ReplaceReferences(id, lv, params);

        return lv;
    }
}

i18n.GetObj = function(id, params){
    let res = this.Get(id, params);
    if(res.constructor === Array){
        let ret = {};

        for(let i = 0; i < res.length; i++){
            let parts = res[i].id.split(".");
            ret[parts[parts.length-1]] = res[i];
        }
        
        return ret;
    } else return res;
}

i18n.LoadFromJSON = async function(path, merge = false){
    return new Promise((resolve, reject) => {
        Utils.File.GetJSON(path).then((data) => {
            this._ParseAndRegister(data);
            resolve();
        })
    })
}

i18n._ParseAndRegister = function(data, prefix = ""){
    let arr = Object.keys(data);

    for(let i = 0; i < arr.length; i++){
        if(typeof data[arr[i]] == "object" && data[arr[i]].constructor !== Array) this._ParseAndRegister(data[arr[i]], prefix + arr[i] + ".");
        else {
            let toInsert = {id: prefix + arr[i], value: data[arr[i]]};
            this.db.insert(toInsert);
        }
    }
}

i18n._ReplaceReferences = function(id, str, params){
    let matches = str.match(/(?<=\${)(.*?)(?=\})/g);
    if(matches !== null){
        for(let i = 0; i < matches.length; i++){
            if(matches[i] != id) str = str.replace("${" + matches[i] + "}", this.Get(matches[i], params));
        }
        return str;
    }
    return str;
}

module.exports = i18n;