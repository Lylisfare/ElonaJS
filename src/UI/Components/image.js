let UniComponent = require("./unicomponent.js");

/**
 * @typedef Shadow
 * @property {Number} distance The length of the shadow
 * @property {Number} blur The blur of the shadow
 */


/**
 * @typedef ImageParams
 * @property {Point3D} position The position of the image
 * @property {Shadow} [shadow] The parameters for the image's drop shadow
 * @property {String} alignment The alignment of the image
 * @property {String} img The identifier of the image
 * @property {Number} tint The tint of the image
 * @property {Number} alpha The alpha of the image
 * @property {Number} height The height of the image
 * @property {Number} width The width of the image
 */

 /**
  * A class representing an image UI component
  * @extends ElonaJS.UI.Components.UniComponent
  * @class
  * @memberOf ElonaJS.UI.Components
  * @property {ImageParams} _default The default parameters for the image
  * @property {ImageParams} params The parameters of the image
  */
class Image extends UniComponent{
    /**
     * @param {ImageParams} params The parameters of the image
     */
    constructor(params){
        super(params);
        this.sprite = Graphics.Spriting.GetImage(this.params);
    }

    Scale(scale){
        if(this.params.height !== undefined){
            this.sprite.height = this.params.height * scale;
            this.sprite.width = this.params.width * scale;
        } else{
            this.sprite.scale.x = scale;
            this.sprite.scale.y = scale;
        }
    }

    SetImage(id){
        this.sprite.setTexture(DB.Graphics.Get(id));
    }
}

Image.prototype._default = {
    type: "image",
    alignment: "relative",
    position: {x: 0, y: 0, z: 2},
    alpha: 1
};

module.exports = Image;