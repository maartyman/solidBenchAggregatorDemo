## Solid bench demo

This is a demo for the [solid-aggregator-client](https://github.com/maartyman/solid-aggregator-client) and [solid-aggregator-server](https://github.com/maartyman/solid-aggregator-server) packages.
The demo uses generated data from the [solidbench](https://github.com/SolidBench/SolidBench.js) benchmark.
To start the demo, first run the following commands to install all dependencies and start the servers:

```
npm i
npm run setupAndStartServers
```

This second command will first decompress the solidbench data (located in SolidBenchServerData.zip) and it will then start a [Community Solid Server](https://github.com/CommunitySolidServer/CommunitySolidServer) to host this data.
Next, it will start an [aggregator server](https://github.com/maartyman/solid-aggregator-server).
Finally, it will populate this aggregator server with the queries from the 4 demo's.
When this is done a message will pop up in the console saying: `Everything is setup and ready for the demo!`.

There are four demos for the aggregator server:

### Demo 1

The first demo executes a simple query:

```
PREFIX snvoc: <http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/>

SELECT ?friend WHERE {
  <http://localhost:3000/pods/00000000000000000933/profile/card#me> snvoc:knows ?n . 
  ?n snvoc:hasPerson ?friend . 
}
```

This query finds all the WebId's of the friends of pod `00000000000000000933`.

To run this demo, run the following command:

```
npm run simple-query
```

There will be two results, one from the aggregator server (blue) and one from the client (green).
The client query will take a bit longer because the query is actually ran twice.
The first time is to make sure that the query engine is build and set up, the second is timed to see how long the query took to process.

### Demo 2

The second demo executes a more complex query:

```
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX snvoc: <http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
SELECT ?fr (MIN(?distInner) AS ?dist) WHERE {
  <http://localhost:3000/pods/00000000000000000102/profile/card#me> rdf:type snvoc:Person;
    snvoc:id ?rootId, ?rootId.
  ?fr rdf:type snvoc:Person.
  {
    <http://localhost:3000/pods/00000000000000000102/profile/card#me> ((snvoc:knows/snvoc:hasPerson)|^(snvoc:knows/snvoc:hasPerson)) ?fr.
    BIND(1  AS ?distOneInner)
  }
  UNION
  {
    <http://localhost:3000/pods/00000000000000000102/profile/card#me> (((snvoc:knows/snvoc:hasPerson)|^(snvoc:knows/snvoc:hasPerson))/((snvoc:knows/snvoc:hasPerson)|^(snvoc:knows/snvoc:hasPerson))) ?fr.
    BIND(2  AS ?distTwoInner)
  }
  UNION
  { 
    <http://localhost:3000/pods/00000000000000000102/profile/card#me> (((snvoc:knows/snvoc:hasPerson)|^(snvoc:knows/snvoc:hasPerson))/((snvoc:knows/snvoc:hasPerson)|^(snvoc:knows/snvoc:hasPerson))/((snvoc:knows/snvoc:hasPerson)|^(snvoc:knows/snvoc:hasPerson))) ?fr. 
    BIND(3  AS ?distTwoInner)
  }
  ?fr snvoc:id ?frId.
  FILTER(?frId != ?rootId)
  BIND(IF((COALESCE(?distOneInner, 4 )) < 4 , 1 , IF((COALESCE(?distTwoInner, 4 )) < 4 , 2 , 3 )) AS ?distInner)
}
GROUP BY ?fr
ORDER BY ASC(?dist)
```

This query determines the distance between user `00000000000000000102` and some predetermined users.
The `dist` variable will tell the amount of hops.
A distance of one means that the two users are friends,
A distance of two means the two users are a fiend of a friend, etc.

To run this demo, use the following command:

```
npm run complex-query
```

### Demo 3

The third demo is a link-traversal demo:

```
PREFIX ldp: <http://www.w3.org/ns/ldp#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX snvoc: <http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/>
SELECT DISTINCT ?content ?forumName WHERE {
    ?post rdf:type snvoc:Post .
    ?post snvoc:content ?content .
    ?resource1 ldp:contains ?resource2 .
    ?post rdfs:seeAlso ?forum .
    ?forum snvoc:title ?forumName .
}
```

This query will find all the posts in a pod, and it will output where they were posted (forumName) and the content of the post.

Run this demo with the following command:

```
npm run link-traversal-query
```

### Demo 4

This demo uses the query from [Demo 1](#demo-1).
But here we will add and remove a friend every 2 seconds.
The time in seconds from the point that the change is sent to the server, to the point that the query engine has calculated the new bindings is shown between the brackets.

To run this demo, run the following command:

```
npm run update-example
```
