import * as analytics from "../analytics";
import * as awsLoader from "../service/aws/loader";
import * as console from "../service/console";
import * as inquirer from "inquirer";
import * as program from "commander";
import * as regions from "../service/aws/resources/regions";
import * as route53 from "../service/aws/route53";

import { DocumentedError } from "../service/errors";
import { checkedEnvironmentAction } from "./common";

const DOMAIN_REGEX = /^([a-z0-9]+\.)+[a-z]+$/;

program
  .command("map [deployment-id] [domain]")
  .description(
    "Maps a deployment to a DNS record. Example: map demo dev.domain.com"
  )
  .option(
    "-r, --region <region>",
    "Optional. The region in which the deployment was created."
  )
  .action(
    checkedEnvironmentAction(
      async (
        deploymentId: string | undefined,
        domain: string | undefined,
        options: {
          region?: string;
        }
      ) => {
        analytics.trackEvent(analytics.events.mapDNSCommand());
        let deployments = await awsLoader.loadDeployments();
        let foundDeployment: awsLoader.Deployment | null = null;
        if (!deploymentId) {
          let answers = await inquirer.prompt([
            {
              type: "list",
              name: "deployment",
              message: "Which deployment do you want to map?",
              choices: deployments.map(deployment => {
                return `${deployment.id} - ${regions.getRegionLabel(
                  deployment.region
                )}`;
              })
            }
          ]);
          foundDeployment =
            deployments.find(deployment => {
              return (
                `${deployment.id} - ${regions.getRegionLabel(
                  deployment.region
                )}` === answers["deployment"]
              );
            }) || null;
        } else {
          for (let deployment of deployments) {
            if (options.region && deployment.region !== options.region) {
              continue;
            }
            if (deployment.id === deploymentId) {
              if (foundDeployment) {
                if (options.region) {
                  // This should never happen, but you never know.
                  throw new DocumentedError(
                    `There are several deployments named ${deploymentId} in the region ${
                      options.region
                    }.`
                  );
                } else {
                  throw new DocumentedError(
                    `There are several deployments named ${deploymentId}. Please use --region to limit results.`
                  );
                }
              }
              foundDeployment = deployment;
            }
          }
        }
        if (!foundDeployment) {
          throw new DocumentedError(
            `No deployment ${deploymentId} could be found.`
          );
        }
        if (!domain) {
          let answers = await inquirer.prompt([
            {
              type: "input",
              name: "domain",
              message: `Please enter a domain name, for example www.google.com`,
              validate(input: string): true | string {
                if (typeof input !== "string" || !input.match(DOMAIN_REGEX)) {
                  return `Please enter a valid domain name, for example www.google.com.`;
                }
                return true;
              }
            }
          ]);
          domain = answers["domain"] as string;
        }
        if (!domain.match(DOMAIN_REGEX)) {
          throw new DocumentedError(`${domain} is not a valid domain name.`);
        }
        let tldDotPosition = domain.lastIndexOf(".");
        let rootDomainDotPosition = domain.lastIndexOf(".", tldDotPosition - 1);
        let subdomain = domain.substr(0, rootDomainDotPosition);
        let rootDomain = domain.substr(rootDomainDotPosition + 1);
        if (subdomain.length === 0) {
          subdomain = "@";
        }
        await analytics.trackCall("Map DNS", () =>
          route53.map(
            foundDeployment!.region,
            foundDeployment!.id,
            rootDomain,
            subdomain
          )
        );
        console.logSuccess(
          `Deployment ${deploymentId} should soon be accessible at http://${domain}`
        );
      }
    )
  );
