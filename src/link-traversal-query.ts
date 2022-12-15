import {SolidClient, QueryContext} from "solid-aggregator-client";
import fetch from "cross-fetch";
import chalk from "chalk";

console.log(chalk.blue("Aggregated"));
console.log(chalk.green("Client"));

const solidClient = new SolidClient(
  "http://localhost:3000/pods/00000000000000000933/",
  fetch,
  "http://localhost:3001",
  "warn"
);

const queryString = `
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

const sources: [string, ...string[]] = ["http://localhost:3000/pods/00000000000000000933/"];

async function doAggregatedQuery() {
  const queryContext: QueryContext = {
    query: queryString,
    sources: sources,
    aggregated: true,
    comunicaVersion: "link-traversal",
    comunicaContext: "link-traversal-follow-match-query"
  };

  let query = solidClient.makeQuery(queryContext);

  await query.queryReadyPromise();

  const timeMake = performance.now();
  query.getBindings().then((bindings) => {
    console.log(chalk.blue(`Result aggregated (` + ((performance.now() - timeMake)/1000).toLocaleString(undefined,{minimumFractionDigits: 3}) + ` s): `));
    for (const binding of bindings) {
      console.log(chalk.blue("\tbindings: "));
      binding.forEach((value, key) => {
        console.log(chalk.blue("\t\t" + key.value + ": " + value.value));
      });
    }
    query.delete();
  });
}

async function doClientQuery() {
  const queryContext: QueryContext = {
    query: queryString,
    sources: sources,
    aggregated: false,
    local: {
      guarded: false
    },
    comunicaVersion: "link-traversal",
    comunicaContext: "link-traversal-follow-match-query"
  };

  let query = solidClient.makeQuery(queryContext);

  await query.queryReadyPromise();

  const timeMake = performance.now();
  await query.getBindings().then((bindings) => {
    console.log(chalk.green(`Result client (` + ((performance.now() - timeMake)/1000).toLocaleString(undefined,{minimumFractionDigits: 3}) + ` s): `));
    for (const binding of bindings) {
      console.log(chalk.green("\tbindings: "));
      binding.forEach((value, key) => {
        console.log(chalk.green("\t\t" + key.value + ": " + value.value));
      });
    }
    query.delete();
  });
}

doAggregatedQuery();
doClientQuery();
