'use strict'

/**
 * A collection of Menus used in the game.
 * @namespace ElonaJS.UI.Menus
 * @memberOf ElonaJS.UI
 */
let Menus = {
    LoadingScreen: require("./loadingscreen.js"),
    TitleScreen: require("./titlescreen.js"),
    RaceSelect: require("./raceselect.js"),
    GenderSelect: require("./genderselect.js"),
    ClassSelect: require("./classselect.js"),
    AttributeRoll: require("./attributeroll.js")
}

module.exports = Menus;