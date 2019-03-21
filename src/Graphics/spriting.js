/**
 * A collection of spriting methods.
 * @namespace ElonaJS.Graphics.Spriting
 * @memberOf ElonaJS.Graphics
 */
let Spriting = {};

/**
 * A method to create a rectangle graphic based on input parameters.
 * @memberOf ElonaJS.Graphics.Spriting
 * @function
 * @name GetRect
 * @param {RectParams} params The parameters of the rectangle
 * @returns PIXI.Sprite
 */
Spriting.GetRect = function(params){
    let rect = new PIXI.Graphics();
    rect.beginFill(params.color, params.alpha);
    rect.drawRect(0, 0, params.width, params.height);
    rect.endFill();
    rect.position.set(params.position.x, params.position.y);
    rect.z = params.position.z;
    return rect;
}

/**
 * A method to create a text graphic based on input parameters.
 * @memberOf ElonaJS.Graphics.Spriting
 * @function
 * @name GetText
 * @param {TextParams} params The parameters of the text
 * @returns PIXI.Sprite
 */
Spriting.GetText = function(params){
    let style = new PIXI.TextStyle({fontFamily: "OpenSans"});
    //let style = new PIXI.TextStyle();
    for(let i = 0, keys = Object.keys(params); i < keys.length; i++){
        let val = params[keys[i]];
        switch(keys[i]){
            case "size": style.fontSize = val; break;
            case "color": style.fill = val; break;
            case "wrap": style.wordWrap = true; style.wordWrapWidth = val.width; break;
            case "weight": style.fontWeight = val; break;
            case "outline": style.stroke = val.color; style.strokeThickness = val.size; break;
            default: break;
        }
       //breakWords: ElonaJS.GetSetting("language", true) == "JP"
   }
   let sprite = new PIXI.Text((params.i18n ? i18n(params.i18n) : params.text), style);
   sprite.position.set(params.position.x, params.position.y);
   sprite.z = params.position.z;
   return sprite; 
}

/**
 * A method to create a image graphic based on input parameters.
 * @memberOf ElonaJS.Graphics.Spriting
 * @function
 * @name GetImage
 * @param {ImageParams} params The parameters of the text
 * @returns PIXI.Sprite
 */
Spriting.GetImage = function(params){
    let texture = DB.Graphics.Get(params.img, params.width, params.height);
    let sprite = new PIXI.Sprite(texture);

    for(let i = 0, keys = Object.keys(params); i < keys.length; i++){
        let val = params[keys[i]];
        switch(keys[i]){
            case "tint": sprite.tint = val; break;
            case "shadow": sprite.filters = [new PIXI.filters.DropShadowFilter({distance: val.distance, blur: val.blur})]; break;
            case "alpha": sprite.alpha = val; break;
            case "height": sprite.height = val; break;
            case "width": sprite.width = val; break;
            case "position": sprite.position.set(val.x, val.y); break;
            case "scale": sprite.scale.set(val, val); break;
            default: break;
        }
    }
    sprite.z = params.position.z;
    return sprite;
}

module.exports = Spriting;