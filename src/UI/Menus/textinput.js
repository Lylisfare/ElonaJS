let BaseMenu = require("./basemenu.js");

/**
 * The race select menu.
 * @name TextInput
 * @type ElonaJS.UI.Menus.TextInput
 * @memberOf ElonaJS.UI.Menus
 */
let TextInput = new BaseMenu();

TextInput.Customize({centered: true, size: {w: 220, h: 55}});

TextInput._OnLoad = function(){
    this.active = true;

    if(this.init){
        let pos = this.components.Input.GetBasePosition();
        this.components.Input.SetText("");
        this.components.Indicator.SetBasePosition(pos.x + 5);
        return;
    }

    this.init = true;
    this.dir = 0;

    new UI.Components.Image({id: "Box", img: "interface.header1", width: 220, height: 35, shadow: {distance: 10, blur: 0}}).Attach(this);
    new UI.Components.Image({id: "Header", img: "interface.input_header", position: {x: 50, y: -26}}).Attach(this);
    new UI.Components.Image({id: "Icon", img: "interface.icon_inputLatin", position: {x: 15, y: 8}}).Attach(this);
    new UI.Components.Image({id: "Indicator", img: "interface.input_indicator", position: {x: 40, y: 10}}).Attach(this);
    new UI.Components.Text({id: "Input", position: {x: 40, y: 10}, color: "white"});
    App.ticker.add(this._FlashIndicator, this);
}

TextInput._FlashIndicator = function(){
    let elem = this.components.Indicator.sprite;
    if(elem.alpha >= 1){this.dir = -0.01;}
    if(elem.alpha <= 0){this.dir = 0.01;}
    elem.alpha += this.dir;
}

TextInput._OnExit = function(){
    App.ticker.remove(this._Animate, this);
}

module.exports = TextInput;





/* 

    menu.OnInput = function(val){

        if(val == "Backspace") {
            this.components.ITxt.text = this.components.ITxt.text.slice(0, this.components.ITxt.text.length - 1);
            this.components.IIndi.EJS.x = this.components.ITxt.EJS.x + (this.components.ITxt.width / ElonaJS.GetUIScale()) + 5;
            this._Align(this.components.IIndi);
        }

        if(val == "Enter"){
            Graphics.UnloadMenu(this);
            if(this.callback) this.callback(this.components.ITxt.text);
        }

        if(val.length != 1) return;

        this.components.ITxt.text += val;
        this.components.IIndi.EJS.x = this.components.ITxt.EJS.x + (this.components.ITxt.width / ElonaJS.GetUIScale()) + 5;
        this._Align(this.components.IIndi);
    }

    */