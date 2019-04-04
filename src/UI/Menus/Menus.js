'use strict'

/**
 * A collection of Menus used in the game.
 * @namespace ElonaJS.UI.Menus
 * @memberOf ElonaJS.UI
 * @property {module:RaceSelect} RaceSelect The RaceSelect Module
 */
let Menus = {
    LoadingScreen: require("./loadingscreen.js"),
    TitleScreen: require("./titlescreen.js"),
    RaceSelect: require("./raceselect.js"),
    GenderSelect: require("./genderselect.js"),
    ClassSelect: require("./classselect.js"),
    AttributeRoll: require("./attributeroll.js"),
    TextInput: require("./textinput.js"),
    FeatSelect: require("./featselect.js"),
    SettingsMenu: require("./settingsmenu.js")
}

module.exports = Menus;