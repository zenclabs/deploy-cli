import * as awsDeployment from "../service/aws/deployment/adhoc";
import * as awsLoader from "../service/aws/loader";
import * as program from "commander";

import { checkedEnvironmentAction } from "./common";

program
  .command("destroy-deployment <name>")
  .option(
    "-r, --region <region>",
    "Optional. The region in which the deployment was created."
  )
  .action(
    checkedEnvironmentAction(
      async (name: string, options: { region: string }) => {
        let deployments = await awsLoader.loadDeployments();
        let foundDeployment = null;
        for (let deployment of deployments) {
          if (options.region && deployment.region !== options.region) {
            continue;
          }
          if (deployment.id === name) {
            if (foundDeployment) {
              if (options.region) {
                // This should never happen, but you never know.
                throw new Error(
                  `There are several deployments named ${name} in the region ${
                    options.region
                  }.`
                );
              } else {
                throw new Error(
                  `There are several deployments named ${name}. Please use --region to limit results.`
                );
              }
            }
            foundDeployment = deployment;
          }
        }
        if (!foundDeployment) {
          throw new Error(`No deployment ${name} could be found.`);
        }
        await awsDeployment.destroy(
          foundDeployment.region,
          foundDeployment.clusterName,
          foundDeployment.id
        );
      }
    )
  );
