let MultiComponent = require("./multicomponent.js");

class PaperFooter extends MultiComponent{
    constructor(params){
        super(params);
        let pos = params.position;
        this.set.Text = new UI.Components.Text($.extend(true, {position: {x: pos.x + 25, y: pos.y + 2}, id: "Text", z: 5}, params.text));
        this.set.Rect = new UI.Components.Rect($.extend(true, {position: {x: pos.x + 20, y: pos.y}, color: 0xC2AA92, id: "Rect", z: 4}, params.rect));
        this.set.Image = new UI.Components.Image($.extend(true, {position: {x: pos.x, y: pos.y}, img: "interface.icon_bulb", id: "Image", z: 3}, params.image));
    }
}

module.exports = PaperFooter;