let BaseMenu = require("./basemenu.js");

/** 
 * The Gender Selection menu. Displays a list of genders to choose from. When this menu is loaded, it must be passed an object containing the unit to be modified. On selection, the menu will set the unit's gender, then either exit or continue along the character creation process if the flag is set.
 * @name GenderSelect
 * @extends ElonaJS.UI.Menus.BaseMenu
 * @memberof! ElonaJS.UI.Menus
*/
let GenderSelect = new BaseMenu();

/**
 * @name _OnLoad
 * @param {Object} parameters
 * @param {Boolean} parameters.creation Whether the unit will be newly created
 * @param {ElonaJS.GameObjects.Unit} parameters.unit The unit to be modified
 * @memberof! ElonaJS.UI.Menus.GenderSelect
 * @function
 */
GenderSelect._OnLoad = function(parameters){
    this.parameters = parameters;
    if(this.init){
        this.options.current = 0;
        this.options.curpage = 0;
        return;
    }

    this.init = true;

    let op = [];

    let sexes = DB.Misc.Search({"tag": "gender"});

    for(let i = 0; i < sexes.length; i++){
        op.push({text: {i18n: sexes[i].name}, data: sexes[i].id});
    }

    this.options.CustomizeList({
        position: {x: 75, y: 60}
    })

    this.options.Set(op);

    let offset = (sexes.length - 2) * 20;

    this.Customize({centered: true, size: {w: 360, h: 150 + offset}});

    new UI.Components.Image({id: "Background", img: "void", alignment: "fill", position: {z: -1}}).Attach(this);
    new UI.Components.Image({id: "Paper", img: "interface.paper", width: 360, height: 150 + offset, shadow: {distance: 10, blur: 0}, position: {z: 0}}).Attach(this);
    new UI.Components.Text({id: "Help", alignment: "bottom-left", i18n: "hints.help", position: {x: 30, y: -22}}).Attach(this);

    new UI.Components.Guide({
        position: {x: 0, y: 0},
        id: "Guide",
        text: {i18n: "ui.genderselect.guide"}
    }).Attach(this);

    new UI.Components.PaperHeader({
        id: "Header",
        text: {i18n: "ui.genderselect.title"}
    }).Attach(this);

    new UI.Components.PaperFooter({
        id: "Hint",
        position: {x: 25, y: 120 + offset},
        rect: {width: 280},
        text: {i18n: "hints.3b"}
    }).Attach(this);

    new UI.Components.SectionHeader({
        id: "Gender",
        position: {x: 25, y: 30},
        text: {i18n: "ui.genderselect.section1"}
    }).Attach(this);
}

GenderSelect._OnSelect = function(){
    this.parameters.unit.SetGender(this.options.GetCurrentOption().data);
    UI.UnloadMenu(this);
    if(this.parameters.creation) UI.LoadMenu("ClassSelect", this.parameters);
}

GenderSelect._OnBack = function(){
    UI.UnloadMenu(this);
    if(this.parameters.creation) UI.LoadMenu("RaceSelect", this.parameters);
}


module.exports = GenderSelect;