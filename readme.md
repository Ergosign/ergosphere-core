# Ergosign Ergosphere

This project was created as part of a Hack-a-thon at Ergosign after being given a challenge.

The challenge was to find a way to better connect the people in the 5 Ergosign offices in Germnay and Switzerland.

It was decided to create a panel to be hung on the wall of each kitchen in each location (total 7 kitchens).

The panel would be interactive, and show updates on each location, with weather, latest tweets, most listened to 
music (via last.fm) and other such data.

You can see a video about the process and the results here:

https://vimeo.com/158902080

## Hardware

Currently we use a Windows 10 client, with touch panel as the terminal in each kitchen. Chrome is running as the browser for 
each terminal.

The server requires just a machine that can run node.

## Setting up a Server

To setup an ergosphere server, requires building a seperate node package with ergosphere-core as a dependency.

An example project will be added to better document this.

For the moment, this project can be used.

Please pay attention to the file `config/ergosphere-configuration.json` for the required configuration.

To start the server for development use:

- `npm install`
- `grunt run`

To start the server in production (note SSL must be configured):

- `node app.js startServer`




  