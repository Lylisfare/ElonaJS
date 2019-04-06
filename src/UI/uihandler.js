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