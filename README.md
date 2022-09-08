# GSM Mod (Google Snake Multiplayer Mod)

A mod that makes google snake game multiplayer!

Easy usage, only paste code on console (and disable secure content if you are connecting to a remote server, explained on browser usage).

This project uses [vf-ext](https://github.com/vanflux/vf-ext) to create browser extensions(only development). If you want to create extensions like this, take a look.

This mod tries to make the multiplayer experience to be the smoothest as possible and not network destroyer by not predicting, but interpolating from backwards to the current player state, it implies in you always seeing the other players with their `ping * 2`, what is not a big deal here, but hmm.

## Demo

![Demo gif](docs/gifs/demo.gif)

## Usage

If you already has a server to connect go to [Browser Setup](#browser-setup), if not you will need to host your own([Server Setup](#server-setup));

### Server

- Install Node 16
- Clone repository: `git clone git@github.com:vanflux/google-snake-multiplayer-mod.git`
- Go to repository folder: `cd google-snake-multiplayer-mod`
- Install dependencies: `npm i`
- Run server: `npm run server`

### Browser

- Download the `gsm-bookmark.html` file from the [latest release](https://github.com/vanflux/google-snake-multiplayer-mod/releases)
- Open `chrome://bookmarks/` on google chrome (sorry, firefox is not supported now)
- At the top on the right, click on the three-dots icon > `Import bookmarks` > select the downloaded `gsm-bookmark.html` file
- Open snake game
- At the top on the right, click on the three-dots icon > Bookmarks > GSM Mod
- Enjoy
- **EXTRA**: If you are **NOT** connecting to "localhost" or "127.0.0.1" you will need to do the following to disable secure content:

![Insecure content step 1](docs/images/insecure-content-1.png)
![Insecure content step 2](docs/images/insecure-content-2.png)

## Development

- Install Node 16
- Clone repository
- Install dependencies: `npm i`
- Run browser code as an auto reload extension: `npm start <chrome/firefox>`
- Load the extension located on `build/dev` on your browser
- Run server with `npm run server`

## Problems/improvements

- Each player sends around 5 data objects to the server per second, each data object is around 1.5kB. If you have 2 players playing for an hour on the server, the outgoing and the incoming network is estimated on 54MB. Which stills pretty big for this game. It can be improved by serializing only the differences of the game instance, not the "entire" object, but it is NOT implemented at this point.

- The foods are being shared, but sometimes flickering occurs, maybe implement this logic on server-side? Or electing a client to be leader responsible for generation this? The second solution is terrible for hackers(I think it isnt a deal here), but is the most easy and problem-free.
