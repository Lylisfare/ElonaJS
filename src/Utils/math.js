/**
 * A collection of math functions
 * @namespace ElonaJS.Utils.Math
 * @name Math
 * @memberOf ElonaJS.Utils
 */
let math_util = {};

/**
 * Returns a floored random number up to a given ceiling
 * @memberOf ElonaJS.Utils.Math
 * @function
 * @param {Number} num Upper limit for the random number 
 * @returns {Number} Random number
 */
math_util.RandomFloor = function(num){
    return Math.floor(Math.random() * num);
}

/**
 * Returns the closest multiple of a divisor & base, floored.
 * @memberOf ElonaJS.Utils.Math
 * @function
 * @param {Number} divisor The number to divide by
 * @param {Number} base The number to be divided
 * @returns {Number} The nearest multiple
 */
math_util.NearestMultiple = function(divisor, base){
    return Math.floor(base/divisor);
}

module.exports = math_util;