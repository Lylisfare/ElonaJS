'use strict'

/** TODO
 * UniComponent - Graphics.Dim, Graphics.Scale
 * Graphics.GetRect
 * Uncomment uihandler
 */

String.prototype.initCap = function () {
    return this.toLowerCase().replace(/(?:^|\s)[a-z]/g, function (m) {
       return m.toUpperCase();
    });
 };

 $(document).ready(async () => {
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
        Input: require("./Input/Input.js")
    }
    window.Graphics = ElonaJS.Graphics;
    window.Utils = ElonaJS.Utils;
    window.DB = ElonaJS.Databases;
    window.ElonaJS = ElonaJS;
    window.UI = ElonaJS.UI;
    window.Utils = ElonaJS.Utils;
    window.Input = ElonaJS.Input;
    Graphics.Init();
    await DB.Load();
    await Utils.File.LoadFont('OpenSans', 'fonts/OpenSans-Regular.ttf');
    UI.Init();

    Input.Attach();  
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