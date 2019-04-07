'use strict'

/** TODO
 * UniComponent - Graphics.Dim, Graphics.Scale
 * Graphics.GetRect
 * Uncomment uihandler
 * Use race picture in class select
 */

String.prototype.initCap = function () {
    return this.toLowerCase().replace(/(?:^|\s)[a-z]/g, function (m) {
       return m.toUpperCase();
    });
 };

 $(document).ready(async () => {
  if(typeof process === 'object'){
    window.electron = require('electron')
    window.__baseDir = window.__dirname + "\\assets\\";
  }
  PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;

    /**
     * @namespace ElonaJS
     * @property {ElonaJS.Databases} Databases A collection of data databases used by the game.
     * @property {ElonaJS.Utils} Utils A collection of utility functions used by the game.
     * @property {ElonaJS.UI} UI Methods & Sytems related to the game's UI (menus, components, etc.)
     * @property {AudioHandler} Audio The audio handler for the game.
     */
    let ElonaJS = {
        Audio: require("./Audio/audiohandler.js"),
        Graphics: require("./Graphics/Graphics.js"),
        Databases: require("./Databases/Databases.js"),
        UI: require("./UI/UI.js"),
        Utils: require("./Utils/Utils.js"),
        Input: require("./Input/Input.js"),
        GameObjects: require("./GameObjects/GameObjects.js"),
        State: require("./State/State.js")
    }

    window.Graphics = ElonaJS.Graphics;
    window.Utils = ElonaJS.Utils;
    window.DB = ElonaJS.Databases;
    window.ElonaJS = ElonaJS;
    window.UI = ElonaJS.UI;
    window.Input = ElonaJS.Input;
    window.Sys = {env :(typeof process === "object" ? "node" : "browser")};
    window.GameObjects = ElonaJS.GameObjects;
    window.State = ElonaJS.State;

    await Utils.File.LoadFont('OpenSans', './fonts/OpenSans-Regular.ttf');
    await DB.Graphics.Register({id: "loadlg", path: "media/graphics/loading.png"});    
    Graphics.Init();
    UI.Init();
    UI.ShowLS();
    UI.Menus.LoadingScreen.Message("Loading data...");
    await DB.Load();
    UI.Resize();
    $(window).resize(function(){
      UI.Resize();
    });
    Input.Attach();  
    UI.Menus.LoadingScreen.Message("Done!", true);
    UI.HideLS(true);
   
    UI.LoadMenu("TitleScreen");
 })

/*  function sortObjByKey(value) {
    return (typeof value === 'object') ?
      (Array.isArray(value) ?
        value.map(sortObjByKey) :
        Object.keys(value).sort().reduce(
          (o, key) => {
            const v = value[key];
            o[key] = sortObjByKey(v);
            return o;
          }, {})
      ) :
      value;
  }
  
  
  function orderedJsonStringify(obj) {
    return JSON.stringify(sortObjByKey(obj));
  } */