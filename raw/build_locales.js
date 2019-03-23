'use strict'

module.paths.push('D:/Apps/NodeJS/App/node_modules');
var jsonConcat = require("json-concat");
var jsonminify = require("jsonminify");
var fs = require('fs');

let out;

async function GetJSON(path){
    return new Promise((resolve, reject) => {
        fs.readFile(path, function(err, data){
            if(data) resolve(JSON.parse(data));
            else resolve(undefined);
        })
    })
}

async function SaveJSON(path, towrite){
    return new Promise((resolve, reject) => {
        fs.writeFile(path, JSON.stringify(towrite), "utf8", () => {
            resolve();
        })
    })
}

(async () => {
    jsonConcat({
        src: "./locale/en",
        dest: "../build/locale/en.json"
    }, async function(json){
        out = await GetJSON("../build/locale/en.json");
        await SaveJSON("../build/locale/en.json", out);
    })
    
    jsonConcat({
        src: "./locale/jp",
        dest: "../build/locale/jp.json"
    }, async function(json){
        out = await GetJSON("../build/locale/jp.json");
        await SaveJSON("../build/locale/jp.json", out);
    })
    
    jsonConcat({
        src: "./data",
        dest: "../build/data/data.json"
    }, async function(json){
        out = await GetJSON("../build/data/data.json");
        await SaveJSON("../build/data/data.json", out);
    })
})();



