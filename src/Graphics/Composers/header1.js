'use strict'

let DrawTexture = require("./drawtexture.js");

let Header1 = function(nw, nh){
    let rt = PIXI.RenderTexture.create(nw, nh);
    let bgbase = DB.Graphics.Get("interface.header1_bg", null, null, true);
    let fmbase = DB.Graphics.Get("interface.header1", null, null, true);
    let bgbt = bgbase.baseTexture;
    let fmbt = fmbase.baseTexture;
    let bo = {x: fmbase.orig.x, y: fmbase.orig.y, w: fmbase.orig.width, h: fmbase.orig.height};


    for(let i = 0; i < Utils.Math.NearestMultiple(32, nw)+1; i++){
        for(let j = 0; j < Utils.Math.NearestMultiple(32, nh)+1; j++){
            DrawTexture(rt, bgbt, 32 + bgbase.orig.x, 32 + bgbase.orig.y, 32, 32, i*32, j*32);
        }
    }

    for(let i = 0; i < Utils.Math.NearestMultiple(15, nw)+1; i++){
        DrawTexture(rt, fmbt, bo.x + 5, bo.y, 15, 4, i*15, 0);
        DrawTexture(rt, fmbt, bo.x + 5, bo.y + 44, 15, 4, i*15, nh-4);
    }

    for(let i = 0; i < Utils.Math.NearestMultiple(40, nh)+1; i++){
        DrawTexture(rt, fmbt, bo.x, bo.y + 5, 4, 40, 0, i*40);
        DrawTexture(rt, fmbt, bo.x + 44, bo.y + 5, 4, 40, nw-4, i*40);
    }

    DrawTexture(rt, fmbt, bo.x, bo.y, 8, 8, 0, 0);
    DrawTexture(rt, fmbt, bo.x + bo.w - 8, bo.y, 8, 8, nw-8, 0);
    DrawTexture(rt, fmbt, bo.x, bo.y + bo.h - 8, 8, 8, 0, nh-8);
    DrawTexture(rt, fmbt, bo.x + bo.w - 8, bo.y + bo.h - 8, 8, 8, nw-8, nh-8);

    return rt;
}

module.exports = Header1;