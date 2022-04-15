#! /bin/bash

echo 'module.exports = {"version": "v2.1.0", "timestamp" : "'$(date -I'seconds')'", "commit" : "'$(git rev-parse HEAD)'" }' > version.js