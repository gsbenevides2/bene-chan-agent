#!/bin/sh

bun run build

cp -r public .next/standalone
cp -r .next/static .next/standalone/.next


bun run --env-file=./.env .next/standalone/server.js