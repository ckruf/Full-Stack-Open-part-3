const mongoose = require('mongoose');

if (process.argv.length !== 3 && process.argv.length !== 5) {
    console.log(`You provided ${process.argv.length} parameters`);
    console.log("Please provide either 1 or 3 command line arguments");
    console.log("To print all people in phonebook do console, provide password as command line argument:");
    console.log("node mongo.js <password>");
    console.log("To add a new person to the phonebook, provide 3 command line arguments:");
    console.log("node mongo.js <password> <name> <number>");
    process.exit(1);
}

const password = process.argv[2];

const dbUri = `mongodb+srv://chris:${password}@cluster0.t2zcw9b.mongodb.net/?retryWrites=true&w=majority`;

const personSchema = new mongoose.Schema({
    name: String,
    number: String
});

const Person = mongoose.model('Person', personSchema);

if (process.argv.length === 3) {
    mongoose
    .connect(dbUri)
    .then(connectionResult => {
        return Person.find({});
    })
    .then(queryResult => {
        console.log("phonebook:")
        queryResult.forEach(person => {
            console.log(person.name + " " + person.number);
        });
    })
    .then(() => {
        console.log("Those are all the contacts in the database");
        return mongoose.connection.close();
    })
    .catch(error => {
        console.log("Got an error while querying all contacts in database: ", error);
    })
}
else if (process.argv.length === 5) {
    mongoose
    .connect(dbUri)
    .then(connectionResult => {
        const newName = process.argv[3];
        const newNumber = process.argv[4];
        const person = new Person({
            name: newName,
            number: newNumber
        });
        
        return person.save();
    })
    .then(() => {
        console.log(`added ${process.argv[3]} number ${process.argv[4]} to phonebook`);
        return mongoose.connection.close();
    })
    .catch(error => {
        console.log("Got an error while saving new person to database: ", error);
    })

}