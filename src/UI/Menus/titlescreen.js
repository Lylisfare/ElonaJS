'use strict'

let BaseMenu = require("./basemenu.js");

/**
 * The title screen
 * @name TitleScreen
 * @type ElonaJS.UI.Menus.BaseMenu
 * @memberOf ElonaJS.UI.Menus
 */
let TitleScreen = new BaseMenu();
TitleScreen.position = {x: 80, y: 150};

TitleScreen._OnLoad = function(){
    //UI.RipplesOn();
    ElonaJS.Audio.PlayTrack("orc01");

    if(this.init) return;
    this.init = true;

    new UI.Components.Image({id: "Paper", img: "interface.paper", height: 300, width: 300, shadow: {distance: 10}, position: {z: 0}}).Attach(this);
    new UI.Components.Image({id: "BG_Deco", img: "cbg3", position: {x: 10, y: 30, z: 1}, width: 280, height: 240, alpha: 0.2}).Attach(this);
    new UI.Components.Text({id: "Elona", text: "Elona developed by Noa", alignment: "top-left", position: {x: 10, y: 4}, color: "white"}).Attach(this);
    new UI.Components.Text({id: "ElonaJSVer", text: "ElonaJS Version: " + ElonaJS.ver, alignment: "top-left", position: {x: 10, y: 36}, color: "white"}).Attach(this);
    new UI.Components.Text({id: "Contrib", text: "Elona Contributors: f1r3fly, Sunstrike, Schmidt, Elvenspirit / View the credits for more!", alignment: "top-left", position: {x: 10, y: 52}, color: "white"}).Attach(this);

    new UI.Components.PaperFooter({
        id: "Hint",
        rect: {width: 220},
        text: {i18n: "hints.1"},
        position: {x: 25, y: 256}
    }).Attach(this);

    new UI.Components.PaperHeader({
        id: "Menu",
        text: {i18n: "ui.startmenu.title"},
        position: {x: 25, y: 256}
    }).Attach(this);

    this.options.Customize({position: {x: 70, y: 53}, spacing: 35, perpage: 6});

    this.options.Set([
        {text: {i18n: "ui.startmenu.restore"}},
        {text: {i18n: "ui.startmenu.create"}},
        {text: {i18n: "ui.startmenu.incarnate"}},
        {text: {i18n: "ui.startmenu.homepage"}},
        {text: {text: "Options"}},
        {text: {text: "Debug Menu"}} 
    ]);
}

TitleScreen._OnSelect = function(){
    let next, op;

    switch(this.options.GetCurrent()){
        case 1: UI.UnloadMenu(this);
                UI.LoadMenu("RaceSelect")
                break;
    }

}


module.exports = TitleScreen;