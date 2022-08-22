// import express
const express = require('express');
// import my own functions/data
let { persons } = require("./phonebook_data");
const { getRandomInt } = require("./helpers");
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

// Get all persons in phonebook
app.get("/api/persons", (req, res) => {
    console.log("GET /api/persons");
    res.json(persons);
})

// Get number of persons in phonebook
app.get("/info", (req, res) => {
    let personCount = persons.length;
    let infoString = `<p>Phonebook has info for ${personCount} people</p>`;
    let date = new Date()
    let dateString = `<p>${date}</p>`;
    let htmlResponse = infoString + dateString;
    res.send(htmlResponse);
})

// Get single person in phonebook
app.get("/api/persons/:id", (req, res) => {
    let id = req.params.id;
    console.log(`id is ${id}`);
    let person = persons.find(person => person.id == id);
    if (person) {
        return res.json(person);
    }
    else {
        return res.status(404).end();
    }
})

// Dekete single person from phonebook
app.delete("/api/persons/:id", (req, res) => {
    let id = req.params.id;
    let lengthBefore = persons.length;
    console.log(`length before delete is ${lengthBefore}`);
    persons = persons.filter(person => person.id != id);
    let lengthAfter =persons.length;
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
    let newPerson = {};

    if (!jsonBody) {
        return res.status(400).json({error: "Request must have JSON payload"});
    }
    
    if (jsonBody.number) {
        newPerson.number = jsonBody.number;
    }
    else {
        return res.status(400).json({error: "Number must be present"});
    }
    
    if (jsonBody.name) {
        newPerson.name = jsonBody.name;
    }
    else {
        return res.status(400).json({error: "Name must be present"});
    }

    if (persons.find(person => person.name === jsonBody.name)) {
        return res.status(400).json({error: "Person already exists in phonebook"});
    }

    let newId = getRandomInt(0, 1000000);
    while (persons.find(person => person.id === newId)) {
        newId = getRandomInt(0, 1000000);
    }
    newPerson.id = newId;
    
    persons.push(newPerson);
    return res.status(201).json(newPerson);

})

app.listen(PORT, () => {
    console.log(`Server running on port ${port}`);
})
