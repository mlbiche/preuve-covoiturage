#!/bin/sh

# script runs from the api folder

# install global dependencies
yarn global add npm-run-all lerna typescript

# install ilos dev branch
git clone https://github.com/betagouv/ilos
cd ilos
# 2020/03/02 use tagged master@0.4.1 until ilos is published or completely cleaned
git checkout 0.4.1
yarn
yarn build
