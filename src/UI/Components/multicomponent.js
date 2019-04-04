class MultiComponent{
    constructor(params){
        this.params = $.extend(true, {}, this._default, params);
        this.id = params.id;
        this.hidden = false;
        this.set = {};
    }

    Align(base){
        for(let i = 0, keys = Object.keys(this.set); i < keys.length; i++){
            this.set[keys[i]].Align(base);
        }
    }

    Attach(menu, collection){
        let ns = menu._SetCollection(collection);
        ns[this.id] = this;
        for(let i = 0, keys = Object.keys(this.set); i < keys.length; i++){
            menu.container.addChild(this.set[keys[i]].sprite);
        }
    }

    Hide(){
        for(let i = 0, keys = Object.keys(this.set); i < keys.length; i++){
            this.set[keys[i]].Hide();
        }
        this.hidden = true;
    }

    IsHidden(){
        return this.hidden;
    }

    Scale(scale){
        for(let i = 0, keys = Object.keys(this.set); i < keys.length; i++){
            this.set[keys[i]].Scale(scale);
        }
    }

    Show(){
        for(let i = 0, keys = Object.keys(this.set); i < keys.length; i++){
            this.set[keys[i]].Show();
        }
        this.hidden = false;
    }


}

module.exports = MultiComponent;