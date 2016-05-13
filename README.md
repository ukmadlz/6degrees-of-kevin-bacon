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

  The host you choose will determinate the subdomain of your application's URL.

6. Connect to Bluemix in the command line tool and log in.

```
cf api <API_URL> # e.g. https://api.ng.bluemix.net
cf login
```

7. Create an instance of the IBM Graph service.

```
cf create-service 'IBM Graph' Entry six-degrees
```

8. Push the app.

```
# optionally, log in
cf api <API_URL> # e.g. https://api.ng.bluemix.net
cf login
# deploy the app
cf push
```

## Running the application locally

## Structure of this application

## Contribute


