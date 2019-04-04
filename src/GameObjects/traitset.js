'use strict';

class TraitSet{
    constructor(){
        this.list = {};
        this.feats_available = 3;
    }

    /**
     * Adds a trait, by ID, to the trait set.
     * @param {String} id The ID of the trait to add
     * @param {Number} level The level of the trait that should be added
     * @param {Boolean} [bypass=false] Should this affect available feats. 
     */
    Add(id, level, bypass = false){
        if(this.feats_available <= 0 && !bypass) return false;
                
        let trait = DB.Traits.GetByID(id);
        if(trait) this.list[id] = new GameObjects.Trait(id);
        this.list[id].SetLevel(level);

        if(!bypass) this.feats_available -= 1;
    }   

    Available(){return this.feats_available;}

    Get(id){return this.list[id];}

    Has(id){return this.list[id] !== undefined;}
    
    Reset(){this.list = {}}
}

module.exports = TraitSet;