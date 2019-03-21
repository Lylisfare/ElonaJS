let Graphics = {
    Init: function(){
        this.App = new PIXI.Application({width: 800, height: 600, transparent: false, antialias: true});
        window.App = this.App;
        this.App.view.id = "game-canvas";
        $('body').append(this.App.view);
    },
    Scale: function(){return 1;},
    Spriting: require("./spriting.js"),
    Composers: require("./Composers/Composers.js")
};


module.exports = Graphics;