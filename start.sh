#!/bin/bash

# Start the Python Producer in the background
python3 producer.py &

# Start the Node.js API Hub in the foreground
node index.js