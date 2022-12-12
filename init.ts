import {QueryContext} from "../src/utils/queryContext";
import {SolidClient} from "../src/classes/SolidClient";
import fetch from "cross-fetch";
import {TComunicaContext, TComunicaVersion} from "../src/queryExecutorPackage/queryExecutor/queryExplanation";
import decompress from "decompress";

async function setupCSSServer() {
  console.log("Decompressing data. This might take a while!");

  decompress("./SolidBenchServerData.zip", "SolidBenchServerData").then(() => {
    console.log("Decompressing finished!");
  });


}

async function setupAggregatorServer() {
  console.log("Initializing Aggregator server.");




  const solidClient = new SolidClient(
    "http://localhost:3000/pods/00000000000000000933/",
    fetch,
    "http://localhost:3001",
    "fatal"
  );

  async function makeAggregatedQuery(
    queryString: string,
    sources: [string, ...string[]],
    comunicaVersion?: TComunicaVersion,
    comunicaContext?: TComunicaContext
  ) {
    const queryContext: QueryContext = {
      query: queryString,
      sources: sources,
      aggregated: true,
      comunicaVersion: comunicaVersion,
      comunicaContext: comunicaContext
    };

    await solidClient.makeQuery(queryContext);
  }

//simple and update
  let queryString = `
PREFIX snvoc: <http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/>

SELECT ?friend WHERE {
  <http://localhost:3000/pods/00000000000000000933/profile/card#me> snvoc:knows ?n . 
  ?n snvoc:hasPerson ?friend . 
}
`;

  let sources: [string, ...string[]] = ["http://localhost:3000/pods/00000000000000000933/profile/card"];

  console.log("Adding simple query.");
  makeAggregatedQuery(queryString, sources).then(() => {
    console.log("Simple query added.");
  });

//complex
  queryString = `
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
    <http://localhost:3000/pods/00000000000000000933/profile/card#me> (((snvoc:knows/snvoc:hasPerson)|^(snvoc:knows/snvoc:hasPerson))/((snvoc:knows/snvoc:hasPerson)|^(snvoc:knows/snvoc:hasPerson))/((snvoc:knows/snvoc:hasPerson)|^(snvoc:knows/snvoc:hasPerson))) ?fr. 
  }
  ?fr snvoc:id ?frId.
  FILTER(?frId != ?rootId)
  BIND(IF((COALESCE(?distOneInner, 4 )) < 4 , 1 , IF((COALESCE(?distTwoInner, 4 )) < 4 , 2 , 3 )) AS ?distInner)
}
GROUP BY ?fr
ORDER BY ASC(?dist)
LIMIT 20
`;

  sources = [
    "http://localhost:3000/pods/00000000000000000102/profile/card#me",
    "http://localhost:3000/pods/00000000000000000296/profile/card#me",
    "http://localhost:3000/pods/00000000000000000318/profile/card#me",
    "http://localhost:3000/pods/00000000000000001355/profile/card#me",
    "http://localhost:3000/pods/00000002199023257239/profile/card#me",
    "http://localhost:3000/pods/00000004398046511587/profile/card#me",
    "http://localhost:3000/pods/00000006597069766678/profile/card#me",
    "http://localhost:3000/pods/00000006597069766725/profile/card#me",
    "http://localhost:3000/pods/00000006597069767242/profile/card#me",
    "http://localhost:3000/pods/00000019791209301454/profile/card#me",
    "http://localhost:3000/pods/00000026388279067534/profile/card#me",
    "http://localhost:3000/pods/00000032985348834375/profile/card#me",
    "http://localhost:3000/pods/00000006597069767341/profile/card#me",
    "http://localhost:3000/pods/00000006597069768275/profile/card#me",
  ];

  console.log("Adding complex query.");
  makeAggregatedQuery(queryString, sources).then(() => {
    console.log("Complex query added.");
  });

//link-traversal
  queryString = `
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
`;

  sources = ["http://localhost:3000/pods/00000000000000000933/"];

  console.log("Adding link-traversal query.");
  makeAggregatedQuery(queryString, sources,"link-traversal","link-traversal-follow-match-query").then(() => {
    console.log("Link-traversal query added.");
  });
}

