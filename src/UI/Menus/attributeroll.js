let BaseMenu = require("./basemenu.js");

/**
 * The race select menu.
 * @name AttributeRoll
 * @type ElonaJS.UI.Menus.BaseMenu
 * @memberOf ElonaJS.UI.Menus
 */
let AttributeRoll = new BaseMenu();

AttributeRoll.Customize({centered: true, size: {w: 350, h: 330}});

AttributeRoll._OnLoad = function(){
    if(this.init) {
        //this._ResetLocks();
        //this.components["Locks"].text = ElonaJS.Databases.Strings.GetLocale("Sys_29") + this.locks;
        //this._Reroll();
        this.options.current = 0;
        this.options.curpage = 0;
        return;
    }

    this.locks = 2;

    new UI.Components.Image({id: "Background", img: "void", alignment: "fill", position: {z: -1}}).Attach(this);
    new UI.Components.Image({id: "Paper", img: "interface.paper", width: 350, height: 330, shadow: {distance: 10, blur: 0}, position: {z: 0}}).Attach(this);
    new UI.Components.Image({id: "BG_Deco", img: "cbg3", position: {x: 10, y: 40, z: 1}, width: 175, height: 250, alpha: 0.2}).Attach(this);
    new UI.Components.Text({id: "Help", alignment: "bottom-left", i18n: "hints.help", position: {x: 30, y: -22}}).Attach(this);
    new UI.Components.Text({id: "Disclaimer", i18n: "ui.attributeroll.disclaimer", position: {x: 195, y: 38}, size: 9, wrap: {width: 110}}).Attach(this);
    new UI.Components.Text({id: "Locks", text: i18n("ui.attributeroll.locks", {num: this.locks}), position: {x: 195, y: 65}}).Attach(this);

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
    let attbID = attb.reduce((acc, cur) => {return (acc.push(cur.id.toLowerCase()) ? acc : null)}, []);

    for(let i = 0; i < attb.length; i++){
        new UI.Components.Text({id: attbID[i], position: {x: 225, y: 122 + 22 * i}, val: attbID[i]}).Attach(this, "AttbVal");
        new UI.Components.Image({id: attbID[i], position: {x: 200, y: 112 + 22 * i, z: 3}, img: attb[i].icon}).Attach(this, "AttbImg");
        op.push({text: {i18n: attb[i].full, val: attbID[i]}});
    }

    this.options.Customize({position: {x: 70, y: 70}, spacing: 22});
    this.options.Set(op);



}

AttributeRoll._Reroll = function(){
    let cls = DB.Classes.GetByID("Warrior").base_attributes;
    let race = DB.Races.GetByID("Yerles").base_attributes;




}

/* this.AttachBackground({});


this.AttachText({id: "Locks", text: "Locks left: ", x: 195, y: 55});
this.AttachText({id: "Lock_1", text: "", x: 250, color: "blue", size: 8});
this.AttachText({id: "Lock_2", text: "", x: 250, color: "blue", size: 8}); */



module.exports = AttributeRoll;








/* 
    menu._Reroll = function(){
        let cls = ElonaJS.Databases.Classes.GetByID(this.active.class).base_attributes;
        let race = ElonaJS.Databases.Races.GetByID(this.active.race).base_attributes;
        let attr = ElonaJS.Databases.Strings.GetNoLocale("Attributes").split(",");
    
        for(let i = 0; i < attr.length; i++){
            if(this.components.Attb["Att_" + attr[i]].EJS.locked) continue;
            this.components.Attb["Att_" + attr[i]].text = Math.floor(Math.max(Math.random() * (cls[attr[i]] + race[attr[i]]), (cls[attr[i]] + race[attr[i]])/2) + 1);
        }
    };

    menu.SetParameters = function(unit, creation){
        this.active = unit;
        this.creation = creation;
    };

    menu._Setup = function(){
        this.locks = 2;
        if(this.init) {
            this._ResetLocks();
            this.components["Locks"].text = ElonaJS.Databases.Strings.GetLocale("Sys_29") + this.locks;
            this._Reroll();
            this.options.current = 0;
            this.options.curpage = 0;
            return;
        }



        this.init = true;
        this.components["Locks"].text = ElonaJS.Databases.Strings.GetLocale("Sys_29") + this.locks;
        this._Reroll();   
    }

    menu._OnBack = function(){
        Graphics.UnloadMenu(this);
        if(this.creation){
            Menus.ClassSelect.SetParameters(this.active, true);
            Graphics.LoadMenu("ClassSelect");
        }
    };

    menu._OnSelect = function(){
        this.sounds.select = "ok1";
        if(this.options.current == 0) {
            this._Reroll(); 
            this._PlaySound("dice");
        }

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

        if(this.options.current > 1){
            let cval = this.options.list[this.options.current].val;
            let celem = this.components.Attb["Att_" + cval].EJS;
            if(celem.locked){
                celem.locked = false;
                this.locks++;
                let unlock = (this.components["Lock_1"].EJS.val == cval ? this.components["Lock_1"] : this.components["Lock_2"]);
                unlock.EJS.val = "";
                unlock.text = "";
            } else{
                if(this.locks > 0){
                    celem.locked = true;
                    this.locks--;
                    let tolock = (!this.components["Lock_1"].EJS.val || this.components["Lock_1"].val == "" ? this.components["Lock_1"] : this.components["Lock_2"]);
                    tolock.EJS.val = cval;
                    tolock.text = "Locked!";
                    tolock.EJS.y = celem.y;
                }
            }
        }
        this.components["Locks"].text = ElonaJS.Databases.Strings.GetLocale("Sys_29") + this.locks;
        this.ScaleElements();
    };

    menu._ResetLocks = function(){
        let attr = ElonaJS.Databases.Strings.GetNoLocale("Attributes").split(",");
        for(let i = 0; i < attr.length; i++){
            this.components.Attb["Att_" + attr[i]].EJS.locked = false;
        }
        this.components["Lock_1"].text = ""; this.components["Lock_1"].EJS.val = 0;
        this.components["Lock_2"].text = ""; this.components["Lock_2"].EJS.val = 0;
    };


    return menu;
})(); */