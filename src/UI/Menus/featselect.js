let BaseMenu = require("./basemenu.js");

/**
 * The race select menu.
 * @name FeatSelect
 * @type ElonaJS.UI.Menus.BaseMenu
 * @memberOf ElonaJS.UI.Menus
 */
let FeatSelect = new BaseMenu();

FeatSelect.sounds.select = "pop1";


FeatSelect.Customize({centered: true, size: {w: 720, h: 400}});

FeatSelect._OnLoad = function(parameters){
    this.parameters = parameters;
    
    if(this.init){
        return;
    }

    this.init = true;
    let perpage = 15;
    this.options.CustomizeList({position: {x: 90, y: 65}, spacing: 19, perpage: perpage});

    this.static = {
        "topoption": {text: {i18n: "ui.featselect.header2", offset: {x: 35}},  keyimage: {enabled: false}, keytext: {enabled: false}},
        "divoption": {text: {i18n: "ui.featselect.header1", offset: {x: 35}},  keyimage: {enabled: false}, keytext: {enabled: false}}
    };

    new UI.Components.Image({id: "Background", img: "void", alignment: "fill", position: {z: -1}}).Attach(this);
    new UI.Components.Image({id: "Paper", img: "interface.paper", position: {z: 0}, width: 720, height: 400, shadow: {distance: 10, blur: 0}}).Attach(this);
    new UI.Components.Text({id: "Help", alignment: "bottom-left", i18n: "hints.help", position: {x: 30, y: -22}}).Attach(this);
    new UI.Components.Image({id: "tl", img: "feat_deco.tl", position: {x: 0, y: 0, z: 2}}).Attach(this, "Deco");
    new UI.Components.Image({id: "br", img: "feat_deco.br", position: {x: 678, y: 228, z: 2}}).Attach(this, "Deco");
    new UI.Components.Image({id: "bl", img: "feat_deco.bl", position: {x: 0, y: 359, z: 2}}).Attach(this, "Deco");
    new UI.Components.Image({id: "tr", img: "feat_deco.tr", position: {x: 628, y: 3, z: 2}}).Attach(this, "Deco");
    new UI.Components.Guide({id: "Guide", text: {i18n: "ui.featselect.guide"}}).Attach(this);
    new UI.Components.SectionHeader({id: "Detail", text: {i18n: "ui.featselect.section2"}, position: {x: 275, y: 38}}).Attach(this);
    new UI.Components.SectionHeader({id: "Name", text: {i18n: "ui.featselect.section1"}, position: {x: 45, y: 38}}).Attach(this);
    new UI.Components.PaperHeader({id: "Header", text: {i18n: "ui.featselect.title"}}).Attach(this);
    new UI.Components.Image({id: "HD", img: "interface.icon_feat", position: {x: 25, y: -23, z: 3}}).Attach(this, "Deco");
    new UI.Components.PaperFooter({id: "Hint", text: {i18n: "ui.featselect.hint"}, rect: {width: 580}, position: {x: 85, y: 375}}).Attach(this);
    new UI.Components.Text({id: "Disclaimer", text: "", position: {x: 360, y: 363}, size: 9}).Attach(this);
    new UI.Components.Text({id: "PageNum", position: {x: 600, y: 365}, size: 10}).Attach(this);

    for(let i = 0; i < perpage; i++){
        new UI.Components.Image({id: i, img: "interface.icon_bulb", position: {x: 30, y: i*19 + 65, z:3}}).Attach(this, "FeatImages");
    }

    for(let i = 0; i < perpage; i++){
        new UI.Components.Text({id: i, text: "Test", position: {x: 290, y: i*19 + 65}, size: 12}).Attach(this, "FeatDesc");
    }

    for(let i = 0; i < Math.ceil(perpage/2); i++){
        new UI.Components.Rect({id: i, color: "black", alpha: "0.07", width: 645, height: 17, position: {x: 55, y: i*38 + 63}}).Attach(this, "Shadows");
    }

    this.options.Set([
        {text: {i18n: "ui.featselect.header2", offset: {x: 35}}, keyimage: {enabled: false}, keytext: {enabled: false}}
    ]);


    this.components.Disclaimer.SetText(i18n("ui.featselect.disclaimer", {count: this.parameters.unit.Traits().Available()}));

    this._BuildOptions();
}

