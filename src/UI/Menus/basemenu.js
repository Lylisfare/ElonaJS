'use strict'

/**
 * @class
 * @classdesc A base menu object to extend for menus in the game.
 * @memberOf ElonaJS.UI.Menus
 */
class BaseMenu{
    constructor(){
        this.sounds = {
            cursor: "cursor1",
            select: "ok1",
            page: "pop1"
        };
        this.components = {};
        this.position = {x: 0, y: 0};
        this.container = new PIXI.Container();
        this.size = {w: 0, h: 0};
        this.init = false;
        this.centered = false;
        this.options = null;
    }

    AddSprite(sprite){
        this.container.addChild(sprite);
    }

    AlignElements(clist){
        if(!clist) clist = this.components;
        let elist = Object.keys(clist);
        for(let i = 0; i < elist.length; i++){
            let elem = clist[elist[i]];
            if(elem.Align) elem.Align(this.position);
            else if (typeof elem == "object") this.AlignElements(elem);
        }
    }

    Customize(params){
        Object.assign(this, params);
    }

    DestroyComponent(comp){
        this.container.children.splice(this.container.children.indexOf(comp.sprite), 1);
        comp.sprite.destroy();
    }

    KeyPress(key){
        switch(key){
            case "key_up":
                this.options.OptionUp();
                this.options.AlignSelector(this.position);
                this._PlaySound(this.sounds.cursor);
                if(this._PreviewData) this._PreviewData();
                break;

            case "key_down":
                this.options.OptionDown();
                this._PlaySound(this.sounds.cursor);
                this.options.AlignSelector(this.position);
                if(this._PreviewData) this._PreviewData();
                break;

            case "key_enter":
                if(this._OnSelect) this._OnSelect();
                this._PlaySound(this.sounds.select);
                break;

            case "key_back":
                if(this._OnBack) this._OnBack();
                break;
            case "key_left":
                this.options.PageDown();
                this._PlaySound(this.sounds.page);
                this.options.AlignSelector(this.position);
                if(this._PreviewData) this._PreviewData();
                if(this.components.PageNum) this.components.PageNum.SetText(i18n("ui.Page", {cur: this.options.GetPage(), max: this.options.GetMaxPages()}));
                break;
            case "key_right":
                this.options.PageUp();
                this._PlaySound(this.sounds.page);
                this.options.AlignSelector(this.position);
                if(this._PreviewData) this._PreviewData();
                if(this.components.PageNum) this.components.PageNum.SetText(i18n("ui.Page", {cur: this.options.GetPage(), max: this.options.GetMaxPages()}));
                break;
        }
    }

    _PlaySound(val){
        if(val) ElonaJS.Audio.PlaySound(val);
    }

    Setup(params){
        if(!this.options) this.options = new UI.Components.OptionList(this);
        if(this._OnLoad) this._OnLoad(params);
        this._UpdateBase();
        this.options.Build();
        this.options.UpdateSelector();
        this._SortElements();
        this.AlignElements();

        if(this._PreviewData) this._PreviewData();
        
        
        /*

        if(!this.container.rightclick){
            this.container.interactive = true;

            this.container.rightclick = (e) =>{
                if(this._OnBack) this._OnBack();
            }
        }
        this.ScaleElements();
            */  
    }

    _SetCollection(id){
        if(!id) return this.components;
        let parts = id.split('.');
        let ns = this.components;

        for(let i = 0; i < parts.length; i++){
            if(!ns[parts[i]]) ns[parts[i]] = {};
            ns = ns[parts[i]]; 
        }

        return ns;
    }

    _SortElements(){
        this.container.children.sort(function(a,b){
            return a.z - b.z;
        });
    }

    _UpdateBase(){
        if(this.centered){
            let dims = {x: 800, y: 600};
            this.position.x = (dims.x - this.size.w) / 2;
            this.position.y = (dims.y - this.size.h) / 2;
        }
    }
}

module.exports = BaseMenu;