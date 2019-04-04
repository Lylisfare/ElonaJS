let MultiComponent = require("./multicomponent.js");

class PaperHeader extends MultiComponent{
    constructor(params){
        super(params);
        let pos = params.position;
        this.set.Text = new UI.Components.Text($.extend(true, {color: 0xFFFFFF, outline: {size: 3, color: 0x000000}, position: {x: 63, y: -3, z: 5}, id: "Text"}, params.text));
        this.set.Image = new UI.Components.Image($.extend(true, {img: "interface.header1", position: {x: 25, y: -10, z: 2}, height: 32, width: this.set.Text.GetActualWidth() + 80, id: "Image"}, params.image));
    }
}

module.exports = PaperHeader;