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

    Reconstruct(params){
        if(params.tint) this.sprite.tint = params.tint;
        else this.sprite.tint = 0xFFFFFF;

        if(params.shadow) this.sprite.filters = [new PIXI.filters.DropShadowFilter({distance: params.shadow.distance, blur: params.shadow.blur})]
        else this.sprite.filters = [];

        if(params.alpha) this.sprite.alpha = params.alpha;
        else this.sprite.alpha = 1;

        if(params.position) this.sprite.position.set(params.position.x, params.position.y);

        if(params.scale) this.sprite.scale.set(params.scale, params.scale);
        else this.sprite.scale.set(1, 1);

        if(params.img && this.params.img != params.img){
            this.sprite.setTexture(DB.Graphics.Get(params.img), true, params.width, params.height);
        }

        if(!params.alignment) params.alignment = "relative";

        this.params = params;
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