const mongoose = require('mongoose');

if (process.argv.length < 3) {
    console.log("Please provide the database password as an argument: node mongo_test.js <password>");
    process.exit(1);
}

const password = process.argv[2];

const dbUri = `mongodb+srv://chris:${password}@cluster0.t2zcw9b.mongodb.net/?retryWrites=true&w=majority`

const noteSchema = new mongoose.Schema({
    content: String,
    date: Date,
    important: Boolean
});

const Note = mongoose.model('Note', noteSchema);

mongoose
.connect(dbUri)
.then(result => {
    console.log('connected');

    const note = new Note({
        content: 'CSS is hard',
        date: new Date(),
        important: true
    });

    return note.save();
})
.then(() => {
    console.log("note saved!");
    return mongoose.connection.close();
})
.catch(error => {
    console.log("Error while connecting to DB and saving note: ", error);
})