## Solid bench demo

The solid bench data is deployed on `the wall`, make sure you can connect to it.
Also make sure you started a [solid-aggregator-server](https://github.com/maartyman/solid-aggregator-server).

```
npm install
npm build
cd SolidBench/
```

(
"start register-queries": "npx tsc && node ./setupAndStartServers.js",
"start simple-query": "npx tsc && node ./simple-query.js",
"start complex-query": "npx tsc && node ./complex-query.js",
"start link-traversal-query": "npx tsc && node ./link-traversal-query.js",
"start reasoning-query": "npx tsc && node ./reasoning-query.js",
"start update-example": "npx tsc && node ./update-example.js",
)
```
npm run start register-queries
npm run start simple-query
npm run start complex-query
npm run start link-traversal-query
npm run start reasoning-query
npm run start update-example
```
