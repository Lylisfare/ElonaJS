/**
 * @description This namespace contains a variety of different UI components that may be attached to a menu.
 * Components can be either singular - derived from class {@link ElonaJS.UI.Components.UniComponent | Unicomponent},
 * or a collection, from class {@link ElonaJS.UI.Components.MultiComponent | Multicomponent}. Each component type has its own
 * accepted parameters and default values - see their individual pages for more info.
 * @namespace ElonaJS.UI.Components
 */
let Components = {
    Rect: require("./rect.js"),
    Text: require("./text.js"),
    Image: require("./image.js"),
    PaperFooter: require("./paperfooter.js"),
    PaperHeader: require("./paperheader.js"),
    Option: require("./option.js"),
    OptionList: require("./optionlist.js"),
    SectionHeader: require("./sectionheader.js"),
    Guide: require("./guide.js")
}

module.exports = Components;