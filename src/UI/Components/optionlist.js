let MultiComponent = require("./multicomponent.js");

/**
 * @typedef OptionListSettings
 * @property {Number} spacing The vertical space between each option
 * @property {String} alignment How the option list is aligned in the menu
 * @property {Boolean} optionloop Whether to wrap back to the beginning when moving past the last option
 * @property {Boolean} pageloop Whether to wrap back to the beginning when moving past the last page
 * @property {Point2D} position The starting position of the list (relative to alignment)
 * @property {Number} perpage The maximum number of options per page
 */


/**
 * A class that hold an array of options for menus.
 * @property {OptionListSettings} settings The settings for the menu
 */
class OptionList extends MultiComponent{
    constructor(menu){
        super({id: "option_list"});
        this.current = 0;
        this.page = 0;
        this.list = [];
        this.settings = Object.assign({}, this._defaultList);
        this.style = this._defaultStyle;
        this.menu = menu;
        this.init = false;
        menu.components.OptionList = this;
    }

    PageUp(){
        let opt = this.GetCurrentItem();

        if(opt.IsAdjustable()){
            opt.ModifyValue(1);
            return;
        }

        let tpm = (this.page+1) * this.settings.perpage;
        if(this.list.length > tpm){
            this.page++;
            (this.current + this.settings.perpage >= this.list.length ? this.current = this.list.length - 1 : this.current += this.settings.perpage);
            this.Build();
            this.UpdateSelector();
        } else {
            if(this.settings.pageloop){
                this.current = this.current % this.settings.perpage;
                this.page = 0;
                this.Build();
                this.UpdateSelector();
            }
        }
    }

    PageDown(){
        let opt = this.GetCurrentItem();

        if(opt.IsAdjustable()){
            opt.ModifyValue(-1);
            return;
        }

        if(this.page > 0){
            this.page--;
            this.current -= this.settings.perpage;
            this.Build();
            this.UpdateSelector();
        } else {
            if(this.settings.pageloop){
                this.page = this.GetMaxPages() - 1;
                this.current += this.page * this.settings.perpage;
                if(this.current >= this.list.length) this.current = this.list.length - 1;
                this.Build();
                this.UpdateSelector();
            }
        }
    }

    JumpToLast(){
        this.current = this.list.length - 1;
        this.page = this.GetMaxPages() - 1;
        this.Build();
        this.UpdateSelector();
        this.AlignSelector(this.menu.position);
        this.menu.AlignElements();
        
    }

    AlignSelector(base){
        this.set.Selector.Align(base);
        this.set.Selector.Scale(Graphics.Scale());
        this.set.Diamond.Align(base);
        this.set.Diamond.Scale(Graphics.Scale());
    }

    CustomizeList(params){
        this.settings = Object.assign({}, this._defaultList, params);
    }

    CustomizeStyle(params){
        this.style = Object.assign({}, this._defaultStyle, params);
    }

    Build(){
        let numO = this.list.length;
        let listM = this.settings.perpage;

        let strO = this.page * this.settings.perpage;
        let endO = Math.min(this.page * this.settings.perpage + this.settings.perpage, numO);
        
        for(let i = strO; i < endO; i++){
            if(!this.list[i].built) this.list[i] = $.extend(true, {}, this.style, this.list[i]);
            let ostr = "Option_" + (i-strO);

            this.list[i].keytext.text = String.fromCharCode(97+(i-strO));
            this.list[i].position.x = this.settings.position.x; this.list[i].position.y = this.settings.position.y + this.settings.spacing * (i-strO);
            this.list[i].id = ostr;
            this.list[i].alignment = this.settings.alignment;

            if(!this.set[ostr]){
                this.set[ostr] = new UI.Components.Option(this.list[i], this.menu);
            } else {
                this.set[ostr].Show();
                this.set[ostr].Reset(this.list[i]);
            }
        }

        for(let i = 0; i < this.settings.perpage; i++){
            if(this.set["Option_" + i] && i >= (endO - strO)){
                this.set["Option_" + i].Hide();
            }
        }

        if(!this.init && numO > 0){
            this.set.Selector = new UI.Components.Rect({id: "Selector", color: 0xFFFFFF, alpha: 0.8, height: 15, position: {x: this.settings.position.x, y: this.settings.position.y},width: this.set["Option_0"].GetActualWidth() + 30});
            this.set.Selector.Attach(this.menu);
            this.set.Diamond = new UI.Components.Image({id: "Diamond", img: "interface.selector", position: {x: this.settings.position.x + this.set["Option_0"].GetActualWidth() + 5, y: this.settings.position.y + 3, z: 5}});
            this.set.Diamond.Attach(this.menu);
            this.init = true;
        }
    }

