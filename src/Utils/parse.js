'use strict'

/**
 * @namespace ElonaJS.Utils.Parse
 */
let Parse = {};

/**
 * Compares two objects based on JSON.stringify
 * @memberOf ElonaJS.Utils.Parse
 * @function
 * @returns {Boolean}
 * @name ObjEq
 */
Parse.ObjEq = function(a, b){
    return JSON.stringify(a) == JSON.stringify(b);
}

Parse.Dim2DInt = function(str){
    let n = str.replace(" ", "");
    n = n.split("x");

    if(n.length != 2) return undefined;
    n[0] = parseInt(n[0]);
    n[1] = parseInt(n[1]);

    if(isNaN(n[0]) || isNaN(n[1])) return undefined;
    return n;
}


module.exports = Parse;