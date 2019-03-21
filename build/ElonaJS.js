(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict'
/**
 * @class
 * @classdesc A class that handles BGM and SE.
 * @property {Howler} this.cbgm A Howler object for the currently playing track
 * @property {String} this.ctrack The name of the track currently being played.
 * @property {Boolean} this.locked Whether or not audio is presently locked.
 */

class AudioHandler{
    constructor(){ 
        this.cbgm = null;
        this.ctrack = null;
        this.locked = true;
        this.aSounds = 0;
    }

    PlaySound(name){
        if(this.aSounds < 10){
            let se = DB.Sound.GetByID(name);
            if(!se) return;
            let snd = new Howl({src: se.path, volume: 0.1});
            this.aSounds++;
            snd.on('end', () => {snd.unload(); this.aSounds--;});
            snd.play();
        }
    }

    /** Plays a music track by name.
     * @param {String} name The name of the track to play.
     */
    PlayTrack(name){
        if(name == this.ctrack) return;
        let track = DB.Music.GetByID(name);
        if(track){
            if(this.ctrack){
                this.cbgm.stop();
                this.cbgm.unload();
            }

            this.cbgm = new Howl({src: track.path, loop: true, volume: 0.02, html5: true, onplayerror: () => {
                if(this.locked){
                    this.cbgm.once('unlock', () =>{
                        setTimeout(() => {
                            if(this.cbgm._queue.length > 0) this.cbgm.play();
                        }, 1000);
                    });
                    this.locked = false;
                }
            }});
            this.cbgm.load();
            console.log(this.cbgm.play());
            this.ctrack = name;
        }
    }

    /** Stops the currently playing track. */
    StopMusic(){
        if(this.cbgm){
            this.cbgm.stop();
            this.cbgm.unload();
        }
        this.ctrack = null;
    }
}

module.exports = new AudioHandler();
},{}],2:[function(require,module,exports){
'use strict'

let BaseDB = require("./basedb.js");
let master = new loki();

/**
 * @memberOf ElonaJS
 * @property {BaseDB} Music DB for BGM tracks
 * @property {BaseDB} Sound DB for Sound Effects
 * @property {BaseDB} i18n DB for internationalization
 * @namespace ElonaJS.Databases
 */
let Databases = {
    Music: new BaseDB("Music", ["id"], master),
    Sound: new BaseDB("Sound", ["id"], master),
    Races: new BaseDB("Races", ["id"], master),
    Classes: new BaseDB("Classes", ["id"], master),
    Skills: new BaseDB("Skills", ["id"], master),
    Graphics: require("./graphics.js"),
    i18n: require("./i18n.js"),
    loki: master
}

Databases.i18n.SetDB("i18n", ["id"], master);
Databases.Graphics.SetDB("graphics", ["id"], master);
window.i18n = Databases.i18n.Get.bind(Databases.i18n);
window.i18nObj = Databases.i18n.GetObj.bind(Databases.i18n);

/**
 * An asyncronous function to load game data into in-memory databases.
 * @memberOf ElonaJS.Databases
 * @name Load
 * @function
 */
Databases.Load = async function(){
    let a = await Utils.File.GetJSON("./data/data.json");
    this.Music.BatchLoad(a.music);
    this.Sound.BatchLoad(a.sound);
    this.Races.BatchLoad(a.races);
    this.Classes.BatchLoad(a.classes);
    this.Skills.BatchLoad(a.skills);
    await this.i18n.LoadFromJSON("./locale/en.json");
    await this.Graphics.LoadFromJSON("./data/Graphics.JSON");
}

module.exports = Databases;
},{"./basedb.js":4,"./graphics.js":5,"./i18n.js":6}],3:[function(require,module,exports){
"use strict"

let BaseDB = require("./basedb.js");

/**
 * @class
 * @classdesc An extension of the base DB which assumes the Register function is asynchronous
 * @extends BaseDB
 */
class AsyncDB extends BaseDB{
    constructor(name, indexes, master, cast){
        super(name, indexes, master, cast)
    }

    async BatchLoad(arr){
        for(let i = 0, keys = Object.keys(arr); i < keys.length; i++){
            await this.Register(arr[keys[i]]);
        }
    }

    async LoadFromJSON(path, merge){
        let self = this;
        return new Promise( (resolve, reject) => {
            $.getJSON(path, async function(data){
                await self.BatchLoad(data);
                resolve();
            });
        })
    }
}

module.exports = AsyncDB;
},{"./basedb.js":4}],4:[function(require,module,exports){
'use strict'

/**
 * @class
 * @classdesc A base DB class for game data.
 * @property {Object} last The last piece of data returned from a search.
 * @property {Function} castAs A class object to cast all added members to.
 * @property {LokiDB} db The relevant collection of the master LokiDB.
 */
class BaseDB{
    /**
     * @param {String} name Identifier for the database
     * @param {Array} [indexes] A string array of indexes for the database
     * @param {LokiDB} [master] The master LokiDB object 
     * @param {Function} [cast] A class object to cast all added members to.
     */
    constructor(name, indexes, master, cast){
        this.last = null;
        this.castAs = cast;
        if(master) this.db = master.addCollection(name, indexes);
    }

    /**
     * Returns a single document from the DB based on ID
     * @param {String} id The ID of the document to find
     * @returns {Object}
     */
    GetByID(id){
        return this.db.findOne({id: id});
    }

    /**
     * Returns all documents from the DB.
     */
    GetAll(){
        return this.db.find({});
    }

    /**
     * An asynchronous method to load documents from a JSON file.
     * @param {String} path The path to the JSON file
     * @param {Boolean} [merge=false] Whether documents should be merged or overwritten
     */
    async LoadFromJSON(path, merge = false){
        let self = this;

        return new Promise((resolve, reject) => {
            Utils.File.GetJSON(path).then((data) => {
                if(merge === true) self.BatchMerge(data);
                else self.BatchLoad(data);
                resolve();
            })
        })
    }

    /**
     * Adds all values of the object as entries in the DB.
     * @param {Object} obj A multi-key object
     */
    BatchLoad(obj){
        for(let entry in obj) this.Register(obj[entry]);
    }

    /**
     * Merges all values of the object as entries in the DB.
     * @param {Object} obj A multi-key object
     */
    BatchMerge(obj){
        for(let entry in obj) this.Merge(obj[entry]);
    }

    /**
     * Adds a single object to the DB
     * @param {Object} obj The object to add
     */
    Register(obj){
        if(this.baseClass) this.db.insert(new this.baseClass(obj));
        else this.db.insert(obj);
    }

    /**
     * Merges a single object to the DB
     * @param {Object} obj The object to add
     */
    Merge(obj){
        let old = this.db.findOne({id: obj.id});
        if(!old) this.db.insert(obj);
        else {
            Object.assign(old, obj);
            this.db.update(old);
        }
    }

    /**
     * Searches the DB based on specified parameters.
     * @param {Object} obj The parameters to search for
     * @returns {Array} 
     */
    Search(obj){
        return this.db.find(obj);
    }

    /**
     * Resets the name, indexes, and master LokiDB of the collection.
     * @param {String} name Identifier for the database
     * @param {Array} indexes A string array of indexes for the database
     * @param {LokiDB} master The master LokiDB object 
     */
    SetDB(name, indexes, master){
        this.db = master.addCollection(name, indexes);
    }
}

module.exports = BaseDB;
},{}],5:[function(require,module,exports){
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
},{"./asyncdb":3}],6:[function(require,module,exports){
"use strict"

let BaseDB = require("./basedb.js");

/**
 * A database of strings used in the game.
 * @memberOf ElonaJS.Databases
 * @name i18n
 */
let i18n = new BaseDB("i18n");


/**
 * Returns a localized string based on a reference and optional parameters.
 * @memberOf ElonaJS.Databases.i18n
 * @function
 * @param {String} id The identifier for the string
 * @param {Object} params Key-value pairs to modify the returned string
 */
i18n.Get = function(id, params){
    let lv = this.db.findOne({id: id});
    if(lv && !params) return this._ReplaceReferences(id, lv.value, null);
    if(lv){
        let keys = Object.keys(params)
        let str;

        for(let i = 0; i < keys.length; i++){
            let val = params[keys[i]];
            if(typeof val === "string") params[keys[i]] = this._ReplaceReferences(id, val, params);
        }

        if(params.count !== undefined && params.count != 1){
            let nv = this.db.findOne({id: id + "_plural"});
            if(nv) str = nv.value;
        }

        if(!str) str = lv.value;

        str = this._ReplaceReferences(id, str, params);

        for(let i = 0; i < keys.length; i++) {                
            str = str.replace("%{" + keys[i] + "}", params[keys[i]]);
        }

        return str;
    }

    lv = this.db.find({id: {"$contains" : id}});
    if(lv) return lv;
    return null;
}

i18n.GetObj = function(id, params){
    let res = this.Get(id, params);
    if(res.constructor === Array){
        let ret = {};

        for(let i = 0; i < res.length; i++){
            let parts = res[i].id.split(".");
            ret[parts[parts.length-1]] = res[i];
        }
        
        return ret;
    } else return res;
}

i18n.LoadFromJSON = async function(path, merge = false){
    return new Promise((resolve, reject) => {
        Utils.File.GetJSON(path).then((data) => {
            this._ParseAndRegister(data);
            resolve();
        })
    })
}

i18n._ParseAndRegister = function(data, prefix = ""){
    let arr = Object.keys(data);

    for(let i = 0; i < arr.length; i++){
        if(typeof data[arr[i]] == "object") this._ParseAndRegister(data[arr[i]], prefix + arr[i] + ".");
        else {
            let toInsert = {id: prefix + arr[i], value: data[arr[i]]};
            this.db.insert(toInsert);
        }
    }
}

i18n._ReplaceReferences = function(id, str, params){
    let matches = /(?<=\${).*(?=})/.exec(str);
    if(matches !== null){
        for(let i = 0; i < matches.length; i++){
            if(matches[i] != id) str = str.replace("${" + matches[i] + "}", this.Get(matches[i], params));
        }
        return str;
    }
    return str;
}

module.exports = i18n;
},{"./basedb.js":4}],7:[function(require,module,exports){
'use strict'

/** TODO
 * UniComponent - Graphics.Dim, Graphics.Scale
 * Graphics.GetRect
 * Uncomment uihandler
 */

String.prototype.initCap = function () {
    return this.toLowerCase().replace(/(?:^|\s)[a-z]/g, function (m) {
       return m.toUpperCase();
    });
 };

 $(document).ready(async () => {
    /**
     * @namespace ElonaJS
     * @property {ElonaJS.Databases} Databases A collection of data databases used by the game.
     * @property {ElonaJS.Utils} Utils A collection of utility functions used by the game.
     * @property {ElonaJS.UI} UI Methods & Sytems related to the game's UI (menus, components, etc.)
     * @property {AudioHandler} Audio The audio handler for the game.
     */
    let ElonaJS = {
        Audio: require("./Audio/audiohandler.js"),
        Graphics: require("./Graphics/Graphics.js"),
        Databases: require("./Databases/Databases.js"),
        UI: require("./UI/UI.js"),
        Utils: require("./Utils/Utils.js"),
        Input: require("./Input/Input.js")
    }
    window.Graphics = ElonaJS.Graphics;
    window.Utils = ElonaJS.Utils;
    window.DB = ElonaJS.Databases;
    window.ElonaJS = ElonaJS;
    window.UI = ElonaJS.UI;
    window.Utils = ElonaJS.Utils;
    window.Input = ElonaJS.Input;
    Graphics.Init();
    await DB.Load();
    await Utils.File.LoadFont('OpenSans', 'fonts/OpenSans-Regular.ttf');
    UI.Init();

    Input.Attach();  
    UI.LoadMenu("TitleScreen");
 })

/*  function sortObjByKey(value) {
    return (typeof value === 'object') ?
      (Array.isArray(value) ?
        value.map(sortObjByKey) :
        Object.keys(value).sort().reduce(
          (o, key) => {
            const v = value[key];
            o[key] = sortObjByKey(v);
            return o;
          }, {})
      ) :
      value;
  }
  
  
  function orderedJsonStringify(obj) {
    return JSON.stringify(sortObjByKey(obj));
  } */
},{"./Audio/audiohandler.js":1,"./Databases/Databases.js":2,"./Graphics/Graphics.js":13,"./Input/Input.js":15,"./UI/UI.js":33,"./Utils/Utils.js":35}],8:[function(require,module,exports){
/**
 * A list of composers for images
 * @namespace ElonaJS.Graphics.Composers
 * @memberOf ElonaJS.Graphics
 * @name Composers
 */
let Composers = {
    Paper: require("./paper.js"),
    Header1: require("./header1.js"),
    Header2: require("./header2.js")
}

module.exports = Composers;
},{"./header1.js":10,"./header2.js":11,"./paper.js":12}],9:[function(require,module,exports){
let DrawTexture = function (rt, bt, x, y, w, h, dx, dy){
    let ct = new PIXI.Texture(bt, new PIXI.Rectangle(x, y, w, h));
    let cs = new PIXI.Sprite(ct);
    cs.position.set(dx, dy);
    App.renderer.render(cs, rt, false);
};

module.exports = DrawTexture;
},{}],10:[function(require,module,exports){
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
},{"./drawtexture.js":9}],11:[function(require,module,exports){
'use strict'

let DrawTexture = require("./drawtexture.js");
    
let Header2 = function(nw, nh){
    let rt = PIXI.RenderTexture.create(nw, nh);
    let base = DB.Graphics.Get("interface.header2", null, null, true);
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
},{"./drawtexture.js":9}],12:[function(require,module,exports){
let DrawTexture = require("./drawtexture.js");

let Paper = function(nw, nh){
    let rt = PIXI.RenderTexture.create(nw, nh);
    let base = DB.Graphics.Get("interface.paper", null, null, true);
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
},{"./drawtexture.js":9}],13:[function(require,module,exports){
let Graphics = {
    Init: function(){
        this.App = new PIXI.Application({width: 800, height: 600, transparent: false, antialias: true});
        window.App = this.App;
        this.App.view.id = "game-canvas";
        $('body').append(this.App.view);
    },
    Scale: function(){return 1;},
    Spriting: require("./spriting.js"),
    Composers: require("./Composers/Composers.js")
};


module.exports = Graphics;
},{"./Composers/Composers.js":8,"./spriting.js":14}],14:[function(require,module,exports){
/**
 * A collection of spriting methods.
 * @namespace ElonaJS.Graphics.Spriting
 * @memberOf ElonaJS.Graphics
 */
let Spriting = {};

/**
 * A method to create a rectangle graphic based on input parameters.
 * @memberOf ElonaJS.Graphics.Spriting
 * @function
 * @name GetRect
 * @param {RectParams} params The parameters of the rectangle
 * @returns PIXI.Sprite
 */
Spriting.GetRect = function(params){
    let rect = new PIXI.Graphics();
    rect.beginFill(params.color, params.alpha);
    rect.drawRect(0, 0, params.width, params.height);
    rect.endFill();
    rect.position.set(params.position.x, params.position.y);
    rect.z = params.position.z;
    return rect;
}

/**
 * A method to create a text graphic based on input parameters.
 * @memberOf ElonaJS.Graphics.Spriting
 * @function
 * @name GetText
 * @param {TextParams} params The parameters of the text
 * @returns PIXI.Sprite
 */
Spriting.GetText = function(params){
    let style = new PIXI.TextStyle({fontFamily: "OpenSans"});
    //let style = new PIXI.TextStyle();
    for(let i = 0, keys = Object.keys(params); i < keys.length; i++){
        let val = params[keys[i]];
        switch(keys[i]){
            case "size": style.fontSize = val; break;
            case "color": style.fill = val; break;
            case "wrap": style.wordWrap = true; style.wordWrapWidth = val.width; break;
            case "weight": style.fontWeight = val; break;
            case "outline": style.stroke = val.color; style.strokeThickness = val.size; break;
            default: break;
        }
       //breakWords: ElonaJS.GetSetting("language", true) == "JP"
   }
   let sprite = new PIXI.Text((params.i18n ? i18n(params.i18n) : params.text), style);
   sprite.position.set(params.position.x, params.position.y);
   sprite.z = params.position.z;
   return sprite; 
}

/**
 * A method to create a image graphic based on input parameters.
 * @memberOf ElonaJS.Graphics.Spriting
 * @function
 * @name GetImage
 * @param {ImageParams} params The parameters of the text
 * @returns PIXI.Sprite
 */
Spriting.GetImage = function(params){
    let texture = DB.Graphics.Get(params.img, params.width, params.height);
    let sprite = new PIXI.Sprite(texture);

    for(let i = 0, keys = Object.keys(params); i < keys.length; i++){
        let val = params[keys[i]];
        switch(keys[i]){
            case "tint": sprite.tint = val; break;
            case "shadow": sprite.filters = [new PIXI.filters.DropShadowFilter({distance: val.distance, blur: val.blur})]; break;
            case "alpha": sprite.alpha = val; break;
            case "height": sprite.height = val; break;
            case "width": sprite.width = val; break;
            case "position": sprite.position.set(val.x, val.y); break;
            case "scale": sprite.scale.set(val, val); break;
            default: break;
        }
    }
    sprite.z = params.position.z;
    return sprite;
}

module.exports = Spriting;
},{}],15:[function(require,module,exports){
let InputManager = {};

InputManager.Attach = function(){
    if(!this._binding) this._binding = this._KeyListener.bind(this);
    $(document).on("keydown", this._binding);
}

InputManager._KeyListener = function(e){
    this._KeyPressed(e);
}


InputManager._KeyPressed = function(e){
    let key = this._Decode(e);
    if(!key) return;

    let menu = UI.TopMenu();
    if(!menu) return;

    menu.KeyPress(key);
}

InputManager.Detach = function(){
    $(document).off("keydown", this._binding);
}

InputManager._defaultBindings = {
    "ArrowUp": "key_up",
    "ArrowDown": "key_down",
    "ArrowLeft": "key_left",
    "ArrowRight": "key_right",
    "Enter": "key_enter",
    "Shift": "key_back"
}

InputManager._Decode = function(code){
    let token = code.key;

    if(code.keyCode >= 97 && code.keyCode <= 105) {
        token = "Numpad_" + code.key;
    }
    
    return this._defaultBindings[token];
}


module.exports = InputManager;
},{}],16:[function(require,module,exports){
/**
 * A collection of UI components.
 * @namespace ElonaJS.UI.Components
 */
let Components = {
    Rect: require("./rect.js"),
    Text: require("./text.js"),
    Image: require("./image.js"),
    PaperFooter: require("./paperfooter.js"),
    PaperHeader: require("./paperheader.js"),
    Option: require("./option.js"),
    OptionList: require("./optionlist.js"),
    SectionHeader: require("./sectionheader.js"),
    Guide: require("./guide.js")
}

module.exports = Components;
},{"./guide.js":17,"./image.js":18,"./option.js":20,"./optionlist.js":21,"./paperfooter.js":22,"./paperheader.js":23,"./rect.js":24,"./sectionheader.js":25,"./text.js":26}],17:[function(require,module,exports){
let MultiComponent = require("./multicomponent.js");

class Guide extends MultiComponent{
    constructor(params){
        super(params);
        let pos = params.position;
        this.set.Text = new UI.Components.Text($.extend(true, {position: {x: pos.x + 40, y: pos.y + 14}, id: "Text", color: "white", alignment: "top-left"}, params.text));
        this.set.Image = new UI.Components.Image($.extend(true, {position: {x: pos.x + 20, y: pos.y + 10}, alignment: "top-left", img: "interface.header2", id: "Image", height: 24, width: this.set.Text.GetActualWidth() + 40}, params.image));
    }
}

module.exports = Guide;
},{"./multicomponent.js":19}],18:[function(require,module,exports){
let UniComponent = require("./unicomponent.js");

/**
 * @typedef Shadow
 * @property {Number} distance The length of the shadow
 * @property {Number} blur The blur of the shadow
 */


/**
 * @typedef ImageParams
 * @property {Point3D} position The position of the image
 * @property {Shadow} [shadow] The parameters for the image's drop shadow
 * @property {String} alignment The alignment of the image
 * @property {String} img The identifier of the image
 * @property {Number} tint The tint of the image
 * @property {Number} alpha The alpha of the image
 * @property {Number} height The height of the image
 * @property {Number} width The width of the image
 */

 /**
  * A class representing an image UI component
  * @extends ElonaJS.UI.Components.UniComponent
  * @class
  * @memberOf ElonaJS.UI.Components
  * @property {ImageParams} _default The default parameters for the image
  * @property {ImageParams} params The parameters of the image
  */
class Image extends UniComponent{
    /**
     * @param {ImageParams} params The parameters of the image
     */
    constructor(params){
        super(params);
        this.sprite = Graphics.Spriting.GetImage(this.params);
    }

    Scale(scale){
        if(this.params.height !== undefined){
            this.sprite.height = this.params.height * scale;
            this.sprite.width = this.params.width * scale;
        } else{
            this.sprite.scale.x = scale;
            this.sprite.scale.y = scale;
        }
    }

    SetImage(id){
        this.sprite.setTexture(DB.Graphics.Get(id));
    }
}

Image.prototype._default = {
    type: "image",
    alignment: "relative",
    position: {x: 0, y: 0, z: 2},
    alpha: 1
};

module.exports = Image;
},{"./unicomponent.js":27}],19:[function(require,module,exports){
class MultiComponent{
    constructor(params){
        this.params = $.extend(true, {}, this._default, params);
        this.id = params.id;
        this.set = {};
    }

    Align(base){
        for(let i = 0, keys = Object.keys(this.set); i < keys.length; i++){
            this.set[keys[i]].Align(base);
        }
    }

    Attach(menu, collection){
        let ns = menu._SetCollection(collection);
        ns[this.id] = this;
        for(let i = 0, keys = Object.keys(this.set); i < keys.length; i++){
            menu.container.addChild(this.set[keys[i]].sprite);
        }
    }

    Hide(){
        for(let i = 0, keys = Object.keys(this.set); i < keys.length; i++){
            this.set[keys[i]].Hide();
        }
    }

    Scale(scale){
        for(let i = 0, keys = Object.keys(this.set); i < keys.length; i++){
            this.set[keys[i]].Scale(scale);
        }
    }

    Show(){
        for(let i = 0, keys = Object.keys(this.set); i < keys.length; i++){
            this.set[keys[i]].Show();
        }
    }


}

module.exports = MultiComponent;
},{}],20:[function(require,module,exports){
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
},{"./multicomponent.js":19}],21:[function(require,module,exports){
let MultiComponent = require("./multicomponent.js");

/**
 * @typedef OptionListSettings
 * @property {Number} spacing The vertical space between each option
 * @property {String} alignment How the option list is aligned in the menu
 * @property {Boolean} optionloop Whether to wrap back to the beginning when moving past the last option
 * @property {Boolean} pageloop Whether to wrap back to the beginning when moving past the last page
 * @property {Point2D} position The starting position of the list (relative to alignment)
 * @property {Number} perpage The maximum number of options per page
 */


/**
 * A class that hold an array of options for menus.
 * @property {OptionListSettings} settings The settings for the menu
 */
class OptionList extends MultiComponent{
    constructor(menu){
        super({id: "option_list"});
        this.current = 0;
        this.page = 0;
        this.list = [];
        this.settings = Object.assign({}, this._defaultList);
        this.style = $.extend(true, {}, this._defaultStyle);
        this.menu = menu;
        this.init = false;
        menu.components.OptionList = this;
    }

    PageUp(){
        let tpm = this.page * this.settings.perpage + this.settings.perpage - 1;
        if(this.list.length > tpm){
            this.page++;
            (this.current + this.settings.perpage >= this.list.length ? this.current = this.list.length - 1 : this.current += this.settings.perpage);
            this.Build();
            this.UpdateSelector();
        } else {
            if(this.settings.pageloop){
                this.current = this.current % this.settings.perpage;
                this.page = 0;
                this.Build();
                this.UpdateSelector();
            }
        }
    }

    PageDown(){
        if(this.page > 0){
            this.page--;
            this.current -= this.settings.perpage;
            this.Build();
            this.UpdateSelector();
        } else {
            if(this.settings.pageloop){
                this.page = this.GetMaxPages() - 1;
                this.current += this.page * this.settings.perpage;
                if(this.current >= this.list.length) this.current = this.list.length - 1;
                this.Build();
                this.UpdateSelector();
            }
        }
    }



    AlignSelector(base){
        this.set.Selector.Align(base);
        this.set.Selector.Scale(Graphics.Scale());
        this.set.Diamond.Align(base);
        this.set.Diamond.Scale(Graphics.Scale());
    }

    Customize(params){
        this.settings = Object.assign({}, this._defaultList, params);
    }

    Build(){
        let numO = this.list.length;
        let listM = this.settings.perpage;

        let strO = this.page * this.settings.perpage;
        let endO = Math.min(this.page * this.settings.perpage + this.settings.perpage, numO);
        
        for(let i = strO; i < endO; i++){
            if(!this.list[i].built) this.list[i] = $.extend(true, {}, this._defaultStyle, this.list[i]);
            let ostr = "Option_" + (i-strO);

            this.list[i].keytext.text = String.fromCharCode(97+(i-strO));
            this.list[i].position.x = this.settings.position.x; this.list[i].position.y = this.settings.position.y + this.settings.spacing * (i-strO);
            this.list[i].id = ostr;
            this.list[i].alignment = this.settings.alignment;

            if(!this.set[ostr]){
                this.set[ostr] = new UI.Components.Option(this.list[i], this.menu);
            } else {
                this.set[ostr].Reset(this.list[i]);
                this.set[ostr].Show();
            }
        }

        for(let i = 0; i < this.settings.perpage; i++){
            if(this.set["Option_" + i] && i >= (endO - strO)){
                this.set["Option_" + i].Hide();
            }
        }

        if(!this.init && numO > 0){
            this.set.Selector = new UI.Components.Rect({id: "Selector", color: 0xFFFFFF, alpha: 0.8, height: 15, position: {x: this.settings.position.x, y: this.settings.position.y},width: this.set["Option_0"].GetActualWidth() + 30});
            this.set.Selector.Attach(this.menu);
            this.set.Diamond = new UI.Components.Image({id: "Diamond", img: "interface.selector", position: {x: this.settings.position.x + this.set["Option_0"].GetActualWidth() + 5, y: this.settings.position.y + 3, z: 5}});
            this.set.Diamond.Attach(this.menu);
            this.init = true;
        }
    }

    Set(list){
        this.list = list;
    }

    GetCurrent(){
        return this.current;
    }

    GetCurrentItem(){
        return this.set["Option_" + (this.current % this.settings.optperpage)];
    }

    GetCurrentOption(){
        return this.list[this.current];
    }

    GetPage(){
        return this.page + 1;
    }

    GetMaxPages(){
        return Math.ceil(this.list.length / this.settings.perpage);
    }

    OptionUp(){
        /* Cases:
            1: No multi-page, top option.
            2: Multi-page, top option.
            3: No multi page, not top option.
            4: Multi-page, not top option."
        */

        let numpage = Math.ceil(this.list.length / this.settings.perpage);

        if(this.current % this.settings.perpage == 0){
            if(this.settings.optionloop) this.current = Math.min(((this.page + 1) * this.settings.perpage) - 1, this.list.length - 1);
        } else {
            this.current--;
        }

        this.UpdateSelector();
    }

    OptionDown(){
        let numpage = Math.ceil(this.list.length / this.settings.perpage);

        if(this.current % this.settings.perpage == this.settings.perpage - 1 || this.current == this.list.length -1){
            if(this.settings.optionloop) this.current = this.page * this.settings.perpage;
        } else {
            this.current++;
        }

        this.UpdateSelector();
    }

    UpdateSelector(){
        if(this.init){
            let opt = this.set["Option_" + (this.current % this.settings.perpage)];
            this.set.Selector.SetBasePosition(opt.GetBasePosition().x, opt.GetBasePosition().y);
            this.set.Selector.SetBaseWidth(opt.GetActualWidth()+30);
            this.set.Diamond.SetBasePosition(opt.GetBasePosition().x + opt.GetActualWidth() + 5, opt.GetBasePosition().y + 3);
        }
    }
}


OptionList.prototype._defaultList = {
    spacing: 20,
    alignment: "relative",
    optionloop: true,
    pageloop: true,
    position: {x: 0, y: 0},
    perpage: 10,
}

OptionList.prototype._defaultStyle = {
    keyimage: {
        enabled: true,
        img: "interface.option",
        z: 3,
        offset: {x: -35, y: -2}
    },
    keytext: {
        enabled: true,
        color: "white",
        offset: {x: -32, y: -2},
        outline: {color: "black", size: 3},
        z: 5,
        size: 14
    },
    text: {
        offset: {x: 0, y: 0},
        color: "black",
        z: 5
    },
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
    position:{
        x: 0,
        y: 0
    },
    built: true
}

module.exports = OptionList;
},{"./multicomponent.js":19}],22:[function(require,module,exports){
let MultiComponent = require("./multicomponent.js");

class PaperFooter extends MultiComponent{
    constructor(params){
        super(params);
        let pos = params.position;
        this.set.Text = new UI.Components.Text($.extend(true, {position: {x: pos.x + 25, y: pos.y + 2}, id: "Text", z: 5}, params.text));
        this.set.Rect = new UI.Components.Rect($.extend(true, {position: {x: pos.x + 20, y: pos.y}, color: 0xC2AA92, id: "Rect", z: 4}, params.rect));
        this.set.Image = new UI.Components.Image($.extend(true, {position: {x: pos.x, y: pos.y}, img: "interface.icon_bulb", id: "Image", z: 3}, params.image));
    }
}

module.exports = PaperFooter;
},{"./multicomponent.js":19}],23:[function(require,module,exports){
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
},{"./multicomponent.js":19}],24:[function(require,module,exports){
let UniComponent = require("./unicomponent.js");

/**
 * Parameters that define a rectangle component
 * @typedef RectParams
 * @property {Point3D} position The position of the rectangle
 * @property {Number} [height=1] The height of the rectangle
 * @property {Number} width The width of the rectangle
 * @property {Number} [alpha=1] The opacity of the rectangle
 * @property {Number} [color=0x000000] The color of the rectangle
 * @property {String} [alignment="relative"] The alignment of the rectangle
 */

/**
  * A class representing a rectangle UI component
  * @extends ElonaJS.UI.Components.UniComponent
  * @class
  * @memberOf ElonaJS.UI.Components
  * @property {RectParams} _default The default parameters for a rectangle.
  * @property {RectParams} params The parameters of the Rect
  */
class Rect extends UniComponent{
    /**
     * @param {RectParams} params The parameters for the rectangle 
     */
    constructor(params){
        super(params);
        this.sprite = Graphics.Spriting.GetRect(this.params);
    }
}

Rect.prototype._default = {
    color: 0x000000, 
    alignment: "relative", 
    height: 1, 
    position: {x: 0, y: 0, z: 3},
    alpha: 1
};

module.exports = Rect;
},{"./unicomponent.js":27}],25:[function(require,module,exports){
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
},{"./multicomponent.js":19}],26:[function(require,module,exports){
let UniComponent = require("./unicomponent.js");

/**
 * @typedef Outline
 * @property {Number} color The color of the outline
 * @property {Number} size The size of the outline
 */

/**
 * @typedef Point3D
 * @property {Number} x X-Position
 * @property {Number} y Y-Position
 * @property {Number} z Z-position (or level)
 */

/**
 * @typedef TextWrap
 * @property {Number} width The maximum width of the line
 */

/**
 * Parameters that define a text component
 * @typedef TextParams
 * @property {Point3D} [position] The position of the text. Default: 0, 0, 5
 * @property {Outline} [outline] Outline parameters of the text.
 * @property {TextWrap} [wrap] Text-wrapping parameters of the text.
 * @property {Number} [alpha=1] The opacity of the text
 * @property {Number} [color=0x000000] The color of the text
 * @property {Number} [size=12] The font-size of the text
 * @property {String} [alignment="relative"] The alignment of the text
 * @property {String} [text] The text to display
 * @property {String} [i18n] The identifier of the text
 * @property {String} [weight] The weight of the text
 * @property {Boolean} [centered] Whether the object is centered on the position
 */

/**
  * A class representing a text UI component
  * @extends ElonaJS.UI.Components.UniComponent
  * @class
  * @memberOf ElonaJS.UI.Components
  * @property {TextParams} _default The default parameters for a text
  * @property {TextParams} params The parameters of the text
  */
class UIText extends UniComponent {
    /**
     * @param {TextParams} params The parameters for the rectangle 
     */
    constructor(params){
        super(params);
        this.sprite = Graphics.Spriting.GetText(this.params);
        if(this.params.i18n) this.sprite.text = i18n(this.params.i18n);
    }

    Scale(scale){
        this.sprite.style.fontSize = this.params.size * scale;
        if(this.params.i18n) this.sprite.text = i18n(this.params.i18n);
        if(this.params.wrap){
            this.sprite._style._wordWrapWidth = this.params.wrap.width * scale
        }
    }

    SetText(str){
        this.sprite.text = str;
    }

    UpdateStyle(obj){
        this.sprite.setStyle(Object.assign(this.sprite._style, obj));
    }
}

UIText.prototype._default = {
    type: "text", 
    alignment: "relative", 
    color: 0x000000,
    position: {x: 0, y: 0, z: 5},
    size: 12,
    alpha: 1
};

module.exports = UIText;
},{"./unicomponent.js":27}],27:[function(require,module,exports){
'use strict'

/**
 * @typedef Point2D
 * @property {Number} x X-position
 * @property {Number} y Y-Position
 */

/**
 * @class
 * @classdesc A class that describes a single UI component (text, image, etc.)
 * @property {Object} params A collection of parameters for the component
 * @property {String} id The ID of the component
 * @property {PIXI.Sprite} sprite The component's sprite
 * @property {ElonaJS.UI.Menus.BaseMenu} menu The menu the component is attached to
 * @memberOf ElonaJS.UI.Components
 */
class UniComponent{
    constructor(params){
        this.params = $.extend(true, {}, this._default, params);
        this.id = params.id;
    }

    /** Aligns the component based on the parameters and scaling.
     * @param {Number[]} base The base position of the menu to align on.
     */
    Align(base){
        //let dims = Graphics.Dims();
        let dims = {x: 800, y: 600};
        let point = {x: 0, y: 0};
        let opt = this.params;

        switch(opt.alignment){
            case "relative": point = base; break;
            case "bottom-left": point.y = dims.y; break;
            case "bottom-right": point.y = dims.y; point.x = dims.x; break;
            case "top-right": point.x = dims.x; break;
            case "fill": this.sprite.width = dims.x; this.sprite.height = dims.y; this.sprite.left = 0; this.sprite.top = 0; break;
        }

        this.sprite.position.set(point.x + opt.position.x * Graphics.Scale(), point.y + opt.position.y * Graphics.Scale());

        if(opt.centered && opt.position.x !== undefined){
            if(opt.centerx) this.sprite.position.x = point.x + opt.centerx * Graphics.Scale();
            this.sprite.position.x -= this.sprite.width / 2;
        }
    }

    /**
     * Attaches the component to a menu
     * @param {ElonaJS.UI.Menus.BaseMenu} menu The menu to attach to 
     */
    Attach(menu, collection){
        let ns = menu._SetCollection(collection);
        ns[this.id] = this;
        menu.container.addChild(this.sprite);
        this.menu = menu;
    }

    /** Destroys the UI component. */
    Destroy(){
        if(this.menu) this.menu.DestroyComponent(this);
        else this.sprite.destroy();
    }

    /** Returns the position of the component before scaling.
     * @returns {Point2D}
     */
    GetBasePosition(){
        return {x: this.params.x, y: this.params.y}
    }

    /** Returns the post-scaling height of the component.
     * @returns {Number}
     */
    GetActualHeight(){
        return this.sprite.height;
    }

    /** Returns the position of the sprite post-scaling
     * @returns {Point2D}
     */
    GetActualPosition(){
        return this.sprite.position;
    }

    /** Returns the post-scaling width of the component.
     * @returns {Number}
     */
    GetActualWidth(){
        return this.sprite.width;
    }

    /** Returns the base height (before scaling) of the component
     * @returns {Number}
     */
    GetBaseHeight(){
        return this.params.height;
    }

    /** Returns the base width (before scaling) of the component
     * @returns {Number}
     */
    GetBaseWidth(){
        return this.params.width;
    }

    /** Returns the x value of the component's right edge
     * @returns {Number}
     */
    GetRight(){
        return this.sprite.position.x + this.sprite.width;
    }

    /** Hides the component's sprite. */
    Hide(){
        this.sprite.visible = false;
    }

    Refresh(params){
        this.params = Object.assign(this.params, params);
        if(this._Refresh) this._Refresh();
    }

    /** Modifies the base width of the component (before scaling)
     * @param {Number} w The width to set
     */
    SetBaseWidth(w){
        this.params.width = w;
    }

    /** Scales the element based on a scaling factor.
     * @param {Number} scale The scaling factor
     */
    Scale(scale){
        this.sprite.height = this.params.height * scale;
        this.sprite.width = this.params.width * scale;
    }

    /** Modifies the base x position of the component (before scaling) 
     * @param {Number} x The x position to set
    */
    SetBaseX(x){
        this.params.position.x = x;
    }

    /** Modifies the base y position of the component (before scaling) 
     * @param {Number} y The y position to set
    */
    SetBaseY(y){
        this.params.position.y = y;
    }

    /** Modifies the pivot of the component
     * @param {Number} x The x position to pivot on
     * @param {Number} y The y position to pivot on
    */
    SetPivot(x, y){
        this.sprite.pivot.set(x, y);
    }

    /** Modifies the base position of the component (before scaling)
     * @param {Number} x The x position to set
     * @param {Number} y The y position to set
     */
    SetBasePosition(x, y){
        this.params.position.x = x;
        this.params.position.y = y;
    }

    /** Shows the component's sprite. */
    Show(){
        this.sprite.visible = true;
    }

}

module.exports = UniComponent;
},{}],28:[function(require,module,exports){
'use strict'

/**
 * A collection of Menus used in the game.
 * @namespace ElonaJS.UI.Menus
 * @memberOf ElonaJS.UI
 */
let Menus = {
    LoadingScreen: require("./loadingscreen.js"),
    TitleScreen: require("./titlescreen.js"),
    RaceSelect: require("./raceselect.js")
}

module.exports = Menus;
},{"./loadingscreen.js":30,"./raceselect.js":31,"./titlescreen.js":32}],29:[function(require,module,exports){
'use strict'

/**
 * @class
 * @classdesc A base menu object to extend for menus in the game.
 * @memberOf ElonaJS.UI.Menus
 */
class BaseMenu{
    constructor(){
        this.sounds = {
            cursor: "cursor1",
            select: "ok1",
            page: "pop1"
        };
        this.components = {};
        this.position = {x: 0, y: 0};
        this.container = new PIXI.Container();
        this.size = {w: 0, h: 0};
        this.init = false;
        this.centered = false;
        this.options = null;
    }

    AddSprite(sprite){
        this.container.addChild(sprite);
    }

    AlignElements(clist){
        if(!clist) clist = this.components;
        let elist = Object.keys(clist);
        for(let i = 0; i < elist.length; i++){
            let elem = clist[elist[i]];
            if(elem.Align) elem.Align(this.position);
            else if (typeof elem == "object") this.AlignElements(elem);
        }
    }

    Customize(params){
        Object.assign(this, params);
    }

    DestroyComponent(comp){
        this.container.children.splice(this.container.children.indexOf(comp.sprite), 1);
        comp.sprite.destroy();
    }

    KeyPress(key){
        switch(key){
            case "key_up":
                this.options.OptionUp();
                this.options.AlignSelector(this.position);
                this._PlaySound(this.sounds.cursor);
                if(this._PreviewData) this._PreviewData();
                break;

            case "key_down":
                this.options.OptionDown();
                this._PlaySound(this.sounds.cursor);
                this.options.AlignSelector(this.position);
                if(this._PreviewData) this._PreviewData();
                break;

            case "key_enter":
                if(this._OnSelect) this._OnSelect();
                this._PlaySound(this.sounds.select);
                break;

            case "key_back":
                if(this._OnBack) this._OnBack();
                break;
            case "key_left":
                this.options.PageDown();
                this._PlaySound(this.sounds.page);
                this.options.AlignSelector(this.position);
                if(this._PreviewData) this._PreviewData();
                if(this.components.PageNum) this.components.PageNum.SetText(i18n("ui.Page", {cur: this.options.GetPage(), max: this.options.GetMaxPages()}));
                break;
            case "key_right":
                this.options.PageUp();
                this._PlaySound(this.sounds.page);
                this.options.AlignSelector(this.position);
                if(this._PreviewData) this._PreviewData();
                if(this.components.PageNum) this.components.PageNum.SetText(i18n("ui.Page", {cur: this.options.GetPage(), max: this.options.GetMaxPages()}));
                break;
        }
    }

    _PlaySound(val){
        if(val) ElonaJS.Audio.PlaySound(val);
    }

    Setup(params){
        this._UpdateBase();
        if(!this.options) this.options = new UI.Components.OptionList(this);
        if(this._OnLoad) this._OnLoad(params);
        this.options.Build();
        this.options.UpdateSelector();
        this._SortElements();
        this.AlignElements();

        if(this._PreviewData) this._PreviewData();
        
        
        /*

        if(!this.container.rightclick){
            this.container.interactive = true;

            this.container.rightclick = (e) =>{
                if(this._OnBack) this._OnBack();
            }
        }
        this.ScaleElements();
            */  
    }

    _SetCollection(id){
        if(!id) return this.components;
        let parts = id.split('.');
        let ns = this.components;

        for(let i = 0; i < parts.length; i++){
            if(!ns[parts[i]]) ns[parts[i]] = {};
            ns = ns[parts[i]]; 
        }

        return ns;
    }

    _SortElements(){
        this.container.children.sort(function(a,b){
            return a.z - b.z;
        });
    }

    _UpdateBase(){
        if(this.centered){
            let dims = {x: 800, y: 600};
            this.position.x = (dims.x - this.size.w) / 2;
            this.position.y = (dims.y - this.size.h) / 2;
        }
    }
}

module.exports = BaseMenu;
},{}],30:[function(require,module,exports){
'use strict'

let BaseMenu = require("./basemenu.js");

/**
 * The loading screen.
 * @name LoadingScreen
 * @type ElonaJS.UI.Menus.BaseMenu
 * @memberOf ElonaJS.UI.Menus
 */
let LoadingScreen = new BaseMenu();

LoadingScreen._OnLoad = function(){
    if(this.init){
        this.components.lg.SetBaseX(this.components["Header"].GetActualWidth() + 23);
        this.components.lg.SetBaseY(35);
        this.container.alpha = 1;
        this._ClearMessages();
        return;
    }

    this.init = true;
    this.num_messages = 0;
            
    new UI.Components.Text({id: "Header", text: "ElonaJS Ver." + ElonaJS.ver, position: {x: 0, y: 25, z: 2}, size: 24, color: "white", alignment: "top-left"}).Attach(this);
    new UI.Components.Rect({id: "BG", position: {z: 0}, width: 800, height: 600, color: "black", alignment: "fill"}).Attach(this);
    new UI.Components.Image({id: "lg", position: {x: this.components["Header"].GetActualWidth() + 23, y: 35, z: 1}, img: "loadlg", alignment: "top-left"}).Attach(this);
    new UI.Components.Rect({id: "Bar", position: {y: 55, z: 1}, width: this.components["Header"].GetActualWidth()+50, height: 5, color: "0xFFFFFF", alignment: "top-left"}).Attach(this);

    this.components.lg.SetPivot(9, 17);
    App.ticker.add(this._Animate, this);
}


LoadingScreen._Animate = function(){
    this.components.lg.sprite.rotation += 0.2;
}

LoadingScreen._OnExit = function(){
    App.ticker.remove(this._Animate, this);
}


module.exports = LoadingScreen;
},{"./basemenu.js":29}],31:[function(require,module,exports){
let BaseMenu = require("./basemenu.js");

/**
 * The race select menu.
 * @name RaceSelect
 * @type ElonaJS.UI.Menus.BaseMenu
 * @memberOf ElonaJS.UI.Menus
 */
let RaceSelect = new BaseMenu();

RaceSelect.Customize({centered: true, size: {w: 720, h: 500}});
RaceSelect.sounds.select = "spell";

RaceSelect._OnLoad = function(){
    if(this.init){
        this.options.current = 0;
        this.options.page = 0;
        return;
    }

    this.bgcur = 3;
    this.bgcounter = 0;
    this.init = true;

    new UI.Components.Image({id: "Background", img: "void", alignment: "fill", position: {z: -1}}).Attach(this);
    new UI.Components.Image({id: "Paper", img: "interface.paper", width: 720, height: 500, shadow: {distance: 10, blur: 0}, position: {z: 0}}).Attach(this);
    new UI.Components.Image({id: "BG_Deco", img: "cbg3", position: {x: 30, y: 40, z: 1}, width: 290, height: 430, alpha: 0.2}).Attach(this);
    new UI.Components.Text({id: "Desc", position: {x: 210, y: 70}, wrap: {width: 460, spacing: 16}, text: ""}).Attach(this);
    new UI.Components.Text({id: "Help", alignment: "bottom-left", i18n: "hints.help", position: {x: 30, y: -22}}).Attach(this);
    new UI.Components.Text({id: "PageNum", position: {x: 640, y: 475}, size: 10}).Attach(this);
    new UI.Components.Image({id: "CPrev1", img: "character.1", position: {x: 300, y: 45, z: 3}, alpha: 0.2, scale: 2}).Attach(this);
    new UI.Components.Image({id: "CPrev2", img: "character.2", position: {x: 444, y: 45, z: 3}, alpha: 0.2, scale: 2}).Attach(this);

    new UI.Components.PaperHeader({
        id: "Race",
        text: {i18n: "ui.raceselect.title"}
    }).Attach(this);

    new UI.Components.PaperFooter({
        id: "Hint",
        position: {x: 35, y: 470},
        rect: {width: 625},
        text: {i18n: "hints.3b"}
    }).Attach(this);

    new UI.Components.SectionHeader({
        id: "Races",
        position: {x: 35, y: 40},
        text: {i18n: "ui.raceselect.section1"}
    }).Attach(this);

    new UI.Components.SectionHeader({
        id: "Details",
        position: {x: 205, y: 40},
        text: {i18n: "ui.raceselect.section2"}
    }).Attach(this);

    new UI.Components.SectionHeader({
        id: "AttributeBonuses",
        position: {x: 205, y: 205},
        text: {i18n: "ui.raceselect.section3"}
    }).Attach(this);

    new UI.Components.SectionHeader({
        id: "TrainedSkills",
        position: {x: 205, y: 285},
        text: {i18n: "ui.raceselect.section4"}
    }).Attach(this);

    new UI.Components.Guide({
        position: {x: 0, y: 0},
        id: "Guide",
        text: {i18n: "ui.raceselect.guide"}
    }).Attach(this);


    let attb = i18n("ui.raceselect.attributes").split(",");

    for(let i = 0; i < attb.length; i++){
        let val = attb[i];

        new UI.Components.Image({id: val, img: "interface.icon_" + val, position: {x: 210 + 130 * (i%3), y: 225 + 19 * Math.floor(i/3), z: 3}}).Attach(this, "attb_icons");
        new UI.Components.Text({id: val, position: {x: 230 + 130 * (i%3), y: 225 + 19 * Math.floor(i/3)}}).Attach(this, "attb_text");
    }

    this._BuildList();
    this.components.PageNum.SetText(i18n("ui.Page", {cur: this.options.GetPage(), max: this.options.GetMaxPages()}));
/*     
 
    this.AttachGuide({id: "Guide", text: "Welcome, traveler. I've been looking for you.", ref: "Sys_17"});*/

}

RaceSelect._BuildList = function(){
    if(!this.races) this.races = DB.Races.Search({playable: true});
    if(!this.csheet) this.csheet = DB.Graphics.GetByID("character").exceptions;
    let races = this.races;
    let opt = [];

    for(let i = 0; i < races.length; i++){
        let no = {text:{}, preview: {}};
        no.text.i18n = races[i].name;
        no.preview.desc = races[i].description;
        no.preview.pic1 = races[i].pic.female;
        no.preview.pic2 = races[i].pic.male;
        no.preview.race = races[i];
        opt.push(no);
    }

    this.options.Customize({
        position: {x: 75, y: 70},
        perpage: 20
    });

    this.options.Set(opt);
}

RaceSelect._PreviewData = function(){
    let op = this.options.GetCurrentOption();
    this.components.Desc.SetText(i18n(op.preview.desc));
    this.components.CPrev1.SetImage("character." + op.preview.pic1);
    this.components.CPrev2.SetImage("character." + op.preview.pic2);

    if(this.csheet[op.preview.pic1]){
        let offset = (this.csheet[op.preview.pic1].offY ? this.csheet[op.preview.pic1].offY : 0);
        this.components.CPrev1.SetBasePosition(300, 135 - this.components.CPrev1.GetActualHeight() - offset);
        this.components.CPrev2.SetBasePosition(444, 135 - this.components.CPrev2.GetActualHeight() - offset);
    } else {
        this.components.CPrev1.SetBasePosition(300, 45);
        this.components.CPrev2.SetBasePosition(444, 45);
    }

    this._FormatAttributes();
    this._FormatSkills();

    this.bgcounter++;

    if(this.bgcounter > 3){
        this.bgcounter = 0;
        (this.bgcur < 8 ? this.bgcur++ : this.bgcur = 1);
        this.components.BG_Deco.SetImage("cbg" + this.bgcur);
    }

    this.AlignElements();
}

RaceSelect._FormatAttributes = function(){
    let op = this.options.GetCurrentOption();
    let attb = op.preview.race.base_attributes;
    let atbStr = i18n("attributes.magnitude");

    for(let i = 0, arr = Object.keys(attb); i < arr.length; i++){
        let val = arr[i].toLowerCase();

        if(this.components.attb_text[val]){
            let str;
            let style = {fill: "black"};
     
            if (attb[arr[i]] == 0){str = i18n("attributes.magnitude.none"); style.fill = "rgb(120, 120, 120)";} else
            if (attb[arr[i]] > 13){str = i18n("attributes.magnitude.best"); style.fill = "rgb(0, 0, 200)";} else
            if (attb[arr[i]] > 11){str = i18n("attributes.magnitude.great"); style.fill = "rgb(0, 0, 200)";} else
            if (attb[arr[i]] > 9){str = i18n("attributes.magnitude.good"); style.fill = "rgb(0, 0, 150)";} else
            if (attb[arr[i]] > 7){str = i18n("attributes.magnitude.not_bad"); style.fill = "rgb(0, 0, 150)";} else
            if (attb[arr[i]] > 5){str = i18n("attributes.magnitude.normal"); style.fill = "rgb(0, 0, 0)";} else
            if (attb[arr[i]] > 3){str = i18n("attributes.magnitude.little"); style.fill = "rgb(150, 0, 0)";} else
            if (attb[arr[i]] > 0){str = i18n("attributes.magnitude.slight"); style.fill = "rgb(200, 0, 0)";}

            this.components.attb_text[val].SetText(val.initCap() + ": " + str);
            this.components.attb_text[val].UpdateStyle(style);
        }
    }
}

RaceSelect._FormatSkills = function(){
    let op = this.options.GetCurrentOption();
    let attb = op.preview.race.base_skills;
    let o = 1;
    let nwep = 0;
    let wpnstr = i18n("ui.raceselect.wepprefix");

    for(let i = 0, arr = Object.keys(attb); i < arr.length; i++){
        let val = arr[i];
        let skill = DB.Skills.GetByID(val);
        
        if(skill.type == "weapon"){
            if(nwep > 0) wpnstr += ", ";
            wpnstr += i18n(skill.name).initCap();
            nwep++;
            continue;
        }

        if(!this.components.SkillText){
            this.components.SkillText = {};
            this.components.SkillDesc = {};
            this.components.SkillImages = {};
        }

        if(this.components.SkillText[o]){
            this.components.SkillText[o].SetText(i18n(skill.name).initCap());
            this.components.SkillDesc[o].SetText(i18n(skill.desc1));
            this.components.SkillImages[o].SetImage("interface.icon_" + skill.attr.toLowerCase());
        } else{
            new UI.Components.Text({id: o, i18n: skill.name, position: {x: 230, y: 310 + 16 * o}}).Attach(this, "SkillText");
            this.components.SkillText[o].SetText(i18n(skill.name).initCap());
            new UI.Components.Text({id: o, i18n: skill.desc1, position: {x: 340, y: 310 + 16 * o}}).Attach(this, "SkillDesc");
            new UI.Components.Image({id: o, img: "interface.icon_" + skill.attr.toLowerCase(), position: {x: 210, y: 310 + 16 * o, z: 3}}).Attach(this, "SkillImages");
        }

        o++;
    }

    if(!this.components.SkillText[0]){
        new UI.Components.Text({id: "0", text: wpnstr, position: {x: 230, y: 310}}).Attach(this, "SkillText");
        new UI.Components.Image({id: "0", img: "interface.icon_str", position: {x: 210, y: 310, z: 3}}).Attach(this, "SkillImages");
    } else {
        this.components.SkillText[0].SetText(wpnstr);
    }

    for(let i = 1, arr = Object.keys(this.components.SkillText); i < arr.length; i++){        
        if(i < o){
            this.components.SkillText[i].Show();
            this.components.SkillDesc[i].Show();
            this.components.SkillImages[i].Show();
        } else {
            this.components.SkillText[i].Hide();
            this.components.SkillDesc[i].Hide();
            this.components.SkillImages[i].Hide();
        }
    }
}

module.exports = RaceSelect;



/*     menu._OnSelect = function(){
        this.active.race = this.options.list[this.options.current].val;
        Graphics.UnloadMenu(this);
        if(this.creation){
            Menus.GenderSelect.SetParameters(this.active, true);
            Graphics.LoadMenu("GenderSelect");
        }
    }

    return menu;
})(); */
},{"./basemenu.js":29}],32:[function(require,module,exports){
'use strict'

let BaseMenu = require("./basemenu.js");

/**
 * The title screen
 * @name TitleScreen
 * @type ElonaJS.UI.Menus.BaseMenu
 * @memberOf ElonaJS.UI.Menus
 */
let TitleScreen = new BaseMenu();
TitleScreen.position = {x: 80, y: 150};

TitleScreen._OnLoad = function(){
    //UI.RipplesOn();
    ElonaJS.Audio.PlayTrack("orc01");

    if(this.init) return;
    this.init = true;

    new UI.Components.Image({id: "Paper", img: "interface.paper", height: 300, width: 300, shadow: {distance: 10}, position: {z: 0}}).Attach(this);
    new UI.Components.Image({id: "BG_Deco", img: "cbg3", position: {x: 10, y: 30, z: 1}, width: 280, height: 240, alpha: 0.2}).Attach(this);
    new UI.Components.Text({id: "Elona", text: "Elona developed by Noa", alignment: "top-left", position: {x: 10, y: 4}, color: "white"}).Attach(this);
    new UI.Components.Text({id: "ElonaJSVer", text: "ElonaJS Version: " + ElonaJS.ver, alignment: "top-left", position: {x: 10, y: 36}, color: "white"}).Attach(this);
    new UI.Components.Text({id: "Contrib", text: "Elona Contributors: f1r3fly, Sunstrike, Schmidt, Elvenspirit / View the credits for more!", alignment: "top-left", position: {x: 10, y: 52}, color: "white"}).Attach(this);

    new UI.Components.PaperFooter({
        id: "Hint",
        rect: {width: 220},
        text: {i18n: "hints.1"},
        position: {x: 25, y: 256}
    }).Attach(this);

    new UI.Components.PaperHeader({
        id: "Menu",
        text: {i18n: "ui.startmenu.title"},
        position: {x: 25, y: 256}
    }).Attach(this);

    this.options.Customize({position: {x: 70, y: 53}, spacing: 35, perpage: 6});

    this.options.Set([
        {text: {i18n: "ui.startmenu.restore"}},
        {text: {i18n: "ui.startmenu.create"}},
        {text: {i18n: "ui.startmenu.incarnate"}},
        {text: {i18n: "ui.startmenu.homepage"}},
        {text: {text: "Options"}},
        {text: {text: "Debug Menu"}} 
    ]);
}

TitleScreen._OnSelect = function(){
    let next, op;

    switch(this.options.GetCurrent()){
        case 1: UI.UnloadMenu(this);
                UI.LoadMenu("RaceSelect")
                break;
    }

}


module.exports = TitleScreen;
},{"./basemenu.js":29}],33:[function(require,module,exports){
let UI = require("./uihandler.js");

UI.Components = require("./Components/Components.js");
UI.Menus = require("./Menus/Menus.js");


module.exports = UI;
},{"./Components/Components.js":16,"./Menus/Menus.js":28,"./uihandler.js":34}],34:[function(require,module,exports){
/**
 * @namespace ElonaJS.UI
 * @memberOf ElonaJS
 * @property {Canvas} _canvas The game's primary canvas
 * @property {Menu} _ls The loading screen menu
 * @property {Menu} _ripple The menu for title screen ripples
 * @property {PIXI.Container} _menuContainer A container to hold currently loaded menus
 * @property {Array} _menuStack An array of the currently loaded menus
 * @property {PIXI.Container} _mapContainer A container for the game map
 * @property {PIXI.Container} _masterContainer The master container for UI elements
 * @property {Menu} _weather The menu for weather effects
 */

let UI = {
    _canvas: undefined,
    _ls: undefined,
    _ripple: undefined,
    _menuContainer: new PIXI.Container(),
    _menuStack: [],
    _mapContainer: undefined,
    _masterContainer: new PIXI.Container(),
    _weather: undefined
};

/**
 * Returns the scaling factor of the UI.
 * @memberOf ElonaJS.UI
 * @name GetScale
 * @function
 * @return {Number}
 */
UI.GetScale = function(){
    return 1;
}

/**
 * Prepares the master UI container. Graphics should be initialized prior to calling.
 * @memberOf ElonaJS.UI
 * @name Init
 * @function
 */
UI.Init = function(){
    this._canvas = App.view;
    //this._ripple = UI.Menus.Ripple;
    this._ls = UI.Menus.LoadingScreen;
    //this._weather = UI.Weather; 
    //this._masterContainer.addChild(this._weather.container);
    this._masterContainer.addChild(this._menuContainer);
    this._masterContainer.addChild(this._ls.container);
    //this._masterContainer.addChild(this._mapContainer); */
    App.stage.addChild(this._masterContainer);
}

/**
 * Displays the loading screen
 * @memberOf ElonaJS.UI
 * @name ShowLS
 * @function
 */
UI.ShowLS = function(){
    this._ls.Setup();
    this._ls.container.visible = true;
}

/**
 * Loads a menu onto the top of the stack.
 * @memberOf ElonaJS.UI
 * @name LoadMenu
 * @function
 * @param {(String|Menu)} id Either the menu itself, or the menu's string identifier
 * @param {Object} params A set of parameters to pass to the loaded menu.
 */
UI.LoadMenu = function(id, params){
    let menu = (typeof id == "string" ? UI.Menus[id] : id);
    this._PushMenu(menu);
    menu.Setup(params);
}

UI.MenuUp = function(){
    return this._menuStack.length > 0;
}

UI.TopMenu = function(){
    if(this.MenuUp()) return this._menuStack[0];
    else return null;
}

/**
 * Unloads a menu, regardless of its location in the stack.
 * @memberOf ElonaJS.UI
 * @name UnloadMenu
 * @function
 * @param {(String|Menu)} id Either the menu itself, or the menu's string identifier
 */
UI.UnloadMenu = function(id){
    let menu = (typeof id == "string" ? UI.Menus[id] : id);
    this._PopMenu(menu);
}


/**
 * Removes a menu from the stack.
 * @memberOf ElonaJS.UI
 * @name _PopMenu
 * @function
 * @private
 * @param {Menu} menu The menu to remove
 */
UI._PopMenu = function(menu){
    if(this._menuStack.indexOf(menu) != (-1)){
        this._menuStack.splice(this._menuStack.indexOf(menu), 1);
    }
    if(this._menuContainer.children.indexOf(menu.container) != (-1)){
        this._menuContainer.removeChildAt(this._menuContainer.children.indexOf(menu.container));
    } 
}

/**
 * Adds a menu to the top of the stack.
 * @memberOf ElonaJS.UI
 * @name _PushMenu
 * @function
 * @private
 * @param {Menu} menu The menu to remove
 */
UI._PushMenu = function(menu){
    menu.container.visible = true;
    this._menuStack.unshift(menu);
    this._menuContainer.addChild(menu.container);
}

/**
 * Resets the elements of the UI within the master container.
 * @memberOf ElonaJS.UI
 * @name _ResetContainers
 * @function
 * @private
 */
UI._ResetContainers = function(){
    while(this._masterContainer.children.length > 0) this._masterContainer.removeChildAt(0);
    this._masterContainer.addChild(this._ls.container);
    this._masterContainer.addChild(this._menuContainer);
    this._masterContainer.addChild(this._weather.container);
    //this._masterContainer.addChild(this._mapContainer);
}



/* 






Manager.RipplesOn = function(){
    this._ripple.Init();
}

Manager.RipplesOff = function(){
    this._ripple.Stop();
}

Manager.ShowLS = function(){
    this._ls.Setup();
    this._ls.container.visible = true;
}

Manager.HideLS = function(fade){
     if(fade){
        Animations.Property.Alpha(this._ls.container, 1, 0, 0.01, () => {
            this._ls.container.visible = false;
        });
    } else  this._ls.container.visible = false;
}

Manager.Resize = function(){
    this._SetResolution();
    this._ResizeCanvas();
    
    
    for(let i = 0; i < this._menuStack.length; i++) if(this._menuStack[i].Resize) this._menuStack[i].Resize();
    UI.Menus.Ripple.Resize();
}

Manager.MenuUp = function(){
    return this._menuStack.length > 0;
}

Manager.TopMenu = function(){
    if(this.MenuUp()) return this._menuStack[0];
    else return null;
}

Manager._SetResolution = function(){
    let dims = Utils.Parse.Dim2DInt(Settings.GetByID("canvas_resolution").value);

    if(Settings.GetByID("adaptive_res").value == false){
        Engine.renderer.resize(dims[0], dims[1]);
        this._canvas.width = dims[0];
        this._canvas.height = dims[1];
    } else {
        Engine.renderer.resize(parseInt(this._canvas.style.width), parseInt(this._canvas.style.height));
    }
}

Manager._ResizeCanvas = function(){
    let dims = Utils.Parse.Dim2DInt(Settings.GetByID("canvas_size").value);

    if(Settings.GetByID("adaptive_res").value == false){
        if(Sys.env == "node"){
            electron.ipcRenderer.send('resize', dims[0], dims[1]);
        } else {
            this._canvas.style.width = dims[0];
            this._canvas.style.height = dims[1];
        }
    } else {
        this._canvas.style.width = window.innerWidth + "px";
        this._canvas.style.height = window.innerHeight + "px";

        if(Sys.env == "node"){
            electron.ipcRenderer.send('resize', window.innerWidth, window.innerHeight);
        }
    }

    this._SetResolution();
}
 */

/*

SetLoadingScreen: function(obj){
    this._ls = obj;
    this._ls.Setup();
    this._masterContainer.addChild(this._ls.container);
},

SetMap: function(obj){
    this._mapContainer = obj.masterContainer;
    this._ResetContainers();
},

KeyToMenu: function(key){
    this._menuStack[0].KeyPress(key);
},

Resize: function(){
    this._SetCanvasRes(ElonaJS.GetSetting("canvas_resolution", true));
    this._SetCanvasSize(ElonaJS.GetSetting("canvas_size", true));
    testmap.OnMove();
    
    for(let i = 0; i < this._menuStack.length; i++) if(this._menuStack[i].Resize) this._menuStack[i].Resize();
    ElonaJS.Ripples.Resize();
},

ResetAllMenus: function(){
    for(let i = 0, keys = Object.keys(ElonaJS.UI.Menus); i < keys.length; i++){
        if(this._menuStack.indexOf(ElonaJS.UI.Menus[keys[i]]) != (-1)){
            this.UnloadMenu(keys[i]);
            ElonaJS.UI.Menus[keys[i]]._Rebuild();
            this.LoadMenu(keys[i]);
        } else ElonaJS.UI.Menus[keys[i]]._Rebuild();
    }
    
    for(let i = 0; i < this._menuStack.length; i++) this._menuStack[i].Setup();
},

NoMenu: function(){
    return this._menuStack.length == 0;
},

GetTopMenu: function(){
    return this._menuStack[0];
},

_SetCanvasRes: function(val){
    if(val && val[0]){
        Engine.renderer.resize(val[0], val[1]);
        this._canvas.width = val[0];
        this._canvas.height = val[1];
    } else {
        Engine.renderer.resize(PxToNum(this._canvas.style.width), PxToNum(this._canvas.style.height));
    }
},

_SetCanvasSize: function(val){
    if(val && val[0]){
        this._canvas.style.width = val[0];
        this._canvas.style.height = val[1];
    } else {
        this._canvas.style.width = window.innerWidth;
        this._canvas.style.height = window.innerHeight;
    }

    if(ElonaJS.GetSetting("canvas_resolution") == 0) this._SetCanvasRes();
    //ElonaJS.Graphics.Ripples.Resize();
},


}, */

module.exports = UI;
},{}],35:[function(require,module,exports){
'use strict'

/**
 * @memberOf ElonaJS
 * @property {ElonaJS.Utils.File} File A collection of File utilities
 * @namespace ElonaJS.Utils
 */
let Utils = {
    File: require("./file.js"),
    Math: require("./math.js"),
    Parse: require("./parse.js")
}

module.exports = Utils;
},{"./file.js":36,"./math.js":37,"./parse.js":38}],36:[function(require,module,exports){
(function (process){
'use strict'

let env = (typeof process === "object" ? "node" : "browser");
let fs = (env == "node" ? require("fs") : undefined);

/**
 * @namespace ElonaJS.Utils.File
 */
let file_util = {};

/**
 * Asyncronously returns and reads data from a JSON file. Will use fs in Electron and jQuery in browser.
 * @memberOf ElonaJS.Utils.File
 * @function
 * @returns {Object}
 * @name GetJSON
 */
file_util.GetJSON = async function(path){
    return new Promise((resolve, reject) => {
        if(this.env == "node"){
            fs.readFile(path, function(err, data){
                if(data) resolve(JSON.parse(data));
                else resolve(undefined);
            })
        } else {
            $.getJSON(path, function(data){
                resolve(data);
            })
        }
    })
}

/**
 * Asyncronously returns and reads a font file. Will use fs in Electron and jQuery in browser.
 * @memberOf ElonaJS.Utils.File
 * @function
 * @name GetJSON
 */
file_util.LoadFont = async function(name, path){
    return new Promise((resolve, reject) => {
        if(this.env == "node"){
            let fs = require("fs");
            fs.readFile(path, function(err, data){
                let nf = new FontFace(name, data);
                nf.load().then((loaded_face) => {document.fonts.add(loaded_face); resolve()});
            })
        } else {
            let nf = new FontFace(name, 'url(' + path + ')');
            nf.load().then(function(loaded_face){
                document.fonts.add(loaded_face);
                resolve(true);
            });
        }
    })
}

module.exports = file_util;
}).call(this,require('_process'))
},{"_process":40,"fs":39}],37:[function(require,module,exports){
/**
 * A collection of math functions
 * @namespace ElonaJS.Utils.Math
 * @name Math
 * @memberOf ElonaJS.Utils
 */
let math_util = {};

/**
 * Returns a floored random number up to a given ceiling
 * @memberOf ElonaJS.Utils.Math
 * @function
 * @param {Number} num Upper limit for the random number 
 * @returns {Number} Random number
 */
math_util.RandomFloor = function(num){
    return Math.floor(Math.random() * num);
}

/**
 * Returns the closest multiple of a divisor & base, floored.
 * @memberOf ElonaJS.Utils.Math
 * @function
 * @param {Number} divisor The number to divide by
 * @param {Number} base The number to be divided
 * @returns {Number} The nearest multiple
 */
math_util.NearestMultiple = function(divisor, base){
    return Math.floor(base/divisor);
}

module.exports = math_util;
},{}],38:[function(require,module,exports){
'use strict'

/**
 * @namespace ElonaJS.Utils.Parse
 */
let Parse = {};

/**
 * Compares two objects based on JSON.stringify
 * @memberOf ElonaJS.Utils.Parse
 * @function
 * @returns {Boolean}
 * @name ObjEq
 */
Parse.ObjEq = function(a, b){
    return JSON.stringify(a) == JSON.stringify(b);
}


module.exports = Parse;
},{}],39:[function(require,module,exports){

},{}],40:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[7]);
