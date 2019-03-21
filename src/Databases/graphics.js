"use strict"

let AsyncDB = require("./asyncdb");

let GraphicsDB = new AsyncDB();

GraphicsDB.Get = function(img, w, h, base){
    let parts = img.split(".");
    let doc = this.db.findOne({id: parts[0]});
    let scale = 1;
    let texture, sp, rect, identifier, tw, th, ow, oh, original, ret;

    ret = {texture: PIXI.utils.TextureCache[parts[0]]};

    if(parts.length == 1) ret.doc = doc;
    else {

        if(doc.tiled){
            let details = this._RetrieveDetails(doc, parts[1]);
            let mx = details.w || doc.tsx;
            let my = details.h || doc.tsy;

            ret.rect = new PIXI.Rectangle((parts[1] % (ret.texture.orig.width / doc.tsx)) * doc.tsx, Math.floor(parts[1] / (ret.texture.orig.width / doc.tsx)) * doc.tsy, mx, my);
            ret.texture = new PIXI.Texture(ret.texture.baseTexture, ret.rect);
            return ret.texture;
        }

        let sp = doc.definitions[parts[1]]
        ret.doc = sp;
        ret.rect = new PIXI.Rectangle(sp.x, sp.y, sp.w, sp.h);
        ret.texture = new PIXI.Texture(ret.texture.baseTexture, ret.rect);

    }

    ow = (ret.rect ? ret.rect.width : ret.texture.orig.width);
    oh = (ret.rect ? ret.rect.height : ret.texture.orig.height);
    tw = (w ? w : ow) * scale;
    th = (h ? h : oh) * scale;


    //If it's not composable, or there is no size difference, then we need to return what we have. Scaling is handled by PIXI.
    if(!ret.doc.composable || (ow == tw && oh == th) || base){
        if(parts.length == 1){
            return ret.texture;
        }
        else{
            if(doc.tex && doc.tex[parts[1]]){
                return doc.tex[parts[1]];
            }

            if(!doc.tex) doc.tex = {};
            doc.tex[parts[1]] = ret.texture;
            this.db.update(doc);
            return ret.texture;
        }
    }

    identifier = img + "." + tw + "x" + th;
    if(doc.variants && doc.variants[identifier]) return doc.variants[identifier];

    if(!doc.variants) doc.variants = {};
    doc.variants[identifier] = Graphics.Composers[ret.doc.composer](tw, th);
    return doc.variants[identifier];
}

GraphicsDB.GetDetails = function(img){
    let parts = img.split(".");
    let doc = this.db.findOne({id: parts[0]});

    return this._RetrieveDetails(doc, parts[1]);
}

GraphicsDB.Register = async function(params){
    return new Promise((resolve, reject) => {
        PIXI.loader.add(params.id, params.path).load((loader, resources) => {
            resources[params.id].texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
            params.x = resources[params.id].texture.baseTexture.width;
            params.y = resources[params.id].texture.baseTexture.height;
            this.db.insert(params);
            resolve(true);
    })});
}

GraphicsDB._RetrieveDetails = function(doc, id){
    if(!doc.exceptions){
        if(!doc.basic) return {};
        else return doc.basic
    }

    return Object.assign({}, doc.basic, doc.exceptions[id]);
}

module.exports = GraphicsDB;