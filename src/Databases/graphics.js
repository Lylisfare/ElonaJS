"use strict"

let AsyncDB = require("./asyncdb");

let GraphicsDB = new AsyncDB();

GraphicsDB._ParseTiled = async function(obj){
    let base = obj.details;
    let idims = await this.RegisterImage(obj.id, obj.path);
    let toinsert = [];
    let basedoc = {id: obj.id, path: obj.path, details: obj.details};

    for(let cy = 0; cy < Math.floor(idims[1] / base.h); cy++){
        for(let cx = 0; cx < Math.floor(idims[0] / base.w); cx++){
            let tnum = (cx + cy * (Math.floor(idims[0] / base.w)));
            let params = Object.assign({}, base);
            params.x = cx * base.w;
            params.y = cy * base.h;
            params.image = obj.id;
            params.id = obj.id + "." + tnum;
            
            
            if(obj.exceptions){
                for(let i = 0, arr = Object.values(obj.exceptions); i < arr.length; i++){
                    if(arr[i].list.indexOf(tnum) != -1) Object.assign(params, arr[i].details);
                }
            }

            toinsert.push(params);
        }
    }

    this.db.insert(basedoc);
    return toinsert;
}

GraphicsDB._ParseAtlas = async function(obj){
    let toinsert = [];
    let basedoc = {id: obj.id, path: obj.path};
    await this.RegisterImage(obj.id, obj.path);

    for(let i = 0, arr = Object.values(obj.definitions), arr2 = Object.keys(obj.definitions); i < arr.length; i++){
        let params = Object.assign({}, arr[i]);
        params.image = obj.id;
        params.id = obj.id + "." + arr2[i];
        toinsert.push(params);
    }

    this.db.insert(basedoc);
    return toinsert;
}

GraphicsDB.BatchLoad = async function(arr){

    //Load simple images. No processing required.
    let toLoad = arr.simple;
    if(toLoad){
        for(let i = 0, vals = Object.values(toLoad); i < vals.length; i++){
            await this.Register(vals[i]);
        }
    }

    //Load tiled atlases. Create an object for each tile.
    toLoad = arr.tiledatlas;
    if(toLoad){
        for(let i = 0, vals = Object.values(toLoad); i < vals.length; i++){
            let output = await this._ParseTiled(vals[i]);
            for(let j = 0; j < output.length; j++) this.db.insert(output[j]);
        }
    }

    //Load non-tiled atlases. Creates an object for specified images.
    toLoad = arr.atlases;
    if(toLoad){
        for(let i = 0, vals = Object.values(toLoad); i < vals.length; i++){
            let output = await this._ParseAtlas(vals[i]);
            for(let j = 0; j < output.length; j++) this.db.insert(output[j]);
        }
    }
}

GraphicsDB.RegisterImage = async function(id, path){
    return new Promise((resolve, reject) => {
        PIXI.loader.add(id, path).load((loader, resources) => {
            resources[id].texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
            resolve([resources[id].texture.baseTexture.width, resources[id].texture.baseTexture.height]);
        })});

        /*             params.x = resources[params.id].texture.baseTexture.width;
            params.y = resources[params.id].texture.baseTexture.height; */
}

GraphicsDB.Register = async function(params){
    await this.RegisterImage(params.id, params.path);
    this.db.insert(params);
}


GraphicsDB.Get = function(img, scale = true, width, height){
    //Find the document
    let doc = this.db.findOne({id: img});
    let texture;
    let basew, baseh, targetw, targeth;
    let scalef = 1;
    let id;

    //Find the texture
    if(doc.image) texture = PIXI.utils.TextureCache[doc.image];
    else texture = PIXI.utils.TextureCache[doc.id];

    //Set a sub-rect of the texture, if the texture is not the full image
    if(doc.x || doc.y){
        let rect = new PIXI.Rectangle(doc.x, doc.y, doc.w, doc.h);
        texture = new PIXI.Texture(texture.baseTexture, rect);
    }

    //If the image is not composable, or we decide not to scale anyways, return what we have.
    if(!doc.composable || !scale) return texture;

    //Return what we have if the target size is equal to the original size.
    basew = (doc.w ? doc.w : texture.baseTexture.width);
    baseh = (doc.h ? doc.h : texture.baseTexture.height);
    targetw = (width ? width : basew) * scalef;
    targeth = (height ? height: baseh) * scalef;

    if(basew == targetw && baseh == targeth) return texture;
    
    //Check if a composited image of proper size already exists, and return it if so.
    id = img + "." + targetw + "x" + targeth;
    if(doc.variants && doc.variants[id]) return doc.variants[id];

    //Otherwise, compose the variant, save it, and return it.
    if(!doc.variants) doc.variants = {};
    doc.variants[id] = Graphics.Composers[doc.composer](targetw, targeth);
    return doc.variants[id];
}


/*
GraphicsDB.GetDetails = function(img){
    let parts = img.split(".");
    let doc = this.db.findOne({id: parts[0]});

    return this._RetrieveDetails(doc, parts[1]);
}


}

GraphicsDB._RetrieveDetails = function(doc, id){
    if(!doc.exceptions){
        if(!doc.basic) return {};
        else return doc.basic
    }

    return Object.assign({}, doc.basic, doc.exceptions[id]);
} */

module.exports = GraphicsDB;