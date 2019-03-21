let DrawTexture = function (rt, bt, x, y, w, h, dx, dy){
    let ct = new PIXI.Texture(bt, new PIXI.Rectangle(x, y, w, h));
    let cs = new PIXI.Sprite(ct);
    cs.position.set(dx, dy);
    App.renderer.render(cs, rt, false);
};

module.exports = DrawTexture;