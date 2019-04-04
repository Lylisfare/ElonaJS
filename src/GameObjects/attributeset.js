'use strict';

let attribute = require("./attribute.js");

class AttributeSet{
    constructor(){
        this.list = {};

        let attblist = DB.Attributes.GetAll();

        for(let i = 0; i < attblist.length; i++){
            this.list[attblist[i].id] = new attribute();
        }
    }

    Set(obj){
        for(let i = 0, keys = Object.keys(obj); i < keys.length; i++){
            if(this.list[keys[i]]) this.list[keys[i]].SetLevel(obj[keys[i]]);
        }
    }


    GetAttribute(str){return this.list[str];}
}

module.exports = AttributeSet;