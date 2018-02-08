# EGAR Public UI

One Paragraph of project description goes here

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

What things you need to install the software and how to install them

```
Give examples
```

### Installing and building

A step by step series of examples that tell you have to get a development env running

```
npm install

npm run-script build

npm start

```
The welcome page should then be available at localhost:8080/registration/welcome

You may need to install redis-server
```
npm install redis-server
```

## Running the tests

TODO - Explain how to run the automated tests for this system

### Break down into end to end tests

TODO - Explain what these tests test and why

```
TODO - Give an example
```

### And coding style tests

TODO - Explain what these tests test and why

```
TODO - Give an example
```

## Deployment

Add additional notes about how to deploy this on a live system

## Usage

You can build an image with the above configurations by running this command.

    mvn clean package docker:build
    
To run the image you just built with an other version (Where the version is X.Y.Z):
	
	docker run -d -p 8080:8080 --name public-ui  egar-public-ui:X.Y.Z

To push the image you just built to the registry, specify the `pushImage` flag.

    mvn clean package docker:build -DpushImage

To push only specific tags of the image to the registry, specify the `pushImageTag` flag.

    mvn clean package docker:build -DpushImageTag

## Built With



## Contributing



## Versioning



## Authors


## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments.



