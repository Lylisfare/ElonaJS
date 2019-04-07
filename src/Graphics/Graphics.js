/**
 * @namespace ElonaJS.Graphics
 */

let Graphics = {
    Init: function(){
        this.App = new PIXI.Application({width: 800, height: 600, transparent: true});
        window.App = this.App;
        this.App.view.id = "game-canvas";
        $('body').append(this.App.view);
    },
    GetWindowDimensions: function(){
        return {x: window.innerWidth, y: window.innerHeight}
    },
    GetCanvasSize: function(){
        if(!Settings.GetByID("adaptive_res")) return {x: 800, y: 600};
        if(Settings.GetByID("adaptive_res").value) return this.GetWindowDimensions();
        else return Utils.Parse.Dim2DInt(Settings.GetByID("canvas_resolution").value);
    },
    Scale: function(){return 1;},
    Spriting: require("./spriting.js"),
    Composers: require("./Composers/Composers.js")
};


module.exports = Graphics;