    Set(list){
        this.list = list;
    }

    GetCurrent(){
        return this.current;
    }

    GetCurrentItem(){
        return this.set["Option_" + (this.current % this.settings.perpage)];
    }

    GetCurrentOption(){
        return this.list[this.current];
    }

    GetList(){
        return this.list;
    }

    GetPageOptions(){
        return this.list.slice((this.page) * this.settings.perpage, Math.min(this.list.length, (this.page+1) * this.settings.perpage));
    }

    GetPage(){
        return this.page + 1;
    }

    GetMaxPages(){
        return Math.ceil(this.list.length / this.settings.perpage);
    }

    OptionUp(){
        /* Cases:
            1: No multi-page, top option.
            2: Multi-page, top option.
            3: No multi page, not top option.
            4: Multi-page, not top option."
        */

        let numpage = Math.ceil(this.list.length / this.settings.perpage);

        if(this.current % this.settings.perpage == 0){
            if(this.settings.optionloop) this.current = Math.min(((this.page + 1) * this.settings.perpage) - 1, this.list.length - 1);
        } else {
            this.current--;
        }

        this.UpdateSelector();
    }

    OptionDown(){
        let numpage = Math.ceil(this.list.length / this.settings.perpage);

        if(this.current % this.settings.perpage == this.settings.perpage - 1 || this.current == this.list.length -1){
            if(this.settings.optionloop) this.current = this.page * this.settings.perpage;
        } else {
            this.current++;
        }

        this.UpdateSelector();
    }

    UpdateSelector(){
        if(this.init){
            let opt = this.set["Option_" + (this.current % this.settings.perpage)];
            this.set.Selector.SetBasePosition(opt.GetBasePosition().x, opt.GetBasePosition().y);
            this.set.Selector.SetBaseWidth(opt.GetActualWidth()+30);
            this.set.Diamond.SetBasePosition(opt.GetBasePosition().x + opt.GetActualWidth() + 5, opt.GetBasePosition().y + 3);
        }
    }
}


OptionList.prototype._defaultList = {
    spacing: 20,
    alignment: "relative",
    optionloop: true,
    pageloop: true,
    position: {x: 0, y: 0},
    perpage: 10,
}

OptionList.prototype._defaultStyle = {
    keyimage: {
        enabled: true,
        img: "interface.option",
        z: 3,
        offset: {x: -35, y: -2}
    },
    keytext: {
        enabled: true,
        color: "white",
        offset: {x: -32, y: -2},
        outline: {color: "black", size: 3},
        z: 5,
        size: 14
    },
    text: {
        offset: {x: 0, y: 0},
        color: "black",
        z: 5
    },
    arrows: {
        enabled: false,
        offset: {x: 0, y: 0},
        spacing: 50,
        arrow_left: {
            img: "interface.arrow_left"
        },
        arrow_right: {
            img: "interface.arrow_right"
        },
        z: 3,
    },
    arrow_text: {
        centered: true,
        offset: {x: 0, y: 0},
        z: 5
    },
    position:{
        x: 0,
        y: 0
    },
    built: true
}

module.exports = OptionList;