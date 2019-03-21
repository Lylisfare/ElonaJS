'use strict'

let env = (typeof process === "object" ? "node" : "browser");
let fs = (env == "node" ? require("fs") : undefined);

/**
 * @namespace ElonaJS.Utils.File
 */
let file_util = {};

/**
 * Asyncronously returns and reads data from a JSON file. Will use fs in Electron and jQuery in browser.
 * @memberOf ElonaJS.Utils.File
 * @function
 * @returns {Object}
 * @name GetJSON
 */
file_util.GetJSON = async function(path){
    return new Promise((resolve, reject) => {
        if(this.env == "node"){
            fs.readFile(path, function(err, data){
                if(data) resolve(JSON.parse(data));
                else resolve(undefined);
            })
        } else {
            $.getJSON(path, function(data){
                resolve(data);
            })
        }
    })
}

/**
 * Asyncronously returns and reads a font file. Will use fs in Electron and jQuery in browser.
 * @memberOf ElonaJS.Utils.File
 * @function
 * @name GetJSON
 */
file_util.LoadFont = async function(name, path){
    return new Promise((resolve, reject) => {
        if(this.env == "node"){
            let fs = require("fs");
            fs.readFile(path, function(err, data){
                let nf = new FontFace(name, data);
                nf.load().then((loaded_face) => {document.fonts.add(loaded_face); resolve()});
            })
        } else {
            let nf = new FontFace(name, 'url(' + path + ')');
            nf.load().then(function(loaded_face){
                document.fonts.add(loaded_face);
                resolve(true);
            });
        }
    })
}

module.exports = file_util;