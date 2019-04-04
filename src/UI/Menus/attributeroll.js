let BaseMenu = require("./basemenu.js");

/**
 * The attribute roll menu. Allows for the rolling of base stats based on class / race combination.
 * @name AttributeRoll
 * @type ElonaJS.UI.Menus.BaseMenu
 * @memberOf ElonaJS.UI.Menus
 */
let AttributeRoll = new BaseMenu();


AttributeRoll.Customize({centered: true, size: {w: 350, h: 330}});


AttributeRoll._OnLoad = function(parameters){
    this.parameters = parameters;
    if(this.init) {
        this._ResetLocks();
        AttributeRoll._Reroll();
        this.options.current = 0;
        this.options.curpage = 0;
        return;
    }

    this.init = true;

    this.locks = 2;

    new UI.Components.Image({id: "Background", img: "void", alignment: "fill", position: {z: -1}}).Attach(this);
    new UI.Components.Image({id: "Paper", img: "interface.paper", width: 350, height: 330, shadow: {distance: 10, blur: 0}, position: {z: 0}}).Attach(this);
    new UI.Components.Image({id: "BG_Deco", img: "cbg3", position: {x: 10, y: 40, z: 1}, width: 175, height: 250, alpha: 0.2}).Attach(this);
    new UI.Components.Text({id: "Help", alignment: "bottom-left", i18n: "hints.help", position: {x: 30, y: -22}}).Attach(this);
    new UI.Components.Text({id: "Disclaimer", i18n: "ui.attributeroll.disclaimer", position: {x: 195, y: 38}, size: 9, wrap: {width: 110}}).Attach(this);
    new UI.Components.Text({id: "Locks", text: i18n("ui.attributeroll.locks", {num: this.locks}), position: {x: 195, y: 70}}).Attach(this);

    new UI.Components.Guide({
        position: {x: 0, y: 0},
        id: "Guide",
        text: {i18n: "ui.attributeroll.guide"}
    }).Attach(this);

    new UI.Components.PaperHeader({
        id: "Header",
        text: {i18n: "ui.attributeroll.title"}
    }).Attach(this);

    new UI.Components.PaperFooter({
        id: "Hint",
        position: {x: 30, y: 300},
        rect: {width: 275},
        text: {i18n: "hints.3b"}
    }).Attach(this);

    new UI.Components.SectionHeader({
        id: "Attributes",
        position: {x: 30, y: 40},
        text: {i18n: "ui.attributeroll.section1"}
    }).Attach(this);

    let op = [
        {text: {i18n: "ui.reroll"}},
        {text: {i18n: "ui.proceed"}}
    ];

    let attb = DB.Attributes.Search({primary: true});
    let attbID = attb.reduce((acc, cur) => {return (acc.push(cur.id) ? acc : null)}, []);

    for(let i = 0; i < attb.length; i++){
        new UI.Components.Text({id: attbID[i], position: {x: 225, y: 115 + 22 * i}, val: attbID[i]}).Attach(this, "AttbVal");
        new UI.Components.Image({id: attbID[i], position: {x: 200, y: 115 + 22 * i, z: 3}, img: attb[i].icon}).Attach(this, "AttbImg");
        new UI.Components.Text({id: attbID[i], position: {x: 245, y: 116 + 22 * i}, text: "Locked!", color: "blue", size: 9}).Attach(this, "LockText");
        op.push({text: {i18n: attb[i].full}, val: attbID[i]});
        
        this.components.LockText[attbID[i]].Hide();
        this.components.LockText[attbID[i]].locked = false;
    }

    this.options.CustomizeList({position: {x: 70, y: 70}, spacing: 22});
    this.options.Set(op);
    AttributeRoll._Reroll();
}

AttributeRoll._Reroll = function(){
    let cls = DB.Classes.GetByID(this.parameters.unit.GetClass()).base_attributes;
    let race = DB.Races.GetByID(this.parameters.unit.GetRace()).base_attributes;
    let attb = DB.Attributes.Search({primary: true});
    let attbID = attb.reduce((acc, cur) => {acc.push(cur.id); return acc;}, []);
    for(let i = 0; i < attb.length; i++){
        if(this.components.LockText[attbID[i]].locked) continue;
        this.components.AttbVal[attbID[i]].SetText(Math.floor(Math.max(Math.random() * (cls[attbID[i]] + race[attbID[i]]), (cls[attbID[i]] + race[attbID[i]])/2) + 1));
    }
}

AttributeRoll._GetAttbSet = function(){
    let stats = {};
    let base = this.components.AttbVal;
    let keys = Object.keys(base);

    for(let i = 0; i < keys.length; i++) stats[keys[i]] = parseInt(base[keys[i]].GetText());

    stats.Speed = DB.Races.GetByID(this.parameters.unit.GetRace()).base_attributes.Speed;
    return stats;
}

AttributeRoll._OnSelect = function(){
    let cur = this.options.GetCurrent();

    if(cur == 0){
        this._Reroll();
        ElonaJS.Audio.PlaySound("dice");
    }

    if(cur == 1){
        ElonaJS.Audio.PlaySound("feat");
        let stats = this._GetAttbSet();
        this.parameters.unit.Attributes().Set(stats);
        UI.UnloadMenu(this);
        if(this.parameters.creation) UI.LoadMenu("FeatSelect", this.parameters);
    }

    if(cur > 1){
        let val = this.options.GetCurrentOption().val;
        let elem = this.components.LockText[val];

        if(elem){
            switch(elem.locked){
                case true: 
                    elem.locked = false;
                    this.locks++;
                    elem.Hide();
                    break;
                case false:
                    if(!this.locks > 0) break;
                    this.locks--;
                    elem.locked = true;
                    elem.Show();
                    break;
                default: break;
            }
        }
    }

    this.components.Locks.SetText(i18n("ui.attributeroll.locks", {num: this.locks}));
}

AttributeRoll._ResetLocks = function(){
    for(let i in this.components.LockText){
        this.components.LockText[i].locked = false;
        this.components.LockText[i].Hide();
    }

    this.locks = 2;
    this.components.Locks.SetText(i18n("ui.attributeroll.locks", {num: this.locks}));
}

AttributeRoll._OnBack = function(){
    UI.UnloadMenu(this);

    if(this.parameters.creation){
        if(this.parameters.creation) UI.LoadMenu("ClassSelect", this.parameters);
    }
}





/* menu._OnSelect = function(){


    if(this.options.current == 1) {
        this.sounds.select = "feat";
        let attblist = ElonaJS.Databases.Strings.GetNoLocale("Attributes").split(',');
        let stats = {};
        for(let i = 0; i < attblist.length; i++){
            let sel = this.components.Attb["Att_" + attblist[i]];
            stats[sel.EJS.val] = parseInt(sel.text);
        }

        this.active.SetAttributes(stats);
        Graphics.UnloadMenu(this);

        if(this.creation){
            Menus.FeatSelect.SetParameters(this.active, true);
            Graphics.LoadMenu("FeatSelect");
        }

        return;
    }


}; */

module.exports = AttributeRoll;