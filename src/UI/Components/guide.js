let MultiComponent = require("./multicomponent.js");

class Guide extends MultiComponent{
    constructor(params){
        super(params);
        let pos = params.position || {x: 0, y: 0};
        this.set.Text = new UI.Components.Text($.extend(true, {position: {x: pos.x + 40, y: pos.y + 14}, id: "Text", color: "white", alignment: "top-left"}, params.text));
        this.set.Image = new UI.Components.Image($.extend(true, {position: {x: pos.x + 20, y: pos.y + 10}, alignment: "top-left", img: "interface.header2", id: "Image", height: 24, width: this.set.Text.GetActualWidth() + 40}, params.image));
    }
}

module.exports = Guide;