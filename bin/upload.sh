#!/bin/bash

zip -r nodejs.zip ./

aws lambda update-function-code \
    --function-name HelloWorldTestSkill \
    --zip-file fileb://nodejs.zip