FeatSelect._BuildOptions = function(){
    let feats =  DB.Traits.Search({category: "feat"}).reduce(function(list, current){list.push(new GameObjects.Trait(current.id)); return list;}, []);
    let olist = [];
    let havelist = [];
    let unit = this.parameters.unit.Traits();
    
    olist.push(this.static.topoption);

    for(let i = 0; i < feats.length; i++){
        if(unit.Has(feats[i].id)){
            let trait = unit.Get(feats[i].id);
            havelist.push(
                {text: {text: trait.GetDescription(), color: "blue"}, preview: {id: trait.id, description: "", icon: trait.GetIcon(), allowed: false}, keyimage: {enabled: false}, keytext: {enabled: false}}
            );
            if(trait.CanGain()){
                olist.push(
                    {text: {text: trait.GetName(), color: "blue"}, preview: {id: trait.id, description: trait.GetDisplay(), icon: trait.GetIcon()}}
                )
            }
        } else {
            olist.push(
                {text: {text: feats[i].GetName()}, preview: {id: feats[i].id, description: feats[i].GetDisplay(), icon: feats[i].GetIcon()}}
            );
        }
    }
    olist.push(this.static.divoption);
    olist = olist.concat(havelist);
    this.options.Set(olist);
    this._OnPageChange();
}

FeatSelect._OnSelect = function(){
    let opt = this.options.GetCurrentOption();
    let unit = this.parameters.unit.Traits();
    let rawlist = this.options.GetList();

    if(opt.preview && opt.preview.id && opt.preview.allowed !== false){
        let list = rawlist.filter((elem) => {return elem.preview && elem.preview.id == opt.preview.id});
        let trait;
        
        if(unit.Has(opt.preview.id)) {
            unit.Get(opt.preview.id).LevelUp(opt.preview.id);
            trait = unit.Get(opt.preview.id);
            list[1].text.text = trait.GetDescription();
            list[1].text.modified = true;
            this.options.JumpTo(rawlist.indexOf(list[1]));
        } else {
            unit.Add(opt.preview.id, 1);
            trait = unit.Get(opt.preview.id);
            rawlist.push(
                {text: {text: trait.GetDescription(), color: "blue"}, preview: {id: trait.id, allowed: false, description: "", icon: trait.GetIcon()}, keyimage: {enabled: false}, keytext: {enabled: false}}
            );
            opt.text.color = "blue";
            opt.text.modified = true;
            this.options.JumpToLast();
        }

        if(trait.CanGain()){
            opt.text.text = trait.GetName();
            opt.text.modified = true;
        } else{
            opt.text.text += " (MAX)";
            opt.text.modified = true;
            opt.preview.allowed = false;
        }

        
        this.components.Disclaimer.SetText(i18n("ui.featselect.disclaimer", {count: unit.Available()}));
        this._UpdatePage();
    }
}



FeatSelect._OnPageChange = function(){
    let list = this.options.GetPageOptions();

    for(let i = 0; i < this.options.settings.perpage; i++){
        if(list.length > i){
            this.components.FeatDesc[i].UpdateStyle({fill: list[i].text.color});
            if(i % 2 == 0) this.components.Shadows[(i/2)].Show();
            if(!list[i].preview) {
                this.components.FeatDesc[i].Hide();
                this.components.FeatImages[i].Hide();
                continue;
            }
            this.components.FeatDesc[i].Show();
            this.components.FeatImages[i].Show();
            this.components.FeatDesc[i].SetText(list[i].preview.description);
            this.components.FeatImages[i].SetImage(list[i].preview.icon);
        } else{
            if(i % 2 == 0) this.components.Shadows[(i/2)].Hide();
            this.components.FeatDesc[i].Hide();
            this.components.FeatImages[i].Hide();
        }
    }
}


module.exports = FeatSelect;


