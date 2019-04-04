let BaseMenu = require("./basemenu.js");

/**
 * The race select menu.
 * @name SettingsMenu
 * @type ElonaJS.UI.Menus.BaseMenu
 * @memberOf ElonaJS.UI.Menus
 */
let SettingsMenu = new BaseMenu();

SettingsMenu.Customize({
    position: {x: 175, y: 100},
    centered: true,
    size: {w: 450, h: 400}
});

SettingsMenu._OnLoad = function(category){
    if(this.init){
        this._BuildOptions(category);
        return;
    }

    this.init = true;

    new UI.Components.Image({id: "Paper", img: "interface.paper", position: {z: 0}, width: 450, height: 400, shadow: {distance: 10, blur: 0}}).Attach(this);
    new UI.Components.Image({id: "BG_Deco", img: "cbg3", position: {x: 30, y: 40, z: 1}, width: 290, height: 350, alpha: 0.2}).Attach(this);
    new UI.Components.PaperFooter({id: "Hint", position: {x: 30, y: 370}, text: {i18n: "hints.3b"}, rect: {width: 350}}).Attach(this);
    new UI.Components.PaperHeader({id: "Display", text: {text:"Display Settings"}}).Attach(this);
    new UI.Components.Text({id: "Desc", text: "", position: {x: 50, y: 340}, color: "blue", wrap: {width: 350, spacing: 16}}).Attach(this);
    this._BuildOptions(category);
}

SettingsMenu._BuildOptions = function(category){
    let setlist = DB.Settings.Search({category: category});
    let options = [];


    for(let i = 0; i < setlist.length; i++){
        options.push(setlist[i].GetAsOption());
    }

    this.options.CustomizeList({position: {x: 60, y: 50}, spacing: 25});
    this.options.CustomizeStyle({keyimage: {enabled: false}, keytext: {enabled: false}});
    this.options.Set(options);
}

SettingsMenu._OnBack = function(){
    UI.UnloadMenu(this);
    UI.LoadMenu("TitleScreen");
}

module.exports = SettingsMenu;