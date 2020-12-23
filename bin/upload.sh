#!/bin/bash

zip -r nodejs.zip ./

aws s3 cp nodejs.zip s3://alexa-speechskill/ 

