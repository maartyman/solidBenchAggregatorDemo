import {SolidClient, QueryContext} from "solid-aggregator-client";
import chalk from "chalk";
import {allPods} from "./allpods";
import {RDFResource} from "../src/classes/RDFResource";
import fetch from "cross-fetch";
import {DataFactory, Quad} from "n3";
import blankNode = DataFactory.blankNode;
import N3 from "n3";
import literal = DataFactory.literal;
import namedNode = DataFactory.namedNode;

console.log(chalk.blue("Aggregated"));
console.log(chalk.green("Client"));

const solidClient = new SolidClient(
  "http://localhost:3000/pods/00000000000000000933/",
  fetch,
  "http://localhost:3001",
  "fatal"
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

  query.streamBindings((bindings, addition) => {
    if (addition) {
      console.log(chalk.blue("added bindings: "));
      bindings.forEach((value, key) => {
        console.log(chalk.blue("\t" + key.value.toString() + ": " + value.value.toString()));
      });
    }
    else {
      console.log(chalk.blue("removed bindings: "));
      bindings.forEach((value, key) => {
        console.log(chalk.blue("\t" + key.value.toString() + ": " + value.value.toString()));
      });
    }
  });
}

async function doClientQuery() {
  const queryContext: QueryContext = {
    query: queryString,
    sources: sources,
    aggregated: false,
    local: {
      guarded: true
    }
  };

  let query = solidClient.makeQuery(queryContext);

  query.streamBindings((bindings, addition) => {
    if (addition) {
      console.log(chalk.green("added bindings: "));
      bindings.forEach((value, key) => {
        console.log(chalk.green("\t" + key.value.toString() + ": " + value.value.toString()));
      });
    }
    else {
      console.log(chalk.green("removed bindings: "));
      bindings.forEach((value, key) => {
        console.log(chalk.green("\t" + key.value.toString() + ": " + value.value.toString()));
      });
    }
  });
}

doAggregatedQuery();
doClientQuery();

async function changeStuff() {
  let resource = new RDFResource('http://localhost:3000/pods/00000000000000000933/profile/card');

  await solidClient.getResource(resource);

  const pod = allPods[Math.floor(Math.random()*allPods.length)];
  const bn = blankNode();
  if (resource.data instanceof N3.Store){
    resource.data.add(
      new Quad(
        bn,
        namedNode("http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/creationDate"),
        literal((new Date()).toISOString(),namedNode("http://www.w3.org/2001/XMLSchema#dateTime"))
      )
    );
    resource.data.add(
      new Quad(
        bn,
        namedNode("http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/hasPerson"),
        namedNode(pod)
      )
    );
    resource.data.add(
      new Quad(
        namedNode("http://localhost:3000/pods/00000000000000000933/profile/card#me"),
        namedNode("http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/knows"),
        bn
      )
    );
  }

  await solidClient.makeResource(resource);

  setTimeout(changeStuff, 5000);
  setTimeout(() => {changeStuffBack(pod)}, 3000);
}

async function changeStuffBack(pod: string) {
  let resource = new RDFResource('http://localhost:3000/pods/00000000000000000933/profile/card');

  await solidClient.getResource(resource);

  if (resource.data instanceof N3.Store){
    const hasPerson = resource.data.getQuads(null, namedNode("http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/hasPerson"), namedNode(pod), new N3.DefaultGraph);
    resource.data.delete(hasPerson[0]);

    const creationDate = resource.data.getQuads(hasPerson[0].subject, namedNode("http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/creationDate"), null, new N3.DefaultGraph);
    resource.data.delete(creationDate[0]);

    const knows = resource.data.getQuads(namedNode("http://localhost:3000/pods/00000000000000000933/profile/card#me"), namedNode("http://localhost:3000/www.ldbc.eu/ldbc_socialnet/1.0/vocabulary/knows"), hasPerson[0].subject, new N3.DefaultGraph);
    resource.data.delete(knows[0]);
  }

  await solidClient.makeResource(resource);
}

setTimeout(changeStuff, 5000);
