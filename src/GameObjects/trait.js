class Trait{
    constructor(id){
        this.id = id;
        this.level = 0;
        this.dbentry = DB.Traits.GetByID(this.id);
    }

    GetDescription(){
        return i18n("traits." + this.id + ".description." + this.level);
    }

    GetDisplay(){
        let val = (this.level == 0 ? 1 : this.level);
        return i18n("traits." + this.id + ".display." + Math.sign(val));
    }

    GetIcon(){
        switch(this.dbentry.category){
            case "feat": return "interface.icon_star";
            case "race": return "interface.icon_gene";
            default: return "interface.icon_star";
        }
    }

    GetName(){
        return i18n("traits." + this.id + ".name." + this.level);
    }

    CanGain(){
        let max = this.dbentry.max;
        return this.level < max;
    }

    CanLose(){
        let min = this.dbentry.min;
        return this.level > min;
    }

    LevelUp(){if(this.CanGain()) this.level++;}
    LevelDown(){if(this.CanLoase()) this.level--;}
    SetLevel(lv){this.level = lv;}
}

module.exports = Trait;