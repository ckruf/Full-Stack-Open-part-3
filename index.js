// load environment variables from .env file 
require('dotenv').config();
// import express
const express = require('express');
const Person = require("./models/person");
// configure express
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3001;
// import fs to enable morgan to log to file
const fs = require('fs');
// import and configure morgan for logging
const morgan = require('morgan');
morgan.token('json-body', (req, res) => JSON.stringify(req.body))
const morganConfig = ':method :url :status :res[content-length] - :response-time ms :json-body';
app.use(morgan(morganConfig));
app.use(morgan(morganConfig, {
    stream: fs.createWriteStream('./access.log', {flags: 'a'})
}));
/* 
import and use cors, so that our backend can be used by our front end.
By default, the server will only allow requests from the same domain (or rather, the same tuple).
By using cors, the server will allow requests from other hosts.
*/
const cors = require('cors');
app.use(cors());
// Make express serve static content
app.use(express.static('build'));

// Get all persons in phonebook
app.get("/api/persons", (req, res) => {
    Person.find({})
    .then(queryResult => {
        res.json(queryResult);
    })
})

// Get number of persons in phonebook
app.get("/info", async (req, res) => {
    let personCount = await Person.countDocuments();
    console.log("personCount is:");
    console.log(personCount);
    let infoString = `<p>Phonebook has info for ${personCount} people</p>`;
    let date = new Date()
    let dateString = `<p>${date}</p>`;
    let htmlResponse = infoString + dateString;
    res.send(htmlResponse);
})

// Get single person in phonebook
app.get("/api/persons/:id", async (req, res) => {
    let id = req.params.id;
    console.log(`id is ${id}`);
    let person = await Person.findById(id).exec();
    if (person) {
        return res.json(person);
    }
    else {
        return res.status(404).end();
    }
})

// Delete single person from phonebook
app.delete("/api/persons/:id", async (req, res) => {
    let id = req.params.id;
    console.log(`id is ${id}`);
    let lengthBefore = await Person.countDocuments();
    console.log(`length before delete is ${lengthBefore}`);
    Person.deleteOne({_id: id}).then();
    let lengthAfter = await Person.countDocuments();
    console.log(`length after delete is ${lengthAfter}`);
    if (lengthBefore === lengthAfter) {
        return res.status(404).end();
    }
    else {
        return res.status(204).end();
    }
})

// Add new person to phonebook
app.post("/api/persons", (req, res) => {
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

    const newPerson = new Person({
        name: jsonBody.name,
        number: jsonBody.number
    })

    newPerson.save()
    .then(() => {
        console.log(`Added new person to database, name: ${jsonBody.name}. number: ${jsonBody.number}`);
    })
    
    return res.status(201).json(newPerson);

})

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
})
