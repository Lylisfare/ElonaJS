let MultiComponent = require("./multicomponent.js");

class SectionHeader extends MultiComponent{
    constructor(params){
        super(params);
        let pos = params.position;
        this.set.Text = new UI.Components.Text($.extend(true, {id: "Text", position: {x: pos.x + 23, y: pos.y}}, params.text));
        this.set.Rect = new UI.Components.Rect($.extend(true, {id: "Rect", position: {x: pos.x + 20, y: pos.y + 15}, color: "black", height: 1, width: this.set.Text.GetActualWidth() +10}, params.rect));
        this.set.Image = new UI.Components.Image($.extend(true, {id: "Image", position: {x: pos.x, y: pos.y}, img: "interface.icon_diamond"}, params.image));
    }
}

module.exports = SectionHeader;