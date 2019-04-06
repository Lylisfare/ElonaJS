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
        return {x: this.params.position.x + this.params.text.offset.x, y: this.params.position.y + this.params.text.offset.y};
    }

    IsAdjustable(){
        return this.params.arrows.enabled;
    }

    Reset(op){
        if(!op) op = this.params;
        let chng = false;

        if(op.text){
            let val = op.text;
            Object.assign(val, {position: {x: op.position.x + val.offset.x, y: op.position.y + val.offset.y}});
            if(!this.set.text || val.modified || !Utils.Parse.ObjEq(op.text, this.params.text)){
                chng = true;
                if(this.set.text) this.set.text.Destroy();
                this.set.text = new UI.Components.Text(val);
                this.menu.AddSprite(this.set.text.sprite);
                val.modified = false;
            }
        } else (this.set.text ? this.set.text.Hide() : null);

        if(op.keyimage.enabled){
            let val = op.keyimage;
            Object.assign(val, {position: {x: op.position.x + val.offset.x, y: op.position.y + val.offset.y}})
            if(!this.set.keyimage || !Utils.Parse.ObjEq(op.keyimage, this.params.keyimage)){
                chng = true;
                if(this.set.keyimage) this.set.keyimage.Destroy();
                this.set.keyimage = new UI.Components.Image(val);
                this.menu.AddSprite(this.set.keyimage.sprite);
            }
            this.set.keyimage.Show();
        } else (this.set.keyimage ? this.set.keyimage.Hide() : null);

        if(op.keytext.enabled){
            let val = op.keytext;
            Object.assign(val, {position: {x: op.position.x + val.offset.x, y: op.position.y + val.offset.y}})
            if(!this.set.keytext || !Utils.Parse.ObjEq(op.keytext, this.params.keytext)){
                chng = true;
                if(this.set.keytext) this.set.keytext.Destroy();
                this.set.keytext = new UI.Components.Text(val);
                this.menu.AddSprite(this.set.keytext.sprite); 
            } 
            this.set.keytext.Show();
        } else (this.set.keytext ? this.set.keytext.Hide() : null);

        if(op.arrows.enabled){
            let val = op.arrows;
            Object.assign(val, {position: {x: op.position.x + val.offset.x, y: op.position.y + val.offset.y}})
            if(!this.set.arrows || !Utils.Parse.ObjEq(op.arrows, this.params.arrows)){
                chng = true;
/*                 if(this.set.arrow){
                    this.set.arrow_left.Destroy();
                    this.set.arrow_right.Destroy();
                }  */

                let leftparam = $.extend(true, {}, val, val.arrow_left);
                let rightparam = $.extend(true, {}, val, val.arrow_right, {position: {x: op.position.x + val.offset.x + val.spacing, y: op.position.y + val.offset.y}});

                if(this.set.arrow_left){
                    this.set.arrow_left.Reconstruct(leftparam);
                    this.set.arrow_right.Reconstruct(rightparam);
                } else {
                    this.set.arrow_left = new UI.Components.Image(leftparam);
                    this.set.arrow_right = new UI.Components.Image(rightparam);
                    this.menu.AddSprite(this.set.arrow_left.sprite); 
                    this.menu.AddSprite(this.set.arrow_right.sprite); 
                }
            } 
            this.set.arrow_left.Show();
            this.set.arrow_right.Show();

            if(!this.set.arrow_text || !Utils.Parse.ObjEq(op.arrow_text, this.params.arrow_text)){
                chng = true;
                if(this.set.arrow_text) this.set.arrow_text.Destroy();

                let textparam = $.extend(true, {}, op.arrow_text);          
                this.set.arrow_text = new UI.Components.Text(textparam);
                
                if(op.arrow_text.centered){
                    this.set.arrow_text.SetBasePosition(
                        op.position.x + op.arrows.offset.x + (op.arrows.spacing + this.set.arrow_left.GetActualWidth())/2,
                        op.position.y + op.arrows.offset.y
                    );
                }

                this.menu.AddSprite(this.set.arrow_text.sprite); 
                this.set.arrow_text.Show();
            } 
            this._SetArrows();
            this.ModifyValue(0);
        } else{
            if(this.set.arrow_left) this.set.arrow_left.Hide();
            if(this.set.arrow_right) this.set.arrow_right.Hide();
            if(this.set.arrow_text) this.set.arrow_text.Hide();
        }

        this.params = op;
        if(chng) this.Align(this.menu.position);
    }

    ModifyValue(dir){
        let data = this.params.data;
        if(!data || data.value === undefined) return;

        if(data.valueset){
            let index = data.valueset.indexOf(data.value);
            if(index === -1) return;

            data.value = data.valueset[Utils.Math.Limit(index + dir, 0, data.valueset.length-1)];
            this.set.arrow_text.SetText((data.parser ? data.parser(data.value) : data.value));
        }

        if(dir !== 0 && data.OnModify){
            data.OnModify(data.value);
        }

        this._SetArrows();
    }

    _SetArrows(){
        let data = this.params.data;
        if(!data || data.value === undefined) return;

        if(data.valueset){
            
            switch(data.valueset.indexOf(data.value)){
                case 0: 
                    this.set.arrow_left.Hide();
                    this.set.arrow_right.Show();
                    break;
                case data.valueset.length-1: 
                    this.set.arrow_right.Hide();
                    this.set.arrow_left.Show();
                    break;
                default:
                    this.set.arrow_right.Show();
                    this.set.arrow_left.Show();
                    break;
            }
        }
    }
}

module.exports = Option;