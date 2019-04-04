"use strict"

let BaseDB = require("./basedb.js");


class Setting{
    constructor(obj){
        Object.assign(this, obj);
        this.value = this.initial;
    }

    GetAsOption(){
        let option = {text: {}, arrow_text: {}, arrows: {enabled: true, spacing: 120, offset: {x: 200, y: 0}}};
        option.data = {setting: this};

        option.text.text = i18n("settings." + this.id + ".name");

        //predefined, toggle, step

        switch(this.type){
            case("predefined"):
                option.data.valueset = this.values;
                option.data.value = this.value;
                break;
            case("toggle"):
                option.data.valueset = [false, true];
                option.data.value = this.value;
                option.data.parser = this._ToggleParser;
                break;
            case("step"):
                option.data.step = this.stepp;
                option.data.value = this.value;
                option.data.min = this.min;
                option.data.max = this.max;
                break;
        }

        option.data.OnModify = this.OnModify.bind(this);

        option.arrow_text.text = option.data.value;

        return option;
    }

    _ToggleParser(val){
        return (val ? "On" : "Off");
    }

    RegisterWatcher(fn){
        this._OnModify = fn;
    }

    OnModify(val){
        this.value = val;
        if(this._OnModify) this._OnModify();
    }
}

let SettingsDB = new BaseDB();
SettingsDB.castAs = Setting;


SettingsDB.RegisterWatcher = function(id, fn){
    let lv = this.db.findOne({id: id});
    if(lv) lv.RegisterWatcher(fn);
}

SettingsDB.InitDefault = function(){
    this.RegisterWatcher("adaptive_res", UI.Resize.bind(UI));
    this.RegisterWatcher("canvas_resolution", UI.Resize.bind(UI));
    this.RegisterWatcher("canvas_size", UI.Resize.bind(UI));
    this.RegisterWatcher("fullscreen", () => { if(Sys.env == "node") electron.ipcRenderer.send('fullscreen', Settings.GetByID("fullscreen").value);})
}


module.exports = SettingsDB;