/*     

    menu._Rebuild = function(toset){
        this.options.list.length = 0;

        if(this.active.feats_available > 0){
            this.options.list.push({text: ElonaJS.Databases.Strings.GetLocale("Sys_35"), x: 35, keyimage: false});

            for(let i = 0; i < this.featlist.length; i++){
                let feat = this.featlist[i];
                if(this.active.GetTraitLevel(feat.id) != 0){
                    if(feat.CanGain(this.active)){
                        this.options.list.push({text: feat.GetName(this.active.GetTraitLevel(feat.id)), val: feat.id, desc: feat.GetDisplay(), img: feat.GetIcon(), color: "blue"});
                    }
                } else {
                    this.options.list.push({text: feat.GetName(0), val: feat.id, desc: feat.GetDisplay(), img: feat.GetIcon()});
                }
            }
        }

        this._AddKnownTraits(toset);
        this._PageChange();
    }

    menu._PageChange = function(){
        let numrect = Math.ceil((this.options.list.length - (this.options.curpage * this.options.optperpage))/2);

        for(let i = 0; i < 8; i++) {
            if(i < numrect) this.components["Shadow_Rects"]["Rect_" + i].visible = true;
            else  this.components["Shadow_Rects"]["Rect_" + i].visible = false;
        }

        if(this.options.curpage > 0) this.components["Shadow_Rects"]["Rect_0"].visible = true; else this.components["Shadow_Rects"]["Rect_0"].visible = false;

        this.components["FeatNum"].text = ElonaJS.Databases.Strings.GetLocale("Sys_40").replace("%%val%%", this.active.feats_available);

        for(let i = 0; i < this.options.optperpage; i++){
            let index = this.options.curpage * this.options.optperpage + i;
            let text = (index >= this.options.list.length ? "" : this.options.list[index].desc || "");
            let img = (index >= this.options.list.length ? "" : this.options.list[index].img || "");
            this.components["Feat_Desc"]["Desc_" + i].text = text;
           

            if(img == "") this.components["Feat_Images"]["Img_" + i].visible = false;
            else {
                this.components["Feat_Images"]["Img_" + i].setTexture(ElonaJS.Databases.Graphics.Get(img));
                this.components["Feat_Images"]["Img_" + i].visible = true;
            }

            if(index < this.options.list.length){
                if(this.options.list[index].type == "known") this.components["Feat_Images"]["Img_" + i].EJS.x = 45; else this.components["Feat_Images"]["Img_" + i].EJS.x = 30;
                this.components["Feat_Desc"]["Desc_" + i]._style.fill = this.options.list[index].color || "black";
            }
        }
    }

    menu._AddKnownTraits = function(toset){
        this.options.list.push({text: ElonaJS.Databases.Strings.GetLocale("Sys_34"), x: 35, keyimage: false});

        for(let i = 0, keys = Object.keys(this.active.traits); i < keys.length; i++){
            let trt = ElonaJS.Databases.Traits.GetByID(keys[i]);
            let tobj = {x: -20, keyimage: false, color: "blue", type: "known"};
            tobj.text = ElonaJS.Databases.Strings.GetLocale("Trait_" + trt.category) + " " + trt.GetDescription(this.active.GetTraitLevel(trt.id));
            tobj.img = trt.GetIcon();

            this.options.list.push(tobj);
            if(keys[i] == toset){
                this.options.current = this.options.list.length-1;
                this.options.curpage = Math.floor(this.options.list.length / this.options.optperpage);
                this._BuildOptions();
            }
        }
    };

    menu._OnSelect = function(){
        let opt = this.options.list[this.options.current];
        let val = opt.val;
        if(opt.val){
            this.sounds.select = "ding3";
            this.active.AddTrait(opt.val);
            this.active.feats_available--;
            if(this.active.feats_available > 0 || !this.creation){         
                this._Rebuild(val);
            } else{
                Graphics.UnloadMenu(this);
                Menus.AliasSelect.SetParameters(this.active, true);
                Graphics.LoadMenu("AliasSelect");
            }
        } else this.sounds.select = "";

        this.ScaleElements();
    };

    menu._OnBack = function(){
        Graphics.UnloadMenu(this);
        if(this.creation){
            this.active.ResetFeats();
            this.options.current = 0;
            this.options.curpage = 0;
            this._Rebuild();
            Menus.AttributeRoll.SetParameters(this.active, true);
            Graphics.LoadMenu("AttributeRoll");
        }
    }

    return menu;
})();  */