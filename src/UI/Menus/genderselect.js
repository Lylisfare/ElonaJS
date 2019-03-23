let BaseMenu = require("./basemenu.js");

/**
 * The race select menu.
 * @name RaceSelect
 * @type ElonaJS.UI.Menus.BaseMenu
 * @memberOf ElonaJS.UI.Menus
 */
let GenderSelect = new BaseMenu();

GenderSelect._OnLoad = function(){
    if(this.init){
        this.opions.current = 0;
        this.options.curpage = 0;
    }

    this.init = true;

    let op = [];
    let sexes = i18n("sexes.");

    for(let i = 0; i < sexes.length; i++){
        op.push({text: {i18n: sexes[i].id}});
    }

    this.options.Customize({
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
    UI.UnloadMenu(this);
    UI.LoadMenu("ClassSelect")
}

module.exports = GenderSelect;