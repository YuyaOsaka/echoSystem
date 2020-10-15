#!/bin/bash

git archive HEAD --output=nodejs.zip

aws lambda update-function-code \
    --function-name HelloWorldTestSkill \
    --zip-file fileb://nodejs.zip