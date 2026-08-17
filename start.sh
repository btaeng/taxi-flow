#!/bin/bash

# Start the Python Producer in the background
python3 producer/producer.py &

# Start the Node.js API Hub in the foreground
node api-hub/index.js