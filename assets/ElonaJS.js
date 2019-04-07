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
    Attributes: new BaseDB("Attributes", ["id"], master),
    Graphics: require("./graphics.js"),
    Settings: require("./settings.js"),
    Traits: new BaseDB("Traits", ["id"], master),
    Misc: new BaseDB("Misc", ["tag"], master),
    i18n: require("./i18n.js"),
    loki: master
}

Databases.i18n.SetDB("i18n", ["id"], master);
Databases.Graphics.SetDB("graphics", ["id"], master);
Databases.Settings.SetDB("Settings", ["id"], master);

window.i18n = Databases.i18n.Get.bind(Databases.i18n);
window.i18nObj = Databases.i18n.GetObj.bind(Databases.i18n);
window.Settings = Databases.Settings;

/**
 * An asyncronous function to load game data into in-memory databases.
 * @memberOf ElonaJS.Databases
 * @name Load
 * @function
 */
Databases.Load = async function(){
    let a = await Utils.File.GetJSON("./data/data.json");
    UI.Menus.LoadingScreen.Message("Setting data...");
    this.Music.BatchLoad(a.music);
    this.Sound.BatchLoad(a.sound);
    this.Races.BatchLoad(a.races);
    this.Classes.BatchLoad(a.classes);
    this.Skills.BatchLoad(a.skills);
    this.Attributes.BatchLoad(a.attributes);
    this.Traits.BatchLoad(a.traits);
    this.Settings.BatchLoad(a.settings);
    this.Settings.InitDefault();
    this.Misc.BatchLoad(a.misc);

    UI.Menus.LoadingScreen.Message("Loading locale...");
    await this.i18n.LoadFromJSON("./locale/en.json");
    UI.Menus.LoadingScreen.Message("Loading graphics...");
    await this.Graphics.BatchLoad(a.graphics);
}

module.exports = Databases;
},{"./basedb.js":4,"./graphics.js":5,"./i18n.js":6,"./settings.js":7}],3:[function(require,module,exports){
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
        if(master) this.db = master.addCollection(name, {indices: indexes});
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
        if(this.castAs) this.db.insert(new this.castAs(obj));
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
        this.db = master.addCollection(name, {indices: indexes});
    }
}

module.exports = BaseDB;
},{}],5:[function(require,module,exports){
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
    if(lv) lv = lv.value;

    if(!lv) {
        lv = this.db.find({id: {"$contains" : id}});
        if(lv) return lv;
        return null;
    }

    if(!params) return this._ReplaceReferences(id, lv);

    if(lv){
        let keys = Object.keys(params);

        if(params.count !== undefined && params.count != 1){
            let nv = this.db.findOne({id: id + "_plural"});
            if(nv) lv = nv.value;
        }

        for(let i = 0; i < keys.length; i++){
            let val = params[keys[i]];
            lv = lv.replace("%{" + keys[i] + "}", val);
        }

        lv = this._ReplaceReferences(id, lv, params);

        return lv;
    }
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
        if(typeof data[arr[i]] == "object" && data[arr[i]].constructor !== Array) this._ParseAndRegister(data[arr[i]], prefix + arr[i] + ".");
        else {
            let toInsert = {id: prefix + arr[i], value: data[arr[i]]};
            this.db.insert(toInsert);
        }
    }
}

