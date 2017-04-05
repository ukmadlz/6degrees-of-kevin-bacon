# Six degrees of Kevin Bacon - an IBM Graph sample app

This sample app shows you how to write a Node.js application that interfaces with IBM Graph, IBM's graph database as a serivce. It can be deployed to Bluemix and other cloud foundry platforms. The application uses a graph dataset with movies and actors as nodes in the graphs connected by edges that show who played a part in which movie. The user can use the application to traverse the graph and find connections between actors. IBM Graph is well suited for this task, as its data model is a property graph and its support for Gremlin makes it easy to write queries that involve graph traversals.

## Running the application on Bluemix or other Cloud Foundry platforms

1. If you do not already have access to a Cloud Foundry PaaS, [sign up for Bluemix](https://console.ng.bluemix.net/registration/).

2. Download and install the [Cloud Foundry CLI](https://github.com/cloudfoundry/cli).

3. Clone the app to your local environment from your terminal using the following command:

   ```
git clone https://github.com/ibm-cds-labs/6degrees-of-kevin-bacon.git
   ```

4. Change into the newly created directory:

   ```
cd 6degrees-of-kevin-bacon
   ```

5. Open the `manifest.yml` file and change the `host` value to something unique.

   The host you choose will determine the subdomain of your application's URL.

6. Connect to Bluemix in the command line tool and log in.

   ```
cf api <API_URL> # e.g. https://api.ng.bluemix.net
cf login
   ```

7. Create an instance of the IBM Graph service.

   ```
cf create-service "IBM Graph" Standard six-degrees
   ```

8. Push the app.

   ```
# optionally, log in
cf api <API_URL> # e.g. https://api.ng.bluemix.net
cf login
# deploy the app
cf push
   ```

9. Import the sample data

   Put your service credentials into a new file named `config.json`. Then, run the import script:

   ```
./import.js -c config.json -p data/movies-demo.csv
   ```

## Running locally
  The application uses [Node.js](http://nodejs.org/) and [npm](https://www.npmjs.com/) so you will have to download and install them as part of the steps below.

1. Duplicate the `.env.example` to `.env`

  ```sh
  cp .env.example .env
  ```

2. Copy the credentials from your `ibm-graph` service in Bluemix to `.env`, you can see the credentials using:

    ```sh
    $ cf env <application-name>
    ```
    Example output:
    ```sh
    System-Provided:
    {
     "VCAP_SERVICES": {
      "IBM Graph": [
       {
        "credentials": {
         "apiURL": "<graph-url>",
         "password": "<graph-password>",
         "username": "<graph-username>"
        },
        "label": "IBM Graph",
        "name": "six-degrees",
        "plan": "Entry",
        "tags": [
         "ibm_created",
         "data_management",
         "ibm_beta"
        ]
       }
      ]
     }
    }
    ```

    You need to copy `graph-username`, `graph-password` and `graph-url`.

2. Install [Node.js](http://nodejs.org/)
3. Go to the project folder in a terminal and run:
    `npm install`
4. Start the application
5.  `node index.js`

## Documentation

 * [IBM Graph documentation](https://ibm-graph-docs.ng.bluemix.net/)
 * [IBM Graph interactive guide for Node.js](https://ibm-graph-docs.ng.bluemix.net/interactive-guide-node-js.html)

## Structure of this application

```
├── assets - frontend assets: css, js, images
├── data
│   └── movies-demo.csv - movie sample data in csv format
├── import.js - import script to import movie data into IBM Graph
├── index.js - main program
├── manifest.yml - manifest that describes the application and its deployment to cloud foundry
├── package.json - node package file with metadata about the project, e.g. dependencies
├── schema.json - the schema definition for the sample data
├── setup.js - setup script to set the schema
└── templates
    └── index.jade - jade template
```

## Running on Bluemix

The fastest way to deploy this application to Bluemix is to click the **Deploy to Bluemix** button below.

[![Deploy to Bluemix](https://deployment-tracker.mybluemix.net/stats/4dfc8a74f582329adf35199126090e45/button.svg)](https://bluemix.net/deploy?repository=https://github.com/ibm-cds-labs/6degrees-of-kevin-bacon.git)

**Don't have a Bluemix account?** If you haven't already, you'll be prompted to sign up for a Bluemix account when you click the button.  Sign up, verify your email address, then return here and click the the **Deploy to Bluemix** button again. Your new credentials let you deploy to the platform and also to code online with Bluemix and Git. If you have questions about working in Bluemix, find answers in the [Bluemix Docs](https://www.ng.bluemix.net/docs/).

## Contribute

See [CONTRIBUTING.md](./CONTRIBUTING.md)
