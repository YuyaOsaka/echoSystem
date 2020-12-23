#!/bin/bash

zip -r nodejs.zip ./

aws lambda update-function-code \
    --function-name SpeechOnDuty \
    --zip-file fileb://nodejs.zip