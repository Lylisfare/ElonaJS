'use strict'

let BaseMenu = require("./basemenu.js");

/**
 * The loading screen.
 * @name LoadingScreen
 * @type ElonaJS.UI.Menus.BaseMenu
 * @memberOf ElonaJS.UI.Menus
 */
let LoadingScreen = new BaseMenu();

LoadingScreen._OnLoad = function(){
    if(this.init){
        this.components.lg.SetBaseX(this.components["Header"].GetActualWidth() + 23);
        this.components.lg.SetBaseY(35);
        this.container.alpha = 1;
        this._ClearMessages();
        return;
    }

    this.init = true;
    this.num_messages = 0;
            
    new UI.Components.Text({id: "Header", text: "ElonaJS Ver." + ElonaJS.ver, position: {x: 0, y: 25, z: 2}, size: 24, color: "white", alignment: "top-left"}).Attach(this);
    new UI.Components.Rect({id: "BG", position: {z: 0}, width: 800, height: 600, color: "black", alignment: "fill"}).Attach(this);
    new UI.Components.Image({id: "lg", position: {x: this.components["Header"].GetActualWidth() + 23, y: 35, z: 1}, img: "loadlg", alignment: "top-left"}).Attach(this);
    new UI.Components.Rect({id: "Bar", position: {y: 55, z: 1}, width: this.components["Header"].GetActualWidth()+50, height: 5, color: "0xFFFFFF", alignment: "top-left"}).Attach(this);

    this.components.lg.SetPivot(9, 17);
    App.ticker.add(this._Animate, this);
}


LoadingScreen._Animate = function(){
    this.components.lg.sprite.rotation += 0.2;
}

LoadingScreen._OnExit = function(){
    App.ticker.remove(this._Animate, this);
}


module.exports = LoadingScreen;