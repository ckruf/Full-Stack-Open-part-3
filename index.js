// load environment variables from .env file 
require("dotenv").config();
// import express
const express = require("express");
const Person = require("./models/person");
// configure express
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3001;
// import fs to enable morgan to log to file
const fs = require("fs");
// import and configure morgan for logging
const morgan = require("morgan");
morgan.token("json-body", (req, res) => JSON.stringify(req.body));
const morganConfig = ":method :url :status :res[content-length] - :response-time ms :json-body";
app.use(morgan(morganConfig));
app.use(morgan(morganConfig, {
    stream: fs.createWriteStream("./access.log", {flags: "a"})
}));
/* 
import and use cors, so that our backend can be used by our front end.
By default, the server will only allow requests from the same domain (or rather, the same tuple).
By using cors, the server will allow requests from other hosts.
*/
const cors = require("cors");
const { default: mongoose } = require("mongoose");
app.use(cors());
/*
By using express.static('build'), we are connecting our frontend to our backend. Express will use
the React production build in the ./build/ directory and then show the React main page (index.html)
when we go to the '/' path of the backend. So if our backend is served on localhost:3001, going to 
localhost:3001/ will show the main page of the React app. In this particular case, the connection
between the frontend and the backend in the other direction is made possible by using relative
paths in the React app, such as /api/persons, without specifying the server, in combination with 
the fact that the React app's package.json file has a proxy set to localhost:3001. By using relative
paths, when React tries to send a request to /api/persons, it will send a request to its own host,
localhost:3000. But by setting a proxy in package.json, that request to itself gets redirected
to a request to localhost:3001.
*/
app.use(express.static("build"));

// Get all persons in phonebook
app.get("/api/persons", (req, res) => {
    Person.find({})
    .then(queryResult => {
        res.json(queryResult);
    });
});

// Get number of persons in phonebook
app.get("/info", async (req, res) => {
    let personCount = await Person.countDocuments();
    console.log("personCount is:");
    console.log(personCount);
    let infoString = `<p>Phonebook has info for ${personCount} people</p>`;
    let date = new Date();
    let dateString = `<p>${date}</p>`;
    let htmlResponse = infoString + dateString;
    res.send(htmlResponse);
});

// Get single person in phonebook
app.get("/api/persons/:id", async (req, res, next) => {
    let id = req.params.id;
    console.log(`id is ${id}`);
    let person;
    try {
        person = await Person.findById(id).exec();
    }
    catch (error) {
        next(error);
    }
    
    if (person) {
        return res.json(person);
    }
    else {
        return res.status(404).end();
    }
});

// Delete single person from phonebook
app.delete("/api/persons/:id", async (req, res, next) => {
    let id = req.params.id;
    console.log(`id is ${id}`);
    let lengthBefore = await Person.countDocuments();
    console.log(`length before delete is ${lengthBefore}`);
    try {
        let result = await Person.findByIdAndRemove(id);
        console.log("Deletion result is:");
        console.log(result);
    }
    catch (error) {
        next(error);
    }
    let lengthAfter = await Person.countDocuments();
    console.log(`length after delete is ${lengthAfter}`);
    if (lengthBefore === lengthAfter) {
        return res.status(404).end();
    }
    else {
        return res.status(204).end();
    }
});

// Add new person to phonebook
app.post("/api/persons", async (req, res, next) => {
    let jsonBody = req.body;

    if (!jsonBody) {
        return res.status(400).json({error: "Request must have JSON payload"});
    }
    
    if (!jsonBody.number) {
        return res.status(400).json({error: "Number must be present"});
    }
    
    if (!jsonBody.name) {
        return res.status(400).json({error: "Name must be present"});
    }

    try {
        let sameNamePerson = await Person.findOne({name: jsonBody.name});
        console.log("sameNamePerson is:");
        console.log(sameNamePerson);
        if (sameNamePerson) {
            return res.status(400).json({error: "Person with given name already exists"});
        }
    }
    catch (error) {
        next(error);
    }

    const newPerson = new Person({
        name: jsonBody.name,
        number: jsonBody.number
    });

    try {
        let saveResult = await newPerson.save();
        console.log("saveResult is:");
        console.log(saveResult);
        console.log(`Added new person to database, name: ${jsonBody.name}. number: ${jsonBody.number}`);
        return res.status(201).json(newPerson);
    }
    catch (error) {
        next(error);
    }
});

app.put("/api/persons/:id", async (req, res, next) => {
    console.log(`id is ${req.params.id}`);
    let jsonBody = req.body;
    if (!jsonBody) {
        return res.status(400).json({error: "Request must have JSON payload"});
    }
    
    if (!jsonBody.number) {
        return res.status(400).json({error: "Number must be present"});
    }

    const numberUpdate = {
        number: jsonBody.number
    };

    try {
        // new: true makes findByIdAndUpdate return the document after it's been updated,
        // by default the function returns the document before it's been updated
        let updateResult = await Person.findByIdAndUpdate(req.params.id, numberUpdate, {new: true});
        console.log(`updatedPerson: ${JSON.stringify(updateResult)}`);
        return res.status(200).json(updateResult);
    }
    catch (error) {
        next(error);
    }
});


// unsupported endpoints middleware - must be loaded as the last, except for the error handling middlewar
// The reason why the error handling middleware must be the very last is explained in the comment below.
// The reason why the unknownEndpoint middleware must be as one of the last, is because the express
// code is executed in order. So if the unknownEndpoint middleware were first, it would be used for
// all requests, before any defined endpoint-handling functions would have the chance to respond
// to the request.
const unknownEndpoint = (req, res) => {
    res.status(404).send({error: "unknown endpoint"});
};

app.use(unknownEndpoint);


// Error handling middleware must be loaded last. If we had any middlewares defined after
// the error handling middleware, those would only be called when next() is invoked in the 
// error handling middleware - meaning they would only be execute if an error occured, which 
// is typically not the desired behaviour. We presumably want all non-error-handling middleware
// to execute always - not only in case of an error.
const errorHandler = (error, req, res, next) => {
    console.error(error.message);

    // for CastError, we return specific response
    if (error instanceof mongoose.Error.CastError) {
        console.log(`Could not cast given id ${req.params.id} to ObjectId`);
        return res.status(400).send({error: "malformatted id"});
    }

    if (error instanceof mongoose.Error.ValidationError) {
        return res.status(400).json({error: error.message});
    }
    
    // for any other error, we pass it to default express error handler
    next(error);

};

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
