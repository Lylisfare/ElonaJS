'use strict';

let AttributeSet = require("./attributeset.js");
let TraitSet = require("./traitset.js");

class Unit{
    constructor(){
        this.name = "Debug";
        this.sex = "Female";
        this.title = "The Creator";
        this.class = "Warrior";
        this.race = "Yerles";
        this.feats_available = 3;
        this.level = 1;
        this.exp = 0;
        this.god = "Eyth of Infidel";
        this.guild = "None";
        this.fame = 0;
        this._traits = new TraitSet();
        this._attributes = new AttributeSet();
    }

    Traits(){return this._traits;}
    Attributes(){return this._attributes;}



    //Temporary, will go away at some point
    GetClass(){return this.class}
    GetGender(){return this.sex}
    GetRace(){return this.race}
    SetClass(name){this.class = name;}
    SetGender(name){this.sex = name;}
    SetRace(name){this.race = name;}
    
    GetAttribute(id){return this.attributes.Get(id);}
    GetAttributes(){return this.attributes;}

}

module.exports = Unit;





/* 
EloChara.prototype.HasTrait = function(key){
    return (this.traits[key] !== undefined && this.traits[key] != 0);
}

EloChara.prototype.GetTrait = function(key){
    return this.traits[key];
}

EloChara.prototype.GetTraitLevel = function(key){
    if(this.HasTrait(key)) return this.traits[key];
    else return 0;
}

EloChara.prototype.AddTrait = function(key){
    if(this.HasTrait(key)) this.traits[key]++;
    else this.traits[key] = 1;
}

EloChara.prototype.GetAttbBase = function(name){
    return this.attributes[name].base;
}

EloChara.prototype.GetAttbValue = function(name){
    return this.attributes[name].effective;
}

EloChara.prototype.GetAttbPotential = function(name){
    return this.attributes[name].potential;
}

EloChara.prototype.ResetFeats = function(){
    this.traits = {};
    this.feats_available = Math.min(Math.floor(this.level / 5) + 3, 13);
}

EloChara.prototype.SetAttributes = function(attb){
    for(let i = 0, keys = Object.keys(attb); i < keys.length; i++) this.attributes[keys[i]].base = attb[keys[i]];
    this.UpdateEffectiveStats();
}

EloChara.prototype.UpdateEffectiveStats = function(){
    for(let i = 0, keys = Object.keys(this.attributes); i < keys.length; i++) this.attributes[keys[i]].effective = this.attributes[keys[i]].base;
}

EloChara.prototype.Init = function(){
    let race = ElonaJS.Databases.Races.GetByID(this.race);
    let base = (race.birth.base == "cy" ? ElonaJS.State.Time.year : 0);
    this.age = RandomFloor(race.birth.random) + race.birth.add;

    this.height = race.height + RandomFloor(race.height/5 + 1) - RandomFloor(race.height/5 + 1);
    this.weight = Math.floor(this.height*this.height*(RandomFloor(6) + 18)/10000);
} */