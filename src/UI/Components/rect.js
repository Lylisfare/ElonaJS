let UniComponent = require("./unicomponent.js");

/**
 * Parameters that define a rectangle component
 * @typedef RectParams
 * @property {Point3D} position The position of the rectangle
 * @property {Number} [height=1] The height of the rectangle
 * @property {Number} width The width of the rectangle
 * @property {Number} [alpha=1] The opacity of the rectangle
 * @property {Number} [color=0x000000] The color of the rectangle
 * @property {String} [alignment="relative"] The alignment of the rectangle
 */

/**
  * A class representing a rectangle UI component
  * @extends ElonaJS.UI.Components.UniComponent
  * @class
  * @memberOf ElonaJS.UI.Components
  * @property {RectParams} _default The default parameters for a rectangle.
  * @property {RectParams} params The parameters of the Rect
  */
class Rect extends UniComponent{
    /**
     * @param {RectParams} params The parameters for the rectangle 
     */
    constructor(params){
        super(params);
        this.sprite = Graphics.Spriting.GetRect(this.params);
    }
}

Rect.prototype._default = {
    color: 0x000000, 
    alignment: "relative", 
    height: 1, 
    position: {x: 0, y: 0, z: 3},
    alpha: 1
};

module.exports = Rect;