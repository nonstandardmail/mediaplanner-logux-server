const shiptDeploy = require("shipit-deploy");
const shiptNpm = require("shipit-npm");
const pkg = require("./package.json");

const PROJECT_NAME = pkg.name;
const REPOSITORY =
  "git@github.com:nonstandardmail/mediaplanner-logux-server.git";

module.exports = shipit => {
  const branch = process.env.BRANCH || "master";
  const env = shipit.environment;
  const envFilePath = `./.env.${env}`;

  require("dotenv").config({ path: envFilePath });

  const SERVICE_UID = `mediaplanner-logux-server-${env}`;

  const projectPath = `/home/ubuntu/${PROJECT_NAME}-${env}`;
  const currentProject = `${projectPath}/current`;

  shiptDeploy(shipit);
  shiptNpm(shipit);

  shipit.initConfig({
    default: {
      repositoryUrl: REPOSITORY,
      branch,
      keepReleases: 2,
      deleteOnRollback: true,
      servers: {
        host: "mrginternal",
        user: "ubuntu"
      }
    },
    [env]: {
      deployTo: projectPath
    }
  });

  shipit.task("rebuild", async () => {
    await shipit.copyToRemote(envFilePath, `${currentProject}/.env`);
    shipit.start("restart");
  });

  shipit.task("restart", async () => {
    try {
      await shipit.remote(
        `NODE_ENV=${env} forever restart ${SERVICE_UID} || NODE_ENV=${env} forever start --append --uid ${SERVICE_UID} --sourceDir ${currentProject} index.js`
      );
    } catch (error) {
      console.log(error.message);
    }
  });
};
