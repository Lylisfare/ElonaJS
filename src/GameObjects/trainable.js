'use strict';

class Trainable{
    constructor(){
        this.level = 0;
        this.potential = 0;
        this.exp = 0;
    }

    GetLevel(){return this.level;}
    GetPotential(){return this.potential;}
    GetExp(){return this.exp;}
    SetLevel(val){this.level = val;}
}

module.exports = Trainable;