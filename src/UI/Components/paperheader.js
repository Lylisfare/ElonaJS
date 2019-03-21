let MultiComponent = require("./multicomponent.js");

class PaperHeader extends MultiComponent{
    constructor(params){
        super(params);
        let pos = params.position;
        this.set.Text = new UI.Components.Text($.extend(true, {color: 0xFFFFFF, outline: {size: 3, color: 0x000000}, position: {x: 63, y: -3, z: 5}, id: "Text"}, params.text));
        this.set.Image = new UI.Components.Image($.extend(true, {img: "interface.header1", position: {x: 25, y: -10, z: 2}, height: 32, width: this.set.Text.GetActualWidth() + 80, id: "Image"}, params.image));
        //this.set.Text = new UI.Components.Text(Object.assign({color: 0xFFFFFF, outlinecolor: 0x000000, outlinesize: 3}, params, {z: 5, x: 63, y: -3, outline: true, id: "Text"}));
        //this.set.Image = new UI.Components.Image(Object.assign({img: "interface.header1"}, params, {z: 2, x: 25, y: -10, height: 32, width: this.set.Text.GetActualWidth() + 80, id: "Image"}));
    }
}

module.exports = PaperHeader;