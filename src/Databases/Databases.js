'use strict'

let BaseDB = require("./basedb.js");
let master = new loki();

/**
 * @memberOf ElonaJS
 * @property {BaseDB} Music DB for BGM tracks
 * @property {BaseDB} Sound DB for Sound Effects
 * @property {BaseDB} i18n DB for internationalization
 * @namespace ElonaJS.Databases
 */
let Databases = {
    Music: new BaseDB("Music", ["id"], master),
    Sound: new BaseDB("Sound", ["id"], master),
    Races: new BaseDB("Races", ["id"], master),
    Classes: new BaseDB("Classes", ["id"], master),
    Skills: new BaseDB("Skills", ["id"], master),
    Attributes: new BaseDB("Attributes", ["id"], master),
    Graphics: require("./graphics.js"),
    Settings: require("./settings.js"),
    Traits: new BaseDB("Traits", ["id"], master),
    Misc: new BaseDB("Misc", ["tag"], master),
    i18n: require("./i18n.js"),
    loki: master
}

Databases.i18n.SetDB("i18n", ["id"], master);
Databases.Graphics.SetDB("graphics", ["id"], master);
Databases.Settings.SetDB("Settings", ["id"], master);

window.i18n = Databases.i18n.Get.bind(Databases.i18n);
window.i18nObj = Databases.i18n.GetObj.bind(Databases.i18n);
window.Settings = Databases.Settings;

/**
 * An asyncronous function to load game data into in-memory databases.
 * @memberOf ElonaJS.Databases
 * @name Load
 * @function
 */
Databases.Load = async function(){
    let a = await Utils.File.GetJSON("./data/data.json");
    UI.Menus.LoadingScreen.Message("Setting data...");
    this.Music.BatchLoad(a.music);
    this.Sound.BatchLoad(a.sound);
    this.Races.BatchLoad(a.races);
    this.Classes.BatchLoad(a.classes);
    this.Skills.BatchLoad(a.skills);
    this.Attributes.BatchLoad(a.attributes);
    this.Traits.BatchLoad(a.traits);
    this.Settings.BatchLoad(a.settings);
    this.Settings.InitDefault();
    this.Misc.BatchLoad(a.misc);

    UI.Menus.LoadingScreen.Message("Loading locale...");
    await this.i18n.LoadFromJSON("./locale/en.json");
    UI.Menus.LoadingScreen.Message("Loading graphics...");
    await this.Graphics.BatchLoad(a.graphics);
}

module.exports = Databases;