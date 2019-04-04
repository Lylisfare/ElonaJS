/** 
 * The RaceSelect menu. Will display a list of playable races, allowing the user to select a race. When this menu is loaded, it must be passed an object containing the unit to be modified. On selection, the menu will set the unit's race, then either exit or continue along the character creation process if the flag is set.
 * @name RaceSelect 
 * @extends ElonaJS.UI.Menus.BaseMenu
 * @memberof ElonaJS.UI.Menus
*/

let BaseMenu = require("./basemenu.js");

let RaceSelect = new BaseMenu();

RaceSelect.Customize({centered: true, size: {w: 720, h: 500}});
RaceSelect.sounds.select = "spell";

/**
 * @name _OnLoad
 * @param {Object} parameters
 * @param {Boolean} parameters.creation Whether the unit will be newly created
 * @param {ElonaJS.GameObjects.Unit} parameters.unit The unit to be modified
 * @function
 * @memberof! ElonaJS.UI.Menus.RaceSelect
 */
RaceSelect._OnLoad = function(parameters){
    this.parameters = parameters;
    if(this.init){
        this.options.current = 0;
        this.options.page = 0;
        return;
    }

    this.bgcur = 3;
    this.bgcounter = 0;
    this.init = true;

    new UI.Components.Image({id: "Background", img: "void", alignment: "fill", position: {z: -1}}).Attach(this);
    new UI.Components.Image({id: "Paper", img: "interface.paper", width: 720, height: 500, shadow: {distance: 10, blur: 0}, position: {z: 0}}).Attach(this);
    new UI.Components.Image({id: "BG_Deco", img: "cbg3", position: {x: 30, y: 40, z: 1}, width: 290, height: 430, alpha: 0.2}).Attach(this);
    new UI.Components.Text({id: "Desc", position: {x: 210, y: 70}, wrap: {width: 460, spacing: 16}, text: ""}).Attach(this);
    new UI.Components.Text({id: "Help", alignment: "bottom-left", i18n: "hints.help", position: {x: 30, y: -22}}).Attach(this);
    new UI.Components.Text({id: "PageNum", position: {x: 640, y: 475}, size: 10}).Attach(this);
    new UI.Components.Image({id: "CPrev1", img: "character.1", position: {x: 300, y: 45, z: 3}, alpha: 0.2, scale: 2}).Attach(this);
    new UI.Components.Image({id: "CPrev2", img: "character.2", position: {x: 444, y: 45, z: 3}, alpha: 0.2, scale: 2}).Attach(this);

    new UI.Components.PaperHeader({
        id: "Header",
        text: {i18n: "ui.raceselect.title"}
    }).Attach(this);

    new UI.Components.PaperFooter({
        id: "Hint",
        position: {x: 35, y: 470},
        rect: {width: 625},
        text: {i18n: "hints.3b"}
    }).Attach(this);

    new UI.Components.SectionHeader({
        id: "Races",
        position: {x: 35, y: 40},
        text: {i18n: "ui.raceselect.section1"}
    }).Attach(this);

    new UI.Components.SectionHeader({
        id: "Details",
        position: {x: 205, y: 40},
        text: {i18n: "ui.raceselect.section2"}
    }).Attach(this);

    new UI.Components.SectionHeader({
        id: "AttributeBonuses",
        position: {x: 205, y: 205},
        text: {i18n: "ui.raceselect.section3"}
    }).Attach(this);

    new UI.Components.SectionHeader({
        id: "TrainedSkills",
        position: {x: 205, y: 285},
        text: {i18n: "ui.raceselect.section4"}
    }).Attach(this);

    new UI.Components.Guide({
        position: {x: 0, y: 0},
        id: "Guide",
        text: {i18n: "ui.raceselect.guide"}
    }).Attach(this);

    let attb = DB.Attributes.Search({primary: true});

    for(let i = 0; i < attb.length; i++){
        let val = attb[i];
        new UI.Components.Image({id: val.id, img: val.icon, position: {x: 210 + 130 * (i%3), y: 225 + 19 * Math.floor(i/3), z: 3}}).Attach(this, "attb_icons");
        new UI.Components.Text({id: val.id, position: {x: 230 + 130 * (i%3), y: 225 + 19 * Math.floor(i/3)}}).Attach(this, "attb_text");
    }

    this._BuildList();
}

RaceSelect._BuildList = function(){
    if(!this.races) this.races = DB.Races.Search({playable: true});
    if(!this.csheet) this.csheet = DB.Graphics.GetByID("character").exceptions;
    let races = this.races;
    let opt = [];

    for(let i = 0; i < races.length; i++){
        let no = {text:{}, preview: {}};
        no.text.i18n = races[i].name;
        no.preview.desc = races[i].description;
        no.preview.pic1 = races[i].pic.female;
        no.preview.pic2 = races[i].pic.male;
        no.preview.race = races[i];
        opt.push(no);
    }

    this.options.CustomizeList({
        position: {x: 75, y: 70},
        perpage: 20
    });

    this.options.Set(opt);
}

