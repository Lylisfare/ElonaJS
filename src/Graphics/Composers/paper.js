let DrawTexture = require("./drawtexture.js");

let Paper = function(nw, nh){
    let rt = PIXI.RenderTexture.create(nw, nh);
    let base = DB.Graphics.Get("interface.paper", false);
    let bt = base.baseTexture;
    let bo = {x: base.orig.x, y: base.orig.y, w: base.orig.width, h: base.orig.height};

    let mx = (264 - 96)/16;
    let my = (192 - 96)/16;
    let cr = 0;
    let cc = 0;

    for(let i = 3; i < Utils.Math.NearestMultiple(16, nh)-2; i++){
        for(let j = 3; j < Utils.Math.NearestMultiple(16, nw)-2; j++){
            DrawTexture(rt, bt, bo.x + 48 + cc*16, bo.y + 48 + cr*16, 16, 16, j*16, i*16);
            cc++;
            if(cc >= mx) cc = 0;
        }
        cr++;
        if(cr >= my) cr = 0;
        cc = 0;
    } 

    for(let i = 3; i < Utils.Math.NearestMultiple(16, nw)-3; i++){
        DrawTexture(rt, bt, bo.x + (4 + i % 6) * 16, bo.y , 16, 48, i*16, 0);
        DrawTexture(rt, bt, bo.x + (4 + i % 6) * 16, bo.y + bo.h - 48, 16, 48, i*16, nh - 48);
    }

    for(let i = 3; i < Utils.Math.NearestMultiple(16, nh)-3; i++){
        DrawTexture(rt, bt, bo.x, bo.y + (4 + i % 6) * 16, 48, 16, 0, i*16);
        DrawTexture(rt, bt, bo.x + bo.w - 48, bo.y + (4 + i % 6) * 16, 48, 16, nw - 48, i*16);
    } 

    DrawTexture(rt, bt, bo.x, bo.y + bo.h - 64, 64, 64, 0, nh-64);
    DrawTexture(rt, bt, bo.x, bo.y, 64, 64, 0, 0);
    DrawTexture(rt, bt, bo.x + bo.w - 64, bo.y, 64, 64, nw-64, 0);
    DrawTexture(rt, bt, bo.x + bo.w - 64, bo.y + bo.h - 64, 64, 64, nw-64, nh-64);

    return rt;  
}

module.exports = Paper;