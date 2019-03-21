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
    Graphics: require("./graphics.js"),
    i18n: require("./i18n.js"),
    loki: master
}

Databases.i18n.SetDB("i18n", ["id"], master);
Databases.Graphics.SetDB("graphics", ["id"], master);
window.i18n = Databases.i18n.Get.bind(Databases.i18n);
window.i18nObj = Databases.i18n.GetObj.bind(Databases.i18n);

/**
 * An asyncronous function to load game data into in-memory databases.
 * @memberOf ElonaJS.Databases
 * @name Load
 * @function
 */
Databases.Load = async function(){
    let a = await Utils.File.GetJSON("./data/data.json");
    this.Music.BatchLoad(a.music);
    this.Sound.BatchLoad(a.sound);
    this.Races.BatchLoad(a.races);
    this.Classes.BatchLoad(a.classes);
    this.Skills.BatchLoad(a.skills);
    await this.i18n.LoadFromJSON("./locale/en.json");
    await this.Graphics.LoadFromJSON("./data/Graphics.JSON");
}

module.exports = Databases;