i18n._ReplaceReferences = function(id, str, params){
    let matches = str.match(/(?<=\${)(.*?)(?=\})/g);
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
"use strict"

let BaseDB = require("./basedb.js");


class Setting{
    constructor(obj){
        Object.assign(this, obj);
        this.value = this.initial;
    }

    GetAsOption(){
        let option = {text: {}, arrow_text: {}, arrows: {enabled: true, spacing: 120, offset: {x: 200, y: 0}}};
        option.data = {setting: this};

        option.text.text = i18n("settings." + this.id + ".name");

        //predefined, toggle, step

        switch(this.type){
            case("predefined"):
                option.data.valueset = this.values;
                option.data.value = this.value;
                break;
            case("toggle"):
                option.data.valueset = [false, true];
                option.data.value = this.value;
                option.data.parser = this._ToggleParser;
                break;
            case("step"):
                option.data.step = this.stepp;
                option.data.value = this.value;
                option.data.min = this.min;
                option.data.max = this.max;
                break;
        }

        option.data.OnModify = this.OnModify.bind(this);

        option.arrow_text.text = option.data.value;

        return option;
    }

    _ToggleParser(val){
        return (val ? "On" : "Off");
    }

    RegisterWatcher(fn){
        this._OnModify = fn;
    }

    OnModify(val){
        this.value = val;
        if(this._OnModify) this._OnModify();
    }
}

let SettingsDB = new BaseDB();
SettingsDB.castAs = Setting;


SettingsDB.RegisterWatcher = function(id, fn){
    let lv = this.db.findOne({id: id});
    if(lv) lv.RegisterWatcher(fn);
}

SettingsDB.InitDefault = function(){
    this.RegisterWatcher("adaptive_res", UI.Resize.bind(UI));
    this.RegisterWatcher("canvas_resolution", UI.Resize.bind(UI));
    this.RegisterWatcher("canvas_size", UI.Resize.bind(UI));
    this.RegisterWatcher("fullscreen", () => { if(Sys.env == "node") electron.ipcRenderer.send('fullscreen', Settings.GetByID("fullscreen").value);})
}


module.exports = SettingsDB;
},{"./basedb.js":4}],8:[function(require,module,exports){
'use strict'

/** TODO
 * UniComponent - Graphics.Dim, Graphics.Scale
 * Graphics.GetRect
 * Uncomment uihandler
 * Use race picture in class select
 */

String.prototype.initCap = function () {
    return this.toLowerCase().replace(/(?:^|\s)[a-z]/g, function (m) {
       return m.toUpperCase();
    });
 };

 $(document).ready(async () => {
  if(typeof process === 'object'){
    window.electron = require('electron')
    window.__baseDir = window.__dirname + "\\assets\\";
  }
  PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;

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
        Input: require("./Input/Input.js"),
        GameObjects: require("./GameObjects/GameObjects.js"),
        State: require("./State/State.js")
    }

    window.Graphics = ElonaJS.Graphics;
    window.Utils = ElonaJS.Utils;
    window.DB = ElonaJS.Databases;
    window.ElonaJS = ElonaJS;
    window.UI = ElonaJS.UI;
    window.Input = ElonaJS.Input;
    window.Sys = {env :(typeof process === "object" ? "node" : "browser")};
    window.GameObjects = ElonaJS.GameObjects;
    window.State = ElonaJS.State;

    await Utils.File.LoadFont('OpenSans', './fonts/OpenSans-Regular.ttf');
    await DB.Graphics.Register({id: "loadlg", path: "media/graphics/loading.png"});    
    Graphics.Init();
    UI.Init();
    UI.ShowLS();
    UI.Menus.LoadingScreen.Message("Loading data...");
    await DB.Load();
    UI.Resize();
    $(window).resize(function(){
      UI.Resize();
    });
    Input.Attach();  
    UI.Menus.LoadingScreen.Message("Done!", true);
    UI.HideLS(true);
   
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
},{"./Audio/audiohandler.js":1,"./Databases/Databases.js":2,"./GameObjects/GameObjects.js":9,"./Graphics/Graphics.js":21,"./Input/Input.js":23,"./State/State.js":24,"./UI/UI.js":48,"./Utils/Utils.js":50,"electron":undefined}],9:[function(require,module,exports){
let GameObjects = {
    Unit: require("./unit.js"),
    Trait: require("./trait.js")
}

module.exports = GameObjects;
},{"./trait.js":13,"./unit.js":15}],10:[function(require,module,exports){
'use strict';

let trainable = require("./trainable.js");

class Attribute extends trainable{
    constructor(){
        super();
    }

    
}

module.exports = Attribute;
},{"./trainable.js":12}],11:[function(require,module,exports){
'use strict';

let attribute = require("./attribute.js");

class AttributeSet{
    constructor(){
        this.list = {};

        let attblist = DB.Attributes.GetAll();

        for(let i = 0; i < attblist.length; i++){
            this.list[attblist[i].id] = new attribute();
        }
    }

    Set(obj){
        for(let i = 0, keys = Object.keys(obj); i < keys.length; i++){
            if(this.list[keys[i]]) this.list[keys[i]].SetLevel(obj[keys[i]]);
        }
    }


    GetAttribute(str){return this.list[str];}
}

module.exports = AttributeSet;
},{"./attribute.js":10}],12:[function(require,module,exports){
'use strict';

class Trainable{
    constructor(){
        this.level = 0;
        this.potential = 0;
        this.exp = 0;
    }

    GetLevel(){return this.level;}
    GetPotential(){return this.potential;}
    GetExp(){return this.exp;}
    SetLevel(val){this.level = val;}
}

module.exports = Trainable;
},{}],13:[function(require,module,exports){
class Trait{
    constructor(id){
        this.id = id;
        this.level = 0;
        this.dbentry = DB.Traits.GetByID(this.id);
    }

    GetDescription(){
        return i18n("traits." + this.id + ".description." + this.level);
    }

    GetDisplay(){
        let val = (this.level == 0 ? 1 : this.level);
        return i18n("traits." + this.id + ".display." + Math.sign(val));
    }

    GetIcon(){
        switch(this.dbentry.category){
            case "feat": return "interface.icon_star";
            case "race": return "interface.icon_gene";
            default: return "interface.icon_star";
        }
    }

    GetName(){
        return i18n("traits." + this.id + ".name." + this.level);
    }

    CanGain(){
        let max = this.dbentry.max;
        return this.level < max;
    }

    CanLose(){
        let min = this.dbentry.min;
        return this.level > min;
    }

    LevelUp(){if(this.CanGain()) this.level++;}
    LevelDown(){if(this.CanLoase()) this.level--;}
    SetLevel(lv){this.level = lv;}
}

module.exports = Trait;
},{}],14:[function(require,module,exports){
'use strict';

class TraitSet{
    constructor(){
        this.list = {};
        this.feats_available = 3;
    }

    /**
     * Adds a trait, by ID, to the trait set.
     * @param {String} id The ID of the trait to add
     * @param {Number} level The level of the trait that should be added
     * @param {Boolean} [bypass=false] Should this affect available feats. 
     */
    Add(id, level, bypass = false){
        if(this.feats_available <= 0 && !bypass) return false;
                
        let trait = DB.Traits.GetByID(id);
        if(trait) this.list[id] = new GameObjects.Trait(id);
        this.list[id].SetLevel(level);

        if(!bypass) this.feats_available -= 1;
    }   

    Available(){return this.feats_available;}

    Get(id){return this.list[id];}

    Has(id){return this.list[id] !== undefined;}
    
    Reset(){this.list = {}}
}

module.exports = TraitSet;
},{}],15:[function(require,module,exports){
'use strict';

let AttributeSet = require("./attributeset.js");
let TraitSet = require("./traitset.js");

class Unit{
    constructor(){
        this.name = "Debug";
        this.sex = "Female";
        this.title = "The Creator";
        this.class = "Warrior";
        this.race = "Yerles";
        this.feats_available = 3;
        this.level = 1;
        this.exp = 0;
        this.god = "Eyth of Infidel";
        this.guild = "None";
        this.fame = 0;
        this._traits = new TraitSet();
        this._attributes = new AttributeSet();
    }

    Traits(){return this._traits;}
    Attributes(){return this._attributes;}



    //Temporary, will go away at some point
    GetClass(){return this.class}
    GetGender(){return this.sex}
    GetRace(){return this.race}
    SetClass(name){this.class = name;}
    SetGender(name){this.sex = name;}
    SetRace(name){this.race = name;}
    
    GetAttribute(id){return this.attributes.Get(id);}
    GetAttributes(){return this.attributes;}

}

module.exports = Unit;





/* 


EloChara.prototype.GetAttbBase = function(name){
    return this.attributes[name].base;
}

EloChara.prototype.GetAttbValue = function(name){
    return this.attributes[name].effective;
}

EloChara.prototype.GetAttbPotential = function(name){
    return this.attributes[name].potential;
}

EloChara.prototype.ResetFeats = function(){
    this.traits = {};
    this.feats_available = Math.min(Math.floor(this.level / 5) + 3, 13);
}

EloChara.prototype.SetAttributes = function(attb){
    for(let i = 0, keys = Object.keys(attb); i < keys.length; i++) this.attributes[keys[i]].base = attb[keys[i]];
    this.UpdateEffectiveStats();
}

EloChara.prototype.UpdateEffectiveStats = function(){
    for(let i = 0, keys = Object.keys(this.attributes); i < keys.length; i++) this.attributes[keys[i]].effective = this.attributes[keys[i]].base;
}

EloChara.prototype.Init = function(){
    let race = ElonaJS.Databases.Races.GetByID(this.race);
    let base = (race.birth.base == "cy" ? ElonaJS.State.Time.year : 0);
    this.age = RandomFloor(race.birth.random) + race.birth.add;

    this.height = race.height + RandomFloor(race.height/5 + 1) - RandomFloor(race.height/5 + 1);
    this.weight = Math.floor(this.height*this.height*(RandomFloor(6) + 18)/10000);
} */
},{"./attributeset.js":11,"./traitset.js":14}],16:[function(require,module,exports){
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
},{"./header1.js":18,"./header2.js":19,"./paper.js":20}],17:[function(require,module,exports){
let DrawTexture = function (rt, bt, x, y, w, h, dx, dy){
    let ct = new PIXI.Texture(bt, new PIXI.Rectangle(x, y, w, h));
    let cs = new PIXI.Sprite(ct);
    cs.position.set(dx, dy);
    App.renderer.render(cs, rt, false);
};

module.exports = DrawTexture;
},{}],18:[function(require,module,exports){
'use strict'

let DrawTexture = require("./drawtexture.js");

let Header1 = function(nw, nh){
    let rt = PIXI.RenderTexture.create(nw, nh);
    let bgbase = DB.Graphics.Get("interface.header1_bg", false);
    let fmbase = DB.Graphics.Get("interface.header1", false);
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
},{"./drawtexture.js":17}],19:[function(require,module,exports){
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
},{"./drawtexture.js":17}],20:[function(require,module,exports){
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
},{"./drawtexture.js":17}],21:[function(require,module,exports){
/**
 * @namespace ElonaJS.Graphics
 */

let Graphics = {
    Init: function(){
        this.App = new PIXI.Application({width: 800, height: 600, transparent: true});
        window.App = this.App;
        this.App.view.id = "game-canvas";
        $('body').append(this.App.view);
    },
    GetWindowDimensions: function(){
        return {x: window.innerWidth, y: window.innerHeight}
    },
    GetCanvasSize: function(){
        if(!Settings.GetByID("adaptive_res")) return {x: 800, y: 600};
        if(Settings.GetByID("adaptive_res").value) return this.GetWindowDimensions();
        else return Utils.Parse.Dim2DInt(Settings.GetByID("canvas_resolution").value);
    },
    Scale: function(){return 1;},
    Spriting: require("./spriting.js"),
    Composers: require("./Composers/Composers.js")
};


module.exports = Graphics;
},{"./Composers/Composers.js":16,"./spriting.js":22}],22:[function(require,module,exports){
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
    let texture = DB.Graphics.Get(params.img, true, params.width, params.height);
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
},{}],23:[function(require,module,exports){
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
},{}],24:[function(require,module,exports){
let State = {
    Player: null
}

module.exports = State;
},{}],25:[function(require,module,exports){
/**
 * @description This namespace contains a variety of different UI components that may be attached to a menu.
 * Components can be either singular - derived from class {@link ElonaJS.UI.Components.UniComponent | Unicomponent},
 * or a collection, from class {@link ElonaJS.UI.Components.MultiComponent | Multicomponent}. Each component type has its own
 * accepted parameters and default values - see their individual pages for more info.
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
},{"./guide.js":26,"./image.js":27,"./option.js":29,"./optionlist.js":30,"./paperfooter.js":31,"./paperheader.js":32,"./rect.js":33,"./sectionheader.js":34,"./text.js":35}],26:[function(require,module,exports){
let MultiComponent = require("./multicomponent.js");

class Guide extends MultiComponent{
    constructor(params){
        super(params);
        let pos = params.position || {x: 0, y: 0};
        this.set.Text = new UI.Components.Text($.extend(true, {position: {x: pos.x + 40, y: pos.y + 14}, id: "Text", color: "white", alignment: "top-left"}, params.text));
        this.set.Image = new UI.Components.Image($.extend(true, {position: {x: pos.x + 20, y: pos.y + 10}, alignment: "top-left", img: "interface.header2", id: "Image", height: 24, width: this.set.Text.GetActualWidth() + 40}, params.image));
    }
}

module.exports = Guide;
},{"./multicomponent.js":28}],27:[function(require,module,exports){
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

    Reconstruct(params){
        if(params.tint) this.sprite.tint = params.tint;
        else this.sprite.tint = 0xFFFFFF;

        if(params.shadow) this.sprite.filters = [new PIXI.filters.DropShadowFilter({distance: params.shadow.distance, blur: params.shadow.blur})]
        else this.sprite.filters = [];

        if(params.alpha) this.sprite.alpha = params.alpha;
        else this.sprite.alpha = 1;

        if(params.position) this.sprite.position.set(params.position.x, params.position.y);

        if(params.scale) this.sprite.scale.set(params.scale, params.scale);
        else this.sprite.scale.set(1, 1);

        if(params.img && this.params.img != params.img){
            this.sprite.setTexture(DB.Graphics.Get(params.img), true, params.width, params.height);
        }

        if(!params.alignment) params.alignment = "relative";

        this.params = params;
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
},{"./unicomponent.js":36}],28:[function(require,module,exports){
class MultiComponent{
    constructor(params){
        this.params = $.extend(true, {}, this._default, params);
        this.id = params.id;
        this.hidden = false;
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
        this.hidden = true;
    }

    IsHidden(){
        return this.hidden;
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
        this.hidden = false;
    }


}

module.exports = MultiComponent;
},{}],29:[function(require,module,exports){
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
                if(this.set.text) {
                    this.set.text.Reconstruct(val);
                    val.modified = false;
                } else {
                    this.set.text = new UI.Components.Text(val);
                    this.menu.AddSprite(this.set.text.sprite);
                }
            }
        } else (this.set.text ? this.set.text.Hide() : null);

        if(op.keyimage.enabled){
            let val = op.keyimage;
            Object.assign(val, {position: {x: op.position.x + val.offset.x, y: op.position.y + val.offset.y}})
            if(!this.set.keyimage || !Utils.Parse.ObjEq(op.keyimage, this.params.keyimage)){
                chng = true;
                if(this.set.keyimage) {
                    this.set.keyimage.Reconstruct(val);   
                } else {
                    this.set.keyimage = new UI.Components.Image(val);
                    this.menu.AddSprite(this.set.keyimage.sprite);
                }
            }
            this.set.keyimage.Show();
        } else (this.set.keyimage ? this.set.keyimage.Hide() : null);

        if(op.keytext.enabled){
            let val = op.keytext;
            Object.assign(val, {position: {x: op.position.x + val.offset.x, y: op.position.y + val.offset.y}})
            if(!this.set.keytext || !Utils.Parse.ObjEq(op.keytext, this.params.keytext)){
                chng = true;
                if(this.set.keytext) {
                    this.set.keytext.Reconstruct(val);
                } else {
                    this.set.keytext = new UI.Components.Text(val);
                    this.menu.AddSprite(this.set.keytext.sprite); 
                }
            } 
            this.set.keytext.Show();
        } else (this.set.keytext ? this.set.keytext.Hide() : null);

        if(op.arrows.enabled){
            let val = op.arrows;
            Object.assign(val, {position: {x: op.position.x + val.offset.x, y: op.position.y + val.offset.y}})
            if(!this.set.arrows || !Utils.Parse.ObjEq(op.arrows, this.params.arrows)){
                chng = true;

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
                let textparam = $.extend(true, {}, op.arrow_text);
                if(this.set.arrow_text) {
                    thi.set.arrow_text.Reconstruct();
                } else {
                    this.set.arrow_text = new UI.Components.Text(textparam);
                    this.menu.AddSprite(this.set.arrow_text.sprite); 
                }
                                                  
                if(op.arrow_text.centered){
                    this.set.arrow_text.SetBasePosition(
                        op.position.x + op.arrows.offset.x + (op.arrows.spacing + this.set.arrow_left.GetActualWidth())/2,
                        op.position.y + op.arrows.offset.y
                    );
                }

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
},{"./multicomponent.js":28}],30:[function(require,module,exports){
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
        this.style = this._defaultStyle;
        this.menu = menu;
        this.init = false;
        menu.components.OptionList = this;
    }

    PageUp(){
        let opt = this.GetCurrentItem();

        if(opt.IsAdjustable()){
            opt.ModifyValue(1);
            return;
        }

        let tpm = (this.page+1) * this.settings.perpage;
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
        let opt = this.GetCurrentItem();

        if(opt.IsAdjustable()){
            opt.ModifyValue(-1);
            return;
        }

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

    JumpToLast(){
        this.current = this.list.length - 1;
        this.page = this.GetMaxPages() - 1;
        this.Build();
        this.UpdateSelector();
        this.AlignSelector(this.menu.position);
        this.menu.AlignElements();
    }

    JumpTo(index){
        let pg = Math.floor(index / this.settings.perpage);
        this.page = pg;
        this.current = index;
        this.Build();
        this.UpdateSelector();
        this.AlignSelector(this.menu.position);
        this.menu.AlignElements();
    }

    AlignSelector(base){
        this.set.Selector.Align(base);
        this.set.Selector.Scale(Graphics.Scale());
        this.set.Diamond.Align(base);
        this.set.Diamond.Scale(Graphics.Scale());
    }

    CustomizeList(params){
        this.settings = Object.assign({}, this._defaultList, params);
    }

    CustomizeStyle(params){
        this.style = Object.assign({}, this._defaultStyle, params);
    }

    Build(){
        let numO = this.list.length;
        let listM = this.settings.perpage;

        let strO = this.page * this.settings.perpage;
        let endO = Math.min(this.page * this.settings.perpage + this.settings.perpage, numO);
        
        for(let i = strO; i < endO; i++){
            if(!this.list[i].built) this.list[i] = $.extend(true, {}, this.style, this.list[i]);
            let ostr = "Option_" + (i-strO);

            this.list[i].keytext.text = String.fromCharCode(97+(i-strO));
            this.list[i].position.x = this.settings.position.x; this.list[i].position.y = this.settings.position.y + this.settings.spacing * (i-strO);
            this.list[i].id = ostr;
            this.list[i].alignment = this.settings.alignment;

            if(!this.set[ostr]){
                this.set[ostr] = new UI.Components.Option(this.list[i], this.menu);
            } else {
                this.set[ostr].Show();
                this.set[ostr].Reset(this.list[i]);
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
        return this.set["Option_" + (this.current % this.settings.perpage)];
    }

    GetCurrentOption(){
        return this.list[this.current];
    }

    GetList(){
        return this.list;
    }

    GetPageOptions(){
        return this.list.slice((this.page) * this.settings.perpage, Math.min(this.list.length, (this.page+1) * this.settings.perpage));
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
        centered: true,
        offset: {x: 0, y: 0},
        z: 5
    },
    position:{
        x: 0,
        y: 0
    },
    built: true
}

module.exports = OptionList;
},{"./multicomponent.js":28}],31:[function(require,module,exports){
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
},{"./multicomponent.js":28}],32:[function(require,module,exports){
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
},{"./multicomponent.js":28}],33:[function(require,module,exports){
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
},{"./unicomponent.js":36}],34:[function(require,module,exports){
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
},{"./multicomponent.js":28}],35:[function(require,module,exports){
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
  * @category UIComponents
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

    GetText(){
        return this.sprite.text;
    }

    Reconstruct(params){
        if(params.size) this.sprite._style.fontSize = params.size;
        else this.sprite._style.fontSize = this._default.size;

        if(params.color) this.sprite._style.fill = params.color;
        else this.sprite._style.fill = this._default.color;

        if(params.wrap) {
            this.sprite._style.wordWrap = true;
            this.sprite._style.wordWrapWidth = params.wrap.width;
        } else this.sprite._style.wordWrap = false;

        if(params.weight) this.sprite._style.fontWeight = params.weight;
        else this.sprite._style.fontWeight = "normal";

        if(params.outline) {
            this.sprite._style.stroke = params.outline.color;
            this.sprite._style.strokeThickness = params.outline.size;
        } else this.sprite._style.strokeThickness = 0;

        if(!params.alignment) params.alignment = "relative";

        if(params.text) this.SetText(params.text);

        this.params = params;
        if(params.i18n) this.RefreshI18n();
    }

    RefreshI18n(){
        if(this.params.i18n) this.SetText(i18n(this.params.i18n));
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
},{"./unicomponent.js":36}],36:[function(require,module,exports){
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
     * @param {Object} base The base position of the menu to align on.
     * @param {Number} base.x The base x position
     * @param {Number} base.y The base y position
     */
    Align(base){
        let dims = Graphics.GetCanvasSize();
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
        return {x: this.params.position.x, y: this.params.position.y}
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
},{}],37:[function(require,module,exports){
'use strict'

/**
 * A collection of Menus used in the game.
 * @namespace ElonaJS.UI.Menus
 * @memberOf ElonaJS.UI
 * @property {ElonaJS.UI.Menus.BaseMenu} RaceSelect The RaceSelect Module
 */
let Menus = {
    LoadingScreen: require("./loadingscreen.js"),
    TitleScreen: require("./titlescreen.js"),
    RaceSelect: require("./raceselect.js"),
    GenderSelect: require("./genderselect.js"),
    ClassSelect: require("./classselect.js"),
    AttributeRoll: require("./attributeroll.js"),
    TextInput: require("./textinput.js"),
    FeatSelect: require("./featselect.js"),
    SettingsMenu: require("./settingsmenu.js")
}

module.exports = Menus;
},{"./attributeroll.js":38,"./classselect.js":40,"./featselect.js":41,"./genderselect.js":42,"./loadingscreen.js":43,"./raceselect.js":44,"./settingsmenu.js":45,"./textinput.js":46,"./titlescreen.js":47}],38:[function(require,module,exports){
let BaseMenu = require("./basemenu.js");

/**
 * The attribute roll menu. Allows for the rolling of base stats based on class / race combination.
 * @name AttributeRoll
 * @type ElonaJS.UI.Menus.BaseMenu
 * @memberOf ElonaJS.UI.Menus
 */
let AttributeRoll = new BaseMenu();


AttributeRoll.Customize({centered: true, size: {w: 350, h: 330}});


AttributeRoll._OnLoad = function(parameters){
    this.parameters = parameters;
    if(this.init) {
        this._ResetLocks();
        AttributeRoll._Reroll();
        this.options.current = 0;
        this.options.curpage = 0;
        return;
    }

    this.init = true;

    this.locks = 2;

    new UI.Components.Image({id: "Background", img: "void", alignment: "fill", position: {z: -1}}).Attach(this);
    new UI.Components.Image({id: "Paper", img: "interface.paper", width: 350, height: 330, shadow: {distance: 10, blur: 0}, position: {z: 0}}).Attach(this);
    new UI.Components.Image({id: "BG_Deco", img: "cbg3", position: {x: 10, y: 40, z: 1}, width: 175, height: 250, alpha: 0.2}).Attach(this);
    new UI.Components.Text({id: "Help", alignment: "bottom-left", i18n: "hints.help", position: {x: 30, y: -22}}).Attach(this);
    new UI.Components.Text({id: "Disclaimer", i18n: "ui.attributeroll.disclaimer", position: {x: 195, y: 38}, size: 9, wrap: {width: 110}}).Attach(this);
    new UI.Components.Text({id: "Locks", text: i18n("ui.attributeroll.locks", {num: this.locks}), position: {x: 195, y: 70}}).Attach(this);

    new UI.Components.Guide({
        position: {x: 0, y: 0},
        id: "Guide",
        text: {i18n: "ui.attributeroll.guide"}
    }).Attach(this);

    new UI.Components.PaperHeader({
        id: "Header",
        text: {i18n: "ui.attributeroll.title"}
    }).Attach(this);

    new UI.Components.PaperFooter({
        id: "Hint",
        position: {x: 30, y: 300},
        rect: {width: 275},
        text: {i18n: "hints.3b"}
    }).Attach(this);

    new UI.Components.SectionHeader({
        id: "Attributes",
        position: {x: 30, y: 40},
        text: {i18n: "ui.attributeroll.section1"}
    }).Attach(this);

    let op = [
        {text: {i18n: "ui.reroll"}},
        {text: {i18n: "ui.proceed"}}
    ];

    let attb = DB.Attributes.Search({primary: true});
    let attbID = attb.reduce((acc, cur) => {return (acc.push(cur.id) ? acc : null)}, []);

    for(let i = 0; i < attb.length; i++){
        new UI.Components.Text({id: attbID[i], position: {x: 225, y: 115 + 22 * i}, val: attbID[i]}).Attach(this, "AttbVal");
        new UI.Components.Image({id: attbID[i], position: {x: 200, y: 115 + 22 * i, z: 3}, img: attb[i].icon}).Attach(this, "AttbImg");
        new UI.Components.Text({id: attbID[i], position: {x: 245, y: 116 + 22 * i}, text: "Locked!", color: "blue", size: 9}).Attach(this, "LockText");
        op.push({text: {i18n: attb[i].full}, val: attbID[i]});
        
        this.components.LockText[attbID[i]].Hide();
        this.components.LockText[attbID[i]].locked = false;
    }

    this.options.CustomizeList({position: {x: 70, y: 70}, spacing: 22});
    this.options.Set(op);
    AttributeRoll._Reroll();
}

AttributeRoll._Reroll = function(){
    let cls = DB.Classes.GetByID(this.parameters.unit.GetClass()).base_attributes;
    let race = DB.Races.GetByID(this.parameters.unit.GetRace()).base_attributes;
    let attb = DB.Attributes.Search({primary: true});
    let attbID = attb.reduce((acc, cur) => {acc.push(cur.id); return acc;}, []);
    for(let i = 0; i < attb.length; i++){
        if(this.components.LockText[attbID[i]].locked) continue;
        this.components.AttbVal[attbID[i]].SetText(Math.floor(Math.max(Math.random() * (cls[attbID[i]] + race[attbID[i]]), (cls[attbID[i]] + race[attbID[i]])/2) + 1));
    }
}

AttributeRoll._GetAttbSet = function(){
    let stats = {};
    let base = this.components.AttbVal;
    let keys = Object.keys(base);

    for(let i = 0; i < keys.length; i++) stats[keys[i]] = parseInt(base[keys[i]].GetText());

    stats.Speed = DB.Races.GetByID(this.parameters.unit.GetRace()).base_attributes.Speed;
    return stats;
}

AttributeRoll._OnSelect = function(){
    let cur = this.options.GetCurrent();

    if(cur == 0){
        this._Reroll();
        ElonaJS.Audio.PlaySound("dice");
    }

    if(cur == 1){
        ElonaJS.Audio.PlaySound("feat");
        let stats = this._GetAttbSet();
        this.parameters.unit.Attributes().Set(stats);
        UI.UnloadMenu(this);
        if(this.parameters.creation) UI.LoadMenu("FeatSelect", this.parameters);
    }

    if(cur > 1){
        let val = this.options.GetCurrentOption().val;
        let elem = this.components.LockText[val];

        if(elem){
            switch(elem.locked){
                case true: 
                    elem.locked = false;
                    this.locks++;
                    elem.Hide();
                    break;
                case false:
                    if(!this.locks > 0) break;
                    this.locks--;
                    elem.locked = true;
                    elem.Show();
                    break;
                default: break;
            }
        }
    }

    this.components.Locks.SetText(i18n("ui.attributeroll.locks", {num: this.locks}));
}

AttributeRoll._ResetLocks = function(){
    for(let i in this.components.LockText){
        this.components.LockText[i].locked = false;
        this.components.LockText[i].Hide();
    }

    this.locks = 2;
    this.components.Locks.SetText(i18n("ui.attributeroll.locks", {num: this.locks}));
}

AttributeRoll._OnBack = function(){
    UI.UnloadMenu(this);

    if(this.parameters.creation){
        if(this.parameters.creation) UI.LoadMenu("ClassSelect", this.parameters);
    }
}





/* menu._OnSelect = function(){


    if(this.options.current == 1) {
        this.sounds.select = "feat";
        let attblist = ElonaJS.Databases.Strings.GetNoLocale("Attributes").split(',');
        let stats = {};
        for(let i = 0; i < attblist.length; i++){
            let sel = this.components.Attb["Att_" + attblist[i]];
            stats[sel.EJS.val] = parseInt(sel.text);
        }

        this.active.SetAttributes(stats);
        Graphics.UnloadMenu(this);

        if(this.creation){
            Menus.FeatSelect.SetParameters(this.active, true);
            Graphics.LoadMenu("FeatSelect");
        }

        return;
    }


}; */

module.exports = AttributeRoll;
},{"./basemenu.js":39}],39:[function(require,module,exports){
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

    /**
     * Performs setup of the menu
     * @abstract
     */
    _OnLoad(){}

    /**
     * Adds a sprite to the menu's container
     * @function
     * @param sprite 
     */
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
                this._UpdatePage();
                break;
            case "key_right":
                this.options.PageUp();
                this._PlaySound(this.sounds.page);
                this.options.AlignSelector(this.position);
                if(this._PreviewData) this._PreviewData();
                this._UpdatePage();
                break;
        }
    }

    _PlaySound(val){
        if(val) ElonaJS.Audio.PlaySound(val);
    }

    Setup(params){
        if(!this.options) this.options = new UI.Components.OptionList(this);
        if(this._OnLoad) this._OnLoad(params);
        this._UpdateBase();
        this.options.Build();
        this.options.UpdateSelector();
        this._UpdatePage();
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
            let dims = Graphics.GetCanvasSize();
            this.position.x = Math.floor((dims.x - this.size.w) / 2);
            this.position.y = Math.floor((dims.y - this.size.h) / 2);
        }
    }

    _UpdatePage(){
        if(this.components.PageNum) this.components.PageNum.SetText(i18n("ui.page", {cur: this.options.GetPage(), max: this.options.GetMaxPages()}));
        if(this._OnPageChange) this._OnPageChange();
    }
}

module.exports = BaseMenu;
},{}],40:[function(require,module,exports){
let BaseMenu = require("./basemenu.js");

/**
 * The Class Selection menu. Displays a list of classes to choose from. When this menu is loaded, it must be passed an object containing the unit to be modified. On selection, the menu will set the unit's class, then either exit or continue along the character creation process if the flag is set.
 * @name ClassSelect
 * @type ElonaJS.UI.Menus.BaseMenu
 * @memberof! ElonaJS.UI.Menus
 */
let ClassSelect = new BaseMenu();

ClassSelect.Customize({centered: true, size: {w: 720, h: 500}});
ClassSelect.sounds.select = "spell";

ClassSelect._OnLoad = function(parameters){
    this.parameters = parameters;
    let race = DB.Races.GetByID(parameters.unit.GetRace());
    let rimgdet = DB.Graphics.GetByID("character." + race.pic.female);
    if(this.init){
        this.options.current = 0;
        this.options.page = 0;
        this.components.CPrev1.SetImage("character." + race.pic.female);
        this.components.CPrev2.SetImage("character." + race.pic.male);
        this.components.CPrev1.SetBasePosition(330, 63 - rimgdet.h);
        this.components.CPrev2.SetBasePosition(330 + 20 + rimgdet.w, 63 - rimgdet.h);
        this.components.Race.SetText(i18n("ui.classselect.race", {race: DB.Races.GetByID(parameters.unit.race).name}));
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
    new UI.Components.Text({id: "Race", text: "Race: ", position: {x: 520, y: 40}}).Attach(this);
    new UI.Components.Text({id: "PageNum", position: {x: 640, y: 475}, size: 10}).Attach(this);
    new UI.Components.Image({id: "CPrev1", img: "character." + race.pic.female, position: {x: 350, y: 15, z: 3}, alpha: 1, scale: 1}).Attach(this);
    new UI.Components.Image({id: "CPrev2", img: "character."  + race.pic.male, position: {x: 400, y: 15, z: 3}, alpha: 1, scale: 1}).Attach(this);

    new UI.Components.PaperHeader({
        id: "Header",
        text: {i18n: "ui.classselect.title"}
    }).Attach(this);

    new UI.Components.PaperFooter({
        id: "Hint",
        position: {x: 35, y: 470},
        rect: {width: 625},
        text: {i18n: "hints.3b"}
    }).Attach(this);

    new UI.Components.SectionHeader({
        id: "Classes",
        position: {x: 35, y: 40},
        text: {i18n: "ui.classselect.section1"}
    }).Attach(this);

    new UI.Components.SectionHeader({
        id: "Details",
        position: {x: 205, y: 40},
        text: {i18n: "ui.classselect.section2"}
    }).Attach(this);

    new UI.Components.SectionHeader({
        id: "AttributeBonuses",
        position: {x: 205, y: 205},
        text: {i18n: "ui.classselect.section3"}
    }).Attach(this);

    new UI.Components.SectionHeader({
        id: "TrainedSkills",
        position: {x: 205, y: 285},
        text: {i18n: "ui.classselect.section4"}
    }).Attach(this);

    new UI.Components.Guide({
        position: {x: 0, y: 0},
        id: "Guide",
        text: {i18n: "ui.classselect.guide"}
    }).Attach(this);


    this.components.CPrev1.SetBasePosition(330, 63 - rimgdet.h);
    this.components.CPrev2.SetBasePosition(330 + 20 + rimgdet.w, 63 - rimgdet.h);
    this.components.Race.SetText(i18n("ui.classselect.race", {race: DB.Races.GetByID(parameters.unit.race).name}));


    let attb = DB.Attributes.Search({primary: true});

    for(let i = 0; i < attb.length; i++){
        let val = attb[i];
        new UI.Components.Image({id: val.id, img: val.icon, position: {x: 210 + 130 * (i%3), y: 225 + 19 * Math.floor(i/3), z: 3}}).Attach(this, "attb_icons");
        new UI.Components.Text({id: val.id, position: {x: 230 + 130 * (i%3), y: 225 + 19 * Math.floor(i/3)}}).Attach(this, "attb_text");
    }

    this._BuildList();
    this.components.PageNum.SetText(i18n("ui.Page", {cur: this.options.GetPage(), max: this.options.GetMaxPages()}));
}

ClassSelect._BuildList = function(){
    if(!this.classes) this.classes = DB.Classes.Search({playable: true});
    let classes = this.classes;
    let opt = [];

    for(let i = 0; i < classes.length; i++){
        let no = {text:{}, preview: {}};
        no.text.i18n = classes[i].name;
        no.preview.desc = classes[i].description;
        no.preview.class = classes[i];
        opt.push(no);
    }

    this.options.CustomizeList({
        position: {x: 75, y: 70},
        perpage: 20
    });

    this.options.Set(opt);
}

ClassSelect._PreviewData = function(){
    let op = this.options.GetCurrentOption();
    this.components.Desc.SetText(i18n(op.preview.desc));
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

ClassSelect._FormatAttributes = function(){
    let op = this.options.GetCurrentOption();
    let attb = DB.Attributes.Search({primary: true});
    let atbStr = i18n("attributes.magnitude");
    let cstats = op.preview.class.base_attributes;

    for(let i = 0, arr = Object.keys(attb); i < arr.length; i++){
        let val = attb[i].id;

        if(this.components.attb_text[val]){
            let str;
            let style = {fill: "black"};
     
            if (cstats[val] == 0){str = i18n("attributes.magnitude.none"); style.fill = "rgb(120, 120, 120)";} else
            if (cstats[val] > 13){str = i18n("attributes.magnitude.best"); style.fill = "rgb(0, 0, 200)";} else
            if (cstats[val] > 11){str = i18n("attributes.magnitude.great"); style.fill = "rgb(0, 0, 200)";} else
            if (cstats[val] > 9){str = i18n("attributes.magnitude.good"); style.fill = "rgb(0, 0, 150)";} else
            if (cstats[val] > 7){str = i18n("attributes.magnitude.not_bad"); style.fill = "rgb(0, 0, 150)";} else
            if (cstats[val] > 5){str = i18n("attributes.magnitude.normal"); style.fill = "rgb(0, 0, 0)";} else
            if (cstats[val] > 3){str = i18n("attributes.magnitude.little"); style.fill = "rgb(150, 0, 0)";} else
            if (cstats[val] > 0){str = i18n("attributes.magnitude.slight"); style.fill = "rgb(200, 0, 0)";}
            
            this.components.attb_text[val].SetText(i18n(DB.Attributes.GetByID(val).short).initCap() + ": " + str);
            this.components.attb_text[val].UpdateStyle(style);
        }
    }
}

ClassSelect._FormatSkills = function(){
    let op = this.options.GetCurrentOption();
    let attb = op.preview.class.base_skills;
    let o = 1;
    let nwep = 0;
    let wpnstr = i18n("ui.classselect.wepprefix");

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
            this.components.SkillImages[o].SetImage(DB.Attributes.GetByID(skill.attr).icon);
        } else{
            new UI.Components.Text({id: o, i18n: skill.name, position: {x: 230, y: 310 + 16 * o}}).Attach(this, "SkillText");
            this.components.SkillText[o].SetText(i18n(skill.name).initCap());
            new UI.Components.Text({id: o, i18n: skill.desc1, position: {x: 340, y: 310 + 16 * o}}).Attach(this, "SkillDesc");
            new UI.Components.Image({id: o, img: DB.Attributes.GetByID(skill.attr).icon, position: {x: 210, y: 310 + 16 * o, z: 3}}).Attach(this, "SkillImages");
        }

        o++;
    }

    if(!this.components.SkillText[0]){
        new UI.Components.Text({id: "0", text: wpnstr, position: {x: 230, y: 310}}).Attach(this, "SkillText");
        new UI.Components.Image({id: "0", img: DB.Attributes.GetByID("Strength").icon, position: {x: 210, y: 310, z: 3}}).Attach(this, "SkillImages");
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

ClassSelect._OnSelect = function(){
    this.parameters.unit.SetClass(this.options.GetCurrentOption().preview.class.id);
    UI.UnloadMenu(this);
    if(this.parameters.creation){
        UI.LoadMenu("AttributeRoll", this.parameters);
    }
}

ClassSelect._OnBack = function(){
    UI.UnloadMenu(this);
    if(this.parameters.creation) UI.LoadMenu("GenderSelect", this.parameters);
}

module.exports = ClassSelect;
},{"./basemenu.js":39}],41:[function(require,module,exports){
let BaseMenu = require("./basemenu.js");

/**
 * The race select menu.
 * @name FeatSelect
 * @type ElonaJS.UI.Menus.BaseMenu
 * @memberOf ElonaJS.UI.Menus
 */
let FeatSelect = new BaseMenu();

FeatSelect.sounds.select = "pop1";


FeatSelect.Customize({centered: true, size: {w: 720, h: 400}});

FeatSelect._OnLoad = function(parameters){
    this.parameters = parameters;
    
    if(this.init){
        return;
    }

    this.init = true;
    let perpage = 15;
    this.options.CustomizeList({position: {x: 90, y: 65}, spacing: 19, perpage: perpage});

    this.static = {
        "topoption": {text: {i18n: "ui.featselect.header2", offset: {x: 35}},  keyimage: {enabled: false}, keytext: {enabled: false}},
        "divoption": {text: {i18n: "ui.featselect.header1", offset: {x: 35}},  keyimage: {enabled: false}, keytext: {enabled: false}}
    };

    new UI.Components.Image({id: "Background", img: "void", alignment: "fill", position: {z: -1}}).Attach(this);
    new UI.Components.Image({id: "Paper", img: "interface.paper", position: {z: 0}, width: 720, height: 400, shadow: {distance: 10, blur: 0}}).Attach(this);
    new UI.Components.Text({id: "Help", alignment: "bottom-left", i18n: "hints.help", position: {x: 30, y: -22}}).Attach(this);
    new UI.Components.Image({id: "tl", img: "feat_deco.tl", position: {x: 0, y: 0, z: 2}}).Attach(this, "Deco");
    new UI.Components.Image({id: "br", img: "feat_deco.br", position: {x: 678, y: 228, z: 2}}).Attach(this, "Deco");
    new UI.Components.Image({id: "bl", img: "feat_deco.bl", position: {x: 0, y: 359, z: 2}}).Attach(this, "Deco");
    new UI.Components.Image({id: "tr", img: "feat_deco.tr", position: {x: 628, y: 3, z: 2}}).Attach(this, "Deco");
    new UI.Components.Guide({id: "Guide", text: {i18n: "ui.featselect.guide"}}).Attach(this);
    new UI.Components.SectionHeader({id: "Detail", text: {i18n: "ui.featselect.section2"}, position: {x: 275, y: 38}}).Attach(this);
    new UI.Components.SectionHeader({id: "Name", text: {i18n: "ui.featselect.section1"}, position: {x: 45, y: 38}}).Attach(this);
    new UI.Components.PaperHeader({id: "Header", text: {i18n: "ui.featselect.title"}}).Attach(this);
    new UI.Components.Image({id: "HD", img: "interface.icon_feat", position: {x: 25, y: -23, z: 3}}).Attach(this, "Deco");
    new UI.Components.PaperFooter({id: "Hint", text: {i18n: "ui.featselect.hint"}, rect: {width: 580}, position: {x: 85, y: 375}}).Attach(this);
    new UI.Components.Text({id: "Disclaimer", text: "", position: {x: 360, y: 363}, size: 9}).Attach(this);
    new UI.Components.Text({id: "PageNum", position: {x: 600, y: 365}, size: 10}).Attach(this);

    for(let i = 0; i < perpage; i++){
        new UI.Components.Image({id: i, img: "interface.icon_bulb", position: {x: 30, y: i*19 + 65, z:3}}).Attach(this, "FeatImages");
    }

    for(let i = 0; i < perpage; i++){
        new UI.Components.Text({id: i, text: "Test", position: {x: 290, y: i*19 + 65}, size: 12}).Attach(this, "FeatDesc");
    }

    for(let i = 0; i < Math.ceil(perpage/2); i++){
        new UI.Components.Rect({id: i, color: "black", alpha: "0.07", width: 645, height: 17, position: {x: 55, y: i*38 + 63}}).Attach(this, "Shadows");
    }

    this.options.Set([
        {text: {i18n: "ui.featselect.header2", offset: {x: 35}}, keyimage: {enabled: false}, keytext: {enabled: false}}
    ]);


    this.components.Disclaimer.SetText(i18n("ui.featselect.disclaimer", {count: this.parameters.unit.Traits().Available()}));

    this._BuildOptions();
}

FeatSelect._BuildOptions = function(){
    let feats =  DB.Traits.Search({category: "feat"}).reduce(function(list, current){list.push(new GameObjects.Trait(current.id)); return list;}, []);
    let olist = [];
    let havelist = [];
    let unit = this.parameters.unit.Traits();
    
    olist.push(this.static.topoption);

    for(let i = 0; i < feats.length; i++){
        if(unit.Has(feats[i].id)){
            let trait = unit.Get(feats[i].id);
            havelist.push(
                {text: {text: trait.GetDescription(), color: "blue"}, preview: {id: trait.id, description: "", icon: trait.GetIcon(), allowed: false}, keyimage: {enabled: false}, keytext: {enabled: false}}
            );
            if(trait.CanGain()){
                olist.push(
                    {text: {text: trait.GetName(), color: "blue"}, preview: {id: trait.id, description: trait.GetDisplay(), icon: trait.GetIcon()}}
                )
            }
        } else {
            olist.push(
                {text: {text: feats[i].GetName()}, preview: {id: feats[i].id, description: feats[i].GetDisplay(), icon: feats[i].GetIcon()}}
            );
        }
    }
    olist.push(this.static.divoption);
    olist = olist.concat(havelist);
    this.options.Set(olist);
    this._OnPageChange();
}

FeatSelect._OnSelect = function(){
    let opt = this.options.GetCurrentOption();
    let unit = this.parameters.unit.Traits();
    let rawlist = this.options.GetList();

    if(opt.preview && opt.preview.id && opt.preview.allowed !== false){
        let list = rawlist.filter((elem) => {return elem.preview && elem.preview.id == opt.preview.id});
        let trait;
        
        if(unit.Has(opt.preview.id)) {
            unit.Get(opt.preview.id).LevelUp(opt.preview.id);
            trait = unit.Get(opt.preview.id);
            list[1].text.text = trait.GetDescription();
            list[1].text.modified = true;
            this.options.JumpTo(rawlist.indexOf(list[1]));
        } else {
            unit.Add(opt.preview.id, 1);
            trait = unit.Get(opt.preview.id);
            rawlist.push(
                {text: {text: trait.GetDescription(), color: "blue"}, preview: {id: trait.id, allowed: false, description: "", icon: trait.GetIcon()}, keyimage: {enabled: false}, keytext: {enabled: false}}
            );
            opt.text.color = "blue";
            opt.text.modified = true;
            this.options.JumpToLast();
        }

        if(trait.CanGain()){
            opt.text.text = trait.GetName();
            opt.text.modified = true;
        } else{
            opt.text.text += " (MAX)";
            opt.text.modified = true;
            opt.preview.allowed = false;
        }

        
        this.components.Disclaimer.SetText(i18n("ui.featselect.disclaimer", {count: unit.Available()}));
        this._UpdatePage();
    }
}



FeatSelect._OnPageChange = function(){
    let list = this.options.GetPageOptions();

    for(let i = 0; i < this.options.settings.perpage; i++){
        if(list.length > i){
            this.components.FeatDesc[i].UpdateStyle({fill: list[i].text.color});
            if(i % 2 == 0) this.components.Shadows[(i/2)].Show();
            if(!list[i].preview) {
                this.components.FeatDesc[i].Hide();
                this.components.FeatImages[i].Hide();
                continue;
            }
            this.components.FeatDesc[i].Show();
            this.components.FeatImages[i].Show();
            this.components.FeatDesc[i].SetText(list[i].preview.description);
            this.components.FeatImages[i].SetImage(list[i].preview.icon);
        } else{
            if(i % 2 == 0) this.components.Shadows[(i/2)].Hide();
            this.components.FeatDesc[i].Hide();
            this.components.FeatImages[i].Hide();
        }
    }
}


module.exports = FeatSelect;


/*     

    menu._Rebuild = function(toset){
        this.options.list.length = 0;

        if(this.active.feats_available > 0){
            this.options.list.push({text: ElonaJS.Databases.Strings.GetLocale("Sys_35"), x: 35, keyimage: false});

            for(let i = 0; i < this.featlist.length; i++){
                let feat = this.featlist[i];
                if(this.active.GetTraitLevel(feat.id) != 0){
                    if(feat.CanGain(this.active)){
                        this.options.list.push({text: feat.GetName(this.active.GetTraitLevel(feat.id)), val: feat.id, desc: feat.GetDisplay(), img: feat.GetIcon(), color: "blue"});
                    }
                } else {
                    this.options.list.push({text: feat.GetName(0), val: feat.id, desc: feat.GetDisplay(), img: feat.GetIcon()});
                }
            }
        }

        this._AddKnownTraits(toset);
        this._PageChange();
    }

    menu._PageChange = function(){
        let numrect = Math.ceil((this.options.list.length - (this.options.curpage * this.options.optperpage))/2);

        for(let i = 0; i < 8; i++) {
            if(i < numrect) this.components["Shadow_Rects"]["Rect_" + i].visible = true;
            else  this.components["Shadow_Rects"]["Rect_" + i].visible = false;
        }

        if(this.options.curpage > 0) this.components["Shadow_Rects"]["Rect_0"].visible = true; else this.components["Shadow_Rects"]["Rect_0"].visible = false;

        this.components["FeatNum"].text = ElonaJS.Databases.Strings.GetLocale("Sys_40").replace("%%val%%", this.active.feats_available);

        for(let i = 0; i < this.options.optperpage; i++){
            let index = this.options.curpage * this.options.optperpage + i;
            let text = (index >= this.options.list.length ? "" : this.options.list[index].desc || "");
            let img = (index >= this.options.list.length ? "" : this.options.list[index].img || "");
            this.components["Feat_Desc"]["Desc_" + i].text = text;
           

            if(img == "") this.components["Feat_Images"]["Img_" + i].visible = false;
            else {
                this.components["Feat_Images"]["Img_" + i].setTexture(ElonaJS.Databases.Graphics.Get(img));
                this.components["Feat_Images"]["Img_" + i].visible = true;
            }

            if(index < this.options.list.length){
                if(this.options.list[index].type == "known") this.components["Feat_Images"]["Img_" + i].EJS.x = 45; else this.components["Feat_Images"]["Img_" + i].EJS.x = 30;
                this.components["Feat_Desc"]["Desc_" + i]._style.fill = this.options.list[index].color || "black";
            }
        }
    }

    menu._AddKnownTraits = function(toset){
        this.options.list.push({text: ElonaJS.Databases.Strings.GetLocale("Sys_34"), x: 35, keyimage: false});

        for(let i = 0, keys = Object.keys(this.active.traits); i < keys.length; i++){
            let trt = ElonaJS.Databases.Traits.GetByID(keys[i]);
            let tobj = {x: -20, keyimage: false, color: "blue", type: "known"};
            tobj.text = ElonaJS.Databases.Strings.GetLocale("Trait_" + trt.category) + " " + trt.GetDescription(this.active.GetTraitLevel(trt.id));
            tobj.img = trt.GetIcon();

            this.options.list.push(tobj);
            if(keys[i] == toset){
                this.options.current = this.options.list.length-1;
                this.options.curpage = Math.floor(this.options.list.length / this.options.optperpage);
                this._BuildOptions();
            }
        }
    };

    menu._OnSelect = function(){
        let opt = this.options.list[this.options.current];
        let val = opt.val;
        if(opt.val){
            this.sounds.select = "ding3";
            this.active.AddTrait(opt.val);
            this.active.feats_available--;
            if(this.active.feats_available > 0 || !this.creation){         
                this._Rebuild(val);
            } else{
                Graphics.UnloadMenu(this);
                Menus.AliasSelect.SetParameters(this.active, true);
                Graphics.LoadMenu("AliasSelect");
            }
        } else this.sounds.select = "";

        this.ScaleElements();
    };

    menu._OnBack = function(){
        Graphics.UnloadMenu(this);
        if(this.creation){
            this.active.ResetFeats();
            this.options.current = 0;
            this.options.curpage = 0;
            this._Rebuild();
            Menus.AttributeRoll.SetParameters(this.active, true);
            Graphics.LoadMenu("AttributeRoll");
        }
    }

    return menu;
})();  */
},{"./basemenu.js":39}],42:[function(require,module,exports){
let BaseMenu = require("./basemenu.js");

/** 
 * The Gender Selection menu. Displays a list of genders to choose from. When this menu is loaded, it must be passed an object containing the unit to be modified. On selection, the menu will set the unit's gender, then either exit or continue along the character creation process if the flag is set.
 * @name GenderSelect
 * @extends ElonaJS.UI.Menus.BaseMenu
 * @memberof! ElonaJS.UI.Menus
*/
let GenderSelect = new BaseMenu();

/**
 * @name _OnLoad
 * @param {Object} parameters
 * @param {Boolean} parameters.creation Whether the unit will be newly created
 * @param {ElonaJS.GameObjects.Unit} parameters.unit The unit to be modified
 * @memberof! ElonaJS.UI.Menus.GenderSelect
 * @function
 */
GenderSelect._OnLoad = function(parameters){
    this.parameters = parameters;
    if(this.init){
        this.options.current = 0;
        this.options.curpage = 0;
        return;
    }

    this.init = true;

    let op = [];

    let sexes = DB.Misc.Search({"tag": "gender"});

    for(let i = 0; i < sexes.length; i++){
        op.push({text: {i18n: sexes[i].name}, data: sexes[i].id});
    }

    this.options.CustomizeList({
        position: {x: 75, y: 60}
    })

    this.options.Set(op);

    let offset = (sexes.length - 2) * 20;

    this.Customize({centered: true, size: {w: 360, h: 150 + offset}});

    new UI.Components.Image({id: "Background", img: "void", alignment: "fill", position: {z: -1}}).Attach(this);
    new UI.Components.Image({id: "Paper", img: "interface.paper", width: 360, height: 150 + offset, shadow: {distance: 10, blur: 0}, position: {z: 0}}).Attach(this);
    new UI.Components.Text({id: "Help", alignment: "bottom-left", i18n: "hints.help", position: {x: 30, y: -22}}).Attach(this);

    new UI.Components.Guide({
        position: {x: 0, y: 0},
        id: "Guide",
        text: {i18n: "ui.genderselect.guide"}
    }).Attach(this);

    new UI.Components.PaperHeader({
        id: "Header",
        text: {i18n: "ui.genderselect.title"}
    }).Attach(this);

    new UI.Components.PaperFooter({
        id: "Hint",
        position: {x: 25, y: 120 + offset},
        rect: {width: 280},
        text: {i18n: "hints.3b"}
    }).Attach(this);

    new UI.Components.SectionHeader({
        id: "Gender",
        position: {x: 25, y: 30},
        text: {i18n: "ui.genderselect.section1"}
    }).Attach(this);
}

GenderSelect._OnSelect = function(){
    this.parameters.unit.SetGender(this.options.GetCurrentOption().data);
    UI.UnloadMenu(this);
    if(this.parameters.creation) UI.LoadMenu("ClassSelect", this.parameters);
}

GenderSelect._OnBack = function(){
    UI.UnloadMenu(this);
    if(this.parameters.creation) UI.LoadMenu("RaceSelect", this.parameters);
}


module.exports = GenderSelect;
},{"./basemenu.js":39}],43:[function(require,module,exports){
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
            
    new UI.Components.Text({id: "Header", text: "ElonaJS Electron Ver. 0.0.1" , position: {x: 0, y: 25, z: 2}, size: 24, color: "white", alignment: "top-left"}).Attach(this);
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

LoadingScreen.Message = function(str, final){
    if(this.num_messages == 0) this.start = Date.now();
    else {
        this.components.Messages[this.num_messages-1].SetText(this.components.Messages[this.num_messages-1].GetText() + " done. (" + (Date.now() - this.last) + "ms)");
    }
    if(final) str += " (" + (Date.now()-this.start) + "ms)";
    new UI.Components.Text({id: this.num_messages, position: {y: 65 + 18 * this.num_messages, z: 2}, text: str,size: 16, color: "white"}).Attach(this, "Messages");
    this.components.lg.SetBasePosition(this.components.Messages[this.num_messages].GetRight() + 50, this.components.Messages[this.num_messages].GetActualPosition().y + 8);
    this.last = Date.now();
    this.num_messages++;
    this.components.lg.Align({x: 0, y: 0});
}

module.exports = LoadingScreen;
},{"./basemenu.js":39}],44:[function(require,module,exports){
/** 
 * The RaceSelect menu. Will display a list of playable races, allowing the user to select a race. When this menu is loaded, it must be passed an object containing the unit to be modified. On selection, the menu will set the unit's race, then either exit or continue along the character creation process if the flag is set.
 * @name RaceSelect 
 * @extends ElonaJS.UI.Menus.BaseMenu
 * @memberof ElonaJS.UI.Menus
*/

let BaseMenu = require("./basemenu.js");

let RaceSelect = new BaseMenu();

RaceSelect.Customize({centered: true, size: {w: 720, h: 500}});
RaceSelect.sounds.select = "spell";

/**
 * @name _OnLoad
 * @param {Object} parameters
 * @param {Boolean} parameters.creation Whether the unit will be newly created
 * @param {ElonaJS.GameObjects.Unit} parameters.unit The unit to be modified
 * @function
 * @memberof! ElonaJS.UI.Menus.RaceSelect
 */
RaceSelect._OnLoad = function(parameters){
    this.parameters = parameters;
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
        id: "Header",
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

    let attb = DB.Attributes.Search({primary: true});

    for(let i = 0; i < attb.length; i++){
        let val = attb[i];
        new UI.Components.Image({id: val.id, img: val.icon, position: {x: 210 + 130 * (i%3), y: 225 + 19 * Math.floor(i/3), z: 3}}).Attach(this, "attb_icons");
        new UI.Components.Text({id: val.id, position: {x: 230 + 130 * (i%3), y: 225 + 19 * Math.floor(i/3)}}).Attach(this, "attb_text");
    }

    this._BuildList();
}

RaceSelect._BuildList = function(){
    if(!this.races) this.races = DB.Races.Search({playable: true});
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

    this.options.CustomizeList({
        position: {x: 75, y: 70},
        perpage: 20
    });

    this.options.Set(opt);
}

RaceSelect._PreviewData = function(){
    let op = this.options.GetCurrentOption();
    let ipara = DB.Graphics.GetByID("character." + op.preview.pic1);
    this.components.Desc.SetText(i18n(op.preview.desc));
    this.components.CPrev1.SetImage("character." + op.preview.pic1);
    this.components.CPrev2.SetImage("character." + op.preview.pic2);

    if(ipara){
        let offset = (ipara.offY ? ipara.offY : 0);
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
    let attb = DB.Attributes.Search({primary: true});
    let atbStr = i18n("attributes.magnitude");
    let cstats = op.preview.race.base_attributes;

    for(let i = 0; i < attb.length; i++){
        let val = attb[i].id;

        if(this.components.attb_text[val]){
            let str;
            let style = {fill: "black"};
     
            if (cstats[val] == 0){str = i18n("attributes.magnitude.none"); style.fill = "rgb(120, 120, 120)";} else
            if (cstats[val] > 13){str = i18n("attributes.magnitude.best"); style.fill = "rgb(0, 0, 200)";} else
            if (cstats[val] > 11){str = i18n("attributes.magnitude.great"); style.fill = "rgb(0, 0, 200)";} else
            if (cstats[val] > 9){str = i18n("attributes.magnitude.good"); style.fill = "rgb(0, 0, 150)";} else
            if (cstats[val] > 7){str = i18n("attributes.magnitude.not_bad"); style.fill = "rgb(0, 0, 150)";} else
            if (cstats[val] > 5){str = i18n("attributes.magnitude.normal"); style.fill = "rgb(0, 0, 0)";} else
            if (cstats[val] > 3){str = i18n("attributes.magnitude.little"); style.fill = "rgb(150, 0, 0)";} else
            if (cstats[val] > 0){str = i18n("attributes.magnitude.slight"); style.fill = "rgb(200, 0, 0)";}

            this.components.attb_text[val].SetText(i18n(DB.Attributes.GetByID(val).short).initCap() + ": " + str);
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
            this.components.SkillImages[o].SetImage(DB.Attributes.GetByID(skill.attr).icon);
        } else{
            new UI.Components.Text({id: o, i18n: skill.name, position: {x: 230, y: 310 + 16 * o}}).Attach(this, "SkillText");
            this.components.SkillText[o].SetText(i18n(skill.name).initCap());
            new UI.Components.Text({id: o, i18n: skill.desc1, position: {x: 340, y: 310 + 16 * o}}).Attach(this, "SkillDesc");
            new UI.Components.Image({id: o, img: DB.Attributes.GetByID(skill.attr).icon, position: {x: 210, y: 310 + 16 * o, z: 3}}).Attach(this, "SkillImages");
        }

        o++;
    }

    if(!this.components.SkillText[0]){
        new UI.Components.Text({id: "0", text: wpnstr, position: {x: 230, y: 310}}).Attach(this, "SkillText");
        new UI.Components.Image({id: "0", img: DB.Attributes.GetByID("Strength").icon, position: {x: 210, y: 310, z: 3}}).Attach(this, "SkillImages");
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

RaceSelect._OnSelect = function(){
    this.parameters.unit.SetRace(this.options.GetCurrentOption().preview.race.id);
    UI.UnloadMenu(this);
    if(this.parameters.creation){
        UI.LoadMenu("GenderSelect", this.parameters);
    }
}

RaceSelect._OnBack = function(){
    UI.UnloadMenu(this);
    UI.LoadMenu("TitleScreen")
}

module.exports = RaceSelect;
},{"./basemenu.js":39}],45:[function(require,module,exports){
let BaseMenu = require("./basemenu.js");

/**
 * The race select menu.
 * @name SettingsMenu
 * @type ElonaJS.UI.Menus.BaseMenu
 * @memberOf ElonaJS.UI.Menus
 */
let SettingsMenu = new BaseMenu();

SettingsMenu.Customize({
    position: {x: 175, y: 100},
    centered: true,
    size: {w: 450, h: 400}
});

SettingsMenu._OnLoad = function(category){
    if(this.init){
        this._BuildOptions(category);
        return;
    }

    this.init = true;

    new UI.Components.Image({id: "Paper", img: "interface.paper", position: {z: 0}, width: 450, height: 400, shadow: {distance: 10, blur: 0}}).Attach(this);
    new UI.Components.Image({id: "BG_Deco", img: "cbg3", position: {x: 30, y: 40, z: 1}, width: 290, height: 350, alpha: 0.2}).Attach(this);
    new UI.Components.PaperFooter({id: "Hint", position: {x: 30, y: 370}, text: {i18n: "hints.3b"}, rect: {width: 350}}).Attach(this);
    new UI.Components.PaperHeader({id: "Display", text: {text:"Display Settings"}}).Attach(this);
    new UI.Components.Text({id: "Desc", text: "", position: {x: 50, y: 340}, color: "blue", wrap: {width: 350, spacing: 16}}).Attach(this);
    this._BuildOptions(category);
}

SettingsMenu._BuildOptions = function(category){
    let setlist = DB.Settings.Search({category: category});
    let options = [];


    for(let i = 0; i < setlist.length; i++){
        options.push(setlist[i].GetAsOption());
    }

    this.options.CustomizeList({position: {x: 60, y: 50}, spacing: 25});
    this.options.CustomizeStyle({keyimage: {enabled: false}, keytext: {enabled: false}});
    this.options.Set(options);
}

SettingsMenu._OnBack = function(){
    UI.UnloadMenu(this);
    UI.LoadMenu("TitleScreen");
}

module.exports = SettingsMenu;
},{"./basemenu.js":39}],46:[function(require,module,exports){
let BaseMenu = require("./basemenu.js");

/**
 * The race select menu.
 * @name TextInput
 * @type ElonaJS.UI.Menus.TextInput
 * @memberOf ElonaJS.UI.Menus
 */
let TextInput = new BaseMenu();

TextInput.Customize({centered: true, size: {w: 220, h: 55}});

TextInput._OnLoad = function(){
    this.active = true;

    if(this.init){
        let pos = this.components.Input.GetBasePosition();
        this.components.Input.SetText("");
        this.components.Indicator.SetBasePosition(pos.x + 5);
        return;
    }

    this.init = true;
    this.dir = 0;

    new UI.Components.Image({id: "Box", img: "interface.header1", width: 220, height: 35, shadow: {distance: 10, blur: 0}}).Attach(this);
    new UI.Components.Image({id: "Header", img: "interface.input_header", position: {x: 50, y: -26}}).Attach(this);
    new UI.Components.Image({id: "Icon", img: "interface.icon_inputLatin", position: {x: 15, y: 8}}).Attach(this);
    new UI.Components.Image({id: "Indicator", img: "interface.input_indicator", position: {x: 40, y: 10}}).Attach(this);
    new UI.Components.Text({id: "Input", position: {x: 40, y: 10}, color: "white"});
    App.ticker.add(this._FlashIndicator, this);
}

TextInput._FlashIndicator = function(){
    let elem = this.components.Indicator.sprite;
    if(elem.alpha >= 1){this.dir = -0.01;}
    if(elem.alpha <= 0){this.dir = 0.01;}
    elem.alpha += this.dir;
}

TextInput._OnExit = function(){
    App.ticker.remove(this._Animate, this);
}

module.exports = TextInput;





/* 

    menu.OnInput = function(val){

        if(val == "Backspace") {
            this.components.ITxt.text = this.components.ITxt.text.slice(0, this.components.ITxt.text.length - 1);
            this.components.IIndi.EJS.x = this.components.ITxt.EJS.x + (this.components.ITxt.width / ElonaJS.GetUIScale()) + 5;
            this._Align(this.components.IIndi);
        }

        if(val == "Enter"){
            Graphics.UnloadMenu(this);
            if(this.callback) this.callback(this.components.ITxt.text);
        }

        if(val.length != 1) return;

        this.components.ITxt.text += val;
        this.components.IIndi.EJS.x = this.components.ITxt.EJS.x + (this.components.ITxt.width / ElonaJS.GetUIScale()) + 5;
        this._Align(this.components.IIndi);
    }

    */
},{"./basemenu.js":39}],47:[function(require,module,exports){
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

    this.options.CustomizeList({position: {x: 70, y: 53}, spacing: 35, perpage: 6});

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
                State.Player = new GameObjects.Unit();
                UI.LoadMenu("RaceSelect", {creation: true, unit: State.Player});
                break;
        case 4: UI.UnloadMenu(this);
                UI.LoadMenu("SettingsMenu", "display");
                break;
    }
}


module.exports = TitleScreen;
},{"./basemenu.js":39}],48:[function(require,module,exports){
let UI = require("./uihandler.js");

UI.Components = require("./Components/Components.js");
UI.Menus = require("./Menus/Menus.js");


module.exports = UI;
},{"./Components/Components.js":25,"./Menus/Menus.js":37,"./uihandler.js":49}],49:[function(require,module,exports){
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

UI._lsFade = function(){
    this._ls.container.alpha -= 0.01;
    if(this._ls.container.alpha <= 0){
        App.ticker.remove(this._lsFade, this);
    }
}

UI.HideLS = function(fade){
    if(fade){
        App.ticker.add(this._lsFade, this);
   } else  this._ls.container.visible = false;
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

UI.Resize = function(){
    this._SetResolution();
    this._ResizeCanvas();
    
    
    //for(let i = 0; i < this._menuStack.length; i++) if(this._menuStack[i].Resize) this._menuStack[i].Resize();
    //UI.Menus.Ripple.Resize();
}


UI._SetResolution = function(){
    let dims = Utils.Parse.Dim2DInt(Settings.GetByID("canvas_resolution").value);

    if(Settings.GetByID("adaptive_res").value == false){
        App.renderer.resize(dims.x, dims.y);
        this._canvas.width = dims.x;
        this._canvas.height = dims.y;
    } else {
        App.renderer.resize(parseInt(this._canvas.style.width), parseInt(this._canvas.style.height));
    }
}

UI._ResizeCanvas = function(){
    let dims = Utils.Parse.Dim2DInt(Settings.GetByID("canvas_size").value);

    if(Settings.GetByID("adaptive_res").value == false){
        if(Sys.env == "node"){
            electron.ipcRenderer.send('resize', dims.x, dims.y);
        } 

        this._canvas.style.width = dims.x + "px";
        this._canvas.style.height = dims.y + "px";
    } else {
        this._canvas.style.width = window.innerWidth + "px";
        this._canvas.style.height = window.innerHeight + "px";
    }

    this._SetResolution();
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
},{}],50:[function(require,module,exports){
'use strict'

/**
 * @memberOf ElonaJS
 * @property {ElonaJS.Utils.File} File A collection of File utilities
 * @namespace ElonaJS.Utils
 * @description Hi, this is a description.
 */
let Utils = {
    File: require("./file.js"),
    Math: require("./math.js"),
    Parse: require("./parse.js")
}

module.exports = Utils;
},{"./file.js":51,"./math.js":52,"./parse.js":53}],51:[function(require,module,exports){
'use strict'

let env = (typeof process === "object" ? "node" : "browser");
let fs = (env == "node" ? require("fs") : undefined);

function sanitizePath(str){
    if(str.charAt(0) == ".") return str.slice(1);
    return str;
}


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
        if(env == "node"){
            path = __baseDir + sanitizePath(path)
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
        if(env == "node"){
            path = __baseDir + sanitizePath(path)
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
},{"fs":undefined}],52:[function(require,module,exports){
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

math_util.Limit = function(value, min, max){
    let val = Math.max(value, min);
    val = Math.min(val, max);
    return val;
}

module.exports = math_util;
},{}],53:[function(require,module,exports){
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

Parse.Dim2DInt = function(str){
    let n = str.replace(" ", "");
    n = n.split("x");

    if(n.length != 2) return undefined;
    n[0] = parseInt(n[0]);
    n[1] = parseInt(n[1]);

    if(isNaN(n[0]) || isNaN(n[1])) return undefined;
    return {x: n[0], y: n[1]}
}


module.exports = Parse;
},{}]},{},[8]);
