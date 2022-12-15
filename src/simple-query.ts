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
PREFIX snvoc: <http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/>

SELECT ?friend WHERE {
  <http://localhost:3000/pods/00000000000000000933/profile/card#me> snvoc:knows ?n . 
  ?n snvoc:hasPerson ?friend . 
}
`;

const sources: [string, ...string[]] = ["http://localhost:3000/pods/00000000000000000933/profile/card"];

async function doAggregatedQuery() {
  const queryContext: QueryContext = {
    query: queryString,
    sources: sources,
    aggregated: true
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
    }
  };

  let query = solidClient.makeQuery(queryContext);

  await query.queryReadyPromise();

  const timeMake = performance.now();
  query.getBindings().then((bindings) => {
    console.log(chalk.green(`Result client (` + ((performance.now() - timeMake)/1000).toLocaleString(undefined,{minimumFractionDigits: 3}) + ` s): `));
    for (const binding of bindings) {
      //console.log(binding);
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
