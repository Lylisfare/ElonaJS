let MultiComponent = require("./multicomponent.js");

class Option extends MultiComponent{
    constructor(params, menu){
        super(params);
        this.menu = menu;
        this.Reset();
    }

    GetActualWidth(){
        return this.set.text.GetActualWidth();
    }

    GetBasePosition(){
        return {x: this.params.position.x, y: this.params.position.y};
    }

    Reset(op){
        if(!op) op = this.params;

        if(op.text){
            let val = op.text;
            Object.assign(val, {position: {x: op.position.x + val.offset.x, y: op.position.y + val.offset.y}});
            if(!this.set.text || !Utils.Parse.ObjEq(op.text, this.params.text)){
                if(this.set.text) this.set.text.Destroy();
                this.set.text = new UI.Components.Text(Object.assign(val, {position: {x: op.position.x + val.offset.x, y: op.position.y + val.offset.y}}));
                this.menu.AddSprite(this.set.text.sprite);
            }
        } else (this.set.text ? this.set.text.Hide() : null);

        if(op.keyimage.enabled){
            let val = op.keyimage;
            Object.assign(val, {position: {x: op.position.x + val.offset.x, y: op.position.y + val.offset.y}})
            if(!this.set.keyimage || !Utils.Parse.ObjEq(op.keyimage, this.params.keyimage)){
                if(this.set.keyimage) this.set.keyimage.Destroy();
                this.set.keyimage = new UI.Components.Image(Object.assign(val, {position: {x: op.position.x + val.offset.x, y: op.position.y + val.offset.y}}));
                this.menu.AddSprite(this.set.keyimage.sprite);
            }
        } else (this.set.keyimage ? this.set.keyimage.Hide() : null);

        if(op.keytext.enabled){
            let val = op.keytext;
            Object.assign(val, {position: {x: op.position.x + val.offset.x, y: op.position.y + val.offset.y}})
            if(!this.set.keytext || !Utils.Parse.ObjEq(op.keytext, this.params.keytext)){
                if(this.set.keytext) this.set.keytext.Destroy();
                this.set.keytext = new UI.Components.Text(Object.assign(val, {position: {x: op.position.x + val.offset.x, y: op.position.y + val.offset.y}}));
                this.menu.AddSprite(this.set.keytext.sprite); 
            } else (this.set.keytext ? this.set.keytext.Hide() : null);
        }

        this.params = op;
    }




/*  
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
                centered: true
            },
            built: true
        } */
}

module.exports = Option;