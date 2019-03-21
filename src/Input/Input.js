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