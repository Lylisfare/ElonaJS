# ElonaJS

ElonaJS is a port of the Japanese roguelike game of the same name to javascript, running in both the browser and in Electron. Rather than strict port, ElonaJS intends to maintain the original functionality of the game while entirely restructuring the code to improve numerous things about the game, such as modding and internationalization.


## Getting Started

First, download or clone the repository. From there, you have two options:

##### Running in Browser

To run ElonaJS in the browser, simply start up a local http server pointed at the ElonaJS directory. Navigate your browser to the address of your local server, and the game should start up.

(Note: ElonaJS must be accessed through a server due to browser CORS policies. Simply opening the index.html file will not work.)

#### Electron

In order to run the Electron build in a dev environment, you will need NodeJS/NPM installed. 

1) Install the project dependencies. From the project folder: 

```
npm install
```

2) Run the start script:

```
npm start
```

## Building

The browser version can be deployed as-is without any modifications.

For the Electron version, run the build script:

```
npm run-script build
```

This will:
1) Create a minified version of ElonaJS
2) Rebuild all game data and create a concatenated JSON file.
3) Package the data into "dist/\<platform>" folders.

To modify output platforms, modify package.js under the "scripts/" folder.