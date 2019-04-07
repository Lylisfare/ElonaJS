let UniComponent = require("./unicomponent.js");

/**
 * @typedef Outline
 * @property {Number} color The color of the outline
 * @property {Number} size The size of the outline
 */

/**
 * @typedef Point3D
 * @property {Number} x X-Position
 * @property {Number} y Y-Position
 * @property {Number} z Z-position (or level)
 */

/**
 * @typedef TextWrap
 * @property {Number} width The maximum width of the line
 */

/**
 * Parameters that define a text component
 * @typedef TextParams
 * @property {Point3D} [position] The position of the text. Default: 0, 0, 5
 * @property {Outline} [outline] Outline parameters of the text.
 * @property {TextWrap} [wrap] Text-wrapping parameters of the text.
 * @property {Number} [alpha=1] The opacity of the text
 * @property {Number} [color=0x000000] The color of the text
 * @property {Number} [size=12] The font-size of the text
 * @property {String} [alignment="relative"] The alignment of the text
 * @property {String} [text] The text to display
 * @property {String} [i18n] The identifier of the text
 * @property {String} [weight] The weight of the text
 * @property {Boolean} [centered] Whether the object is centered on the position
 */

/**
  * A class representing a text UI component
  * @extends ElonaJS.UI.Components.UniComponent
  * @class
  * @memberOf ElonaJS.UI.Components
  * @property {TextParams} _default The default parameters for a text
  * @property {TextParams} params The parameters of the text
  * @category UIComponents
  */
class UIText extends UniComponent {
    /**
     * @param {TextParams} params The parameters for the rectangle 
     */
    constructor(params){
        super(params);
        this.sprite = Graphics.Spriting.GetText(this.params);
        if(this.params.i18n) this.sprite.text = i18n(this.params.i18n);
    }

    GetText(){
        return this.sprite.text;
    }

    Reconstruct(params){
        if(params.size) this.sprite._style.fontSize = params.size;
        else this.sprite._style.fontSize = this._default.size;

        if(params.color) this.sprite._style.fill = params.color;
        else this.sprite._style.fill = this._default.color;

        if(params.wrap) {
            this.sprite._style.wordWrap = true;
            this.sprite._style.wordWrapWidth = params.wrap.width;
        } else this.sprite._style.wordWrap = false;

        if(params.weight) this.sprite._style.fontWeight = params.weight;
        else this.sprite._style.fontWeight = "normal";

        if(params.outline) {
            this.sprite._style.stroke = params.outline.color;
            this.sprite._style.strokeThickness = params.outline.size;
        } else this.sprite._style.strokeThickness = 0;

        if(!params.alignment) params.alignment = "relative";

        if(params.text) this.SetText(params.text);

        this.params = params;
        if(params.i18n) this.RefreshI18n();
    }

    RefreshI18n(){
        if(this.params.i18n) this.SetText(i18n(this.params.i18n));
    }

    Scale(scale){
        this.sprite.style.fontSize = this.params.size * scale;
        if(this.params.i18n) this.sprite.text = i18n(this.params.i18n);
        if(this.params.wrap){
            this.sprite._style._wordWrapWidth = this.params.wrap.width * scale
        }
    }

    SetText(str){
        this.sprite.text = str;
    }

    UpdateStyle(obj){
        this.sprite.setStyle(Object.assign(this.sprite._style, obj));
    }
}

UIText.prototype._default = {
    type: "text", 
    alignment: "relative", 
    color: 0x000000,
    position: {x: 0, y: 0, z: 5},
    size: 12,
    alpha: 1
};

module.exports = UIText;