import {SolidClient, QueryContext} from "solid-aggregator-client";
import fetch from "cross-fetch";
import chalk from "chalk";

console.log(chalk.blue("Aggregated"));
console.log(chalk.green("Client"));

const solidClient = new SolidClient(
  "http://localhost:3000/pods/00000000000000000933/",
  fetch,
  "http://localhost:3001",
  "fatal"
);

const queryString = `
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

const sources: [string, ...string[]] = [
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

async function doAggregatedQuery() {
  const queryContext: QueryContext = {
    query: queryString,
    sources: sources,
    aggregated: true
  };

  let query = solidClient.makeQuery(queryContext);

  await query.getBindings();

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
    }
  };

  let query = solidClient.makeQuery(queryContext);

  await query.getBindings();

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
