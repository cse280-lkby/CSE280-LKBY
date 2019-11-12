#!/bin/bash

SERVERDIR=$(pwd)

# Build the latest text interface
cd ../../text-interface
npm run build

# Run the server
cd $SERVERDIR
node src/text-server.js