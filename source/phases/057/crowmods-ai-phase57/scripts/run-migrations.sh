#!/usr/bin/env sh
set -eu

cd backend
npm install
npm run migrate