RaceSelect._PreviewData = function(){
    let op = this.options.GetCurrentOption();
    this.components.Desc.SetText(i18n(op.preview.desc));
    this.components.CPrev1.SetImage("character." + op.preview.pic1);
    this.components.CPrev2.SetImage("character." + op.preview.pic2);

    if(this.csheet[op.preview.pic1]){
        let offset = (this.csheet[op.preview.pic1].offY ? this.csheet[op.preview.pic1].offY : 0);
        this.components.CPrev1.SetBasePosition(300, 135 - this.components.CPrev1.GetActualHeight() - offset);
        this.components.CPrev2.SetBasePosition(444, 135 - this.components.CPrev2.GetActualHeight() - offset);
    } else {
        this.components.CPrev1.SetBasePosition(300, 45);
        this.components.CPrev2.SetBasePosition(444, 45);
    }

    this._FormatAttributes();
    this._FormatSkills();

    this.bgcounter++;

    if(this.bgcounter > 3){
        this.bgcounter = 0;
        (this.bgcur < 8 ? this.bgcur++ : this.bgcur = 1);
        this.components.BG_Deco.SetImage("cbg" + this.bgcur);
    }

    this.AlignElements();
}

RaceSelect._FormatAttributes = function(){
    let op = this.options.GetCurrentOption();
    let attb = DB.Attributes.Search({primary: true});
    let atbStr = i18n("attributes.magnitude");
    let cstats = op.preview.race.base_attributes;

    for(let i = 0; i < attb.length; i++){
        let val = attb[i].id;

        if(this.components.attb_text[val]){
            let str;
            let style = {fill: "black"};
     
            if (cstats[val] == 0){str = i18n("attributes.magnitude.none"); style.fill = "rgb(120, 120, 120)";} else
            if (cstats[val] > 13){str = i18n("attributes.magnitude.best"); style.fill = "rgb(0, 0, 200)";} else
            if (cstats[val] > 11){str = i18n("attributes.magnitude.great"); style.fill = "rgb(0, 0, 200)";} else
            if (cstats[val] > 9){str = i18n("attributes.magnitude.good"); style.fill = "rgb(0, 0, 150)";} else
            if (cstats[val] > 7){str = i18n("attributes.magnitude.not_bad"); style.fill = "rgb(0, 0, 150)";} else
            if (cstats[val] > 5){str = i18n("attributes.magnitude.normal"); style.fill = "rgb(0, 0, 0)";} else
            if (cstats[val] > 3){str = i18n("attributes.magnitude.little"); style.fill = "rgb(150, 0, 0)";} else
            if (cstats[val] > 0){str = i18n("attributes.magnitude.slight"); style.fill = "rgb(200, 0, 0)";}

            this.components.attb_text[val].SetText(i18n(DB.Attributes.GetByID(val).short).initCap() + ": " + str);
            this.components.attb_text[val].UpdateStyle(style);
        }
    }
}

RaceSelect._FormatSkills = function(){
    let op = this.options.GetCurrentOption();
    let attb = op.preview.race.base_skills;
    let o = 1;
    let nwep = 0;
    let wpnstr = i18n("ui.raceselect.wepprefix");

    for(let i = 0, arr = Object.keys(attb); i < arr.length; i++){
        let val = arr[i];
        let skill = DB.Skills.GetByID(val);
        
        if(skill.type == "weapon"){
            if(nwep > 0) wpnstr += ", ";
            wpnstr += i18n(skill.name).initCap();
            nwep++;
            continue;
        }

        if(!this.components.SkillText){
            this.components.SkillText = {};
            this.components.SkillDesc = {};
            this.components.SkillImages = {};
        }

        if(this.components.SkillText[o]){
            this.components.SkillText[o].SetText(i18n(skill.name).initCap());
            this.components.SkillDesc[o].SetText(i18n(skill.desc1));
            this.components.SkillImages[o].SetImage(DB.Attributes.GetByID(skill.attr).icon);
        } else{
            new UI.Components.Text({id: o, i18n: skill.name, position: {x: 230, y: 310 + 16 * o}}).Attach(this, "SkillText");
            this.components.SkillText[o].SetText(i18n(skill.name).initCap());
            new UI.Components.Text({id: o, i18n: skill.desc1, position: {x: 340, y: 310 + 16 * o}}).Attach(this, "SkillDesc");
            new UI.Components.Image({id: o, img: DB.Attributes.GetByID(skill.attr).icon, position: {x: 210, y: 310 + 16 * o, z: 3}}).Attach(this, "SkillImages");
        }

        o++;
    }

    if(!this.components.SkillText[0]){
        new UI.Components.Text({id: "0", text: wpnstr, position: {x: 230, y: 310}}).Attach(this, "SkillText");
        new UI.Components.Image({id: "0", img: DB.Attributes.GetByID("Strength").icon, position: {x: 210, y: 310, z: 3}}).Attach(this, "SkillImages");
    } else {
        this.components.SkillText[0].SetText(wpnstr);
    }

    for(let i = 1, arr = Object.keys(this.components.SkillText); i < arr.length; i++){        
        if(i < o){
            this.components.SkillText[i].Show();
            this.components.SkillDesc[i].Show();
            this.components.SkillImages[i].Show();
        } else {
            this.components.SkillText[i].Hide();
            this.components.SkillDesc[i].Hide();
            this.components.SkillImages[i].Hide();
        }
    }
}

RaceSelect._OnSelect = function(){
    this.parameters.unit.SetRace(this.options.GetCurrentOption().preview.race.id);
    UI.UnloadMenu(this);
    if(this.parameters.creation){
        UI.LoadMenu("GenderSelect", this.parameters);
    }
}

RaceSelect._OnBack = function(){
    UI.UnloadMenu(this);
    UI.LoadMenu("TitleScreen")
}

module.exports = RaceSelect;