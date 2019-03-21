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


module.exports = Parse;