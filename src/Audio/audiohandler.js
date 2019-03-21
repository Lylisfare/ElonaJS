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