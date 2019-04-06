'use strict'

let DrawTexture = require("./drawtexture.js");
    
let Header2 = function(nw, nh){
    let rt = PIXI.RenderTexture.create(nw, nh);
    let base = DB.Graphics.Get("interface.header2", false);
    let bt = base.baseTexture;
    let bo = {x: base.orig.x, y: base.orig.y, w: base.orig.width, h: base.orig.height};

    for(let i = 0; i < Utils.Math.NearestMultiple(16, nw)+1; i++){
        for(let j = 0; j < Utils.Math.NearestMultiple(16, nh)+1; j++){
            DrawTexture(rt, bt, bo.x + 31 + 16 * (i%6), bo.y + 3, 16, 16, i*16, j*16);
        }
    }

    for(let i = 0; i < Utils.Math.NearestMultiple(16, nw)+1; i++){
        DrawTexture(rt, bt, bo.x + (i%8), bo.y, 16, 3, i*16, 0);
        DrawTexture(rt, bt, bo.x + (i%8), bo.y, 16, 3, i*16, nh-3);
    }

    return rt;
}

module.exports = Header2;