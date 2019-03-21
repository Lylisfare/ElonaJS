'use strict'

/**
 * @typedef Point2D
 * @property {Number} x X-position
 * @property {Number} y Y-Position
 */

/**
 * @class
 * @classdesc A class that describes a single UI component (text, image, etc.)
 * @property {Object} params A collection of parameters for the component
 * @property {String} id The ID of the component
 * @property {PIXI.Sprite} sprite The component's sprite
 * @property {ElonaJS.UI.Menus.BaseMenu} menu The menu the component is attached to
 * @memberOf ElonaJS.UI.Components
 */
class UniComponent{
    constructor(params){
        this.params = $.extend(true, {}, this._default, params);
        this.id = params.id;
    }

    /** Aligns the component based on the parameters and scaling.
     * @param {Number[]} base The base position of the menu to align on.
     */
    Align(base){
        //let dims = Graphics.Dims();
        let dims = {x: 800, y: 600};
        let point = {x: 0, y: 0};
        let opt = this.params;

        switch(opt.alignment){
            case "relative": point = base; break;
            case "bottom-left": point.y = dims.y; break;
            case "bottom-right": point.y = dims.y; point.x = dims.x; break;
            case "top-right": point.x = dims.x; break;
            case "fill": this.sprite.width = dims.x; this.sprite.height = dims.y; this.sprite.left = 0; this.sprite.top = 0; break;
        }

        this.sprite.position.set(point.x + opt.position.x * Graphics.Scale(), point.y + opt.position.y * Graphics.Scale());

        if(opt.centered && opt.position.x !== undefined){
            if(opt.centerx) this.sprite.position.x = point.x + opt.centerx * Graphics.Scale();
            this.sprite.position.x -= this.sprite.width / 2;
        }
    }

    /**
     * Attaches the component to a menu
     * @param {ElonaJS.UI.Menus.BaseMenu} menu The menu to attach to 
     */
    Attach(menu, collection){
        let ns = menu._SetCollection(collection);
        ns[this.id] = this;
        menu.container.addChild(this.sprite);
        this.menu = menu;
    }

    /** Destroys the UI component. */
    Destroy(){
        if(this.menu) this.menu.DestroyComponent(this);
        else this.sprite.destroy();
    }

    /** Returns the position of the component before scaling.
     * @returns {Point2D}
     */
    GetBasePosition(){
        return {x: this.params.x, y: this.params.y}
    }

    /** Returns the post-scaling height of the component.
     * @returns {Number}
     */
    GetActualHeight(){
        return this.sprite.height;
    }

    /** Returns the position of the sprite post-scaling
     * @returns {Point2D}
     */
    GetActualPosition(){
        return this.sprite.position;
    }

    /** Returns the post-scaling width of the component.
     * @returns {Number}
     */
    GetActualWidth(){
        return this.sprite.width;
    }

    /** Returns the base height (before scaling) of the component
     * @returns {Number}
     */
    GetBaseHeight(){
        return this.params.height;
    }

    /** Returns the base width (before scaling) of the component
     * @returns {Number}
     */
    GetBaseWidth(){
        return this.params.width;
    }

    /** Returns the x value of the component's right edge
     * @returns {Number}
     */
    GetRight(){
        return this.sprite.position.x + this.sprite.width;
    }

    /** Hides the component's sprite. */
    Hide(){
        this.sprite.visible = false;
    }

    Refresh(params){
        this.params = Object.assign(this.params, params);
        if(this._Refresh) this._Refresh();
    }

    /** Modifies the base width of the component (before scaling)
     * @param {Number} w The width to set
     */
    SetBaseWidth(w){
        this.params.width = w;
    }

    /** Scales the element based on a scaling factor.
     * @param {Number} scale The scaling factor
     */
    Scale(scale){
        this.sprite.height = this.params.height * scale;
        this.sprite.width = this.params.width * scale;
    }

    /** Modifies the base x position of the component (before scaling) 
     * @param {Number} x The x position to set
    */
    SetBaseX(x){
        this.params.position.x = x;
    }

    /** Modifies the base y position of the component (before scaling) 
     * @param {Number} y The y position to set
    */
    SetBaseY(y){
        this.params.position.y = y;
    }

    /** Modifies the pivot of the component
     * @param {Number} x The x position to pivot on
     * @param {Number} y The y position to pivot on
    */
    SetPivot(x, y){
        this.sprite.pivot.set(x, y);
    }

    /** Modifies the base position of the component (before scaling)
     * @param {Number} x The x position to set
     * @param {Number} y The y position to set
     */
    SetBasePosition(x, y){
        this.params.position.x = x;
        this.params.position.y = y;
    }

    /** Shows the component's sprite. */
    Show(){
        this.sprite.visible = true;
    }

}

module.exports = UniComponent;