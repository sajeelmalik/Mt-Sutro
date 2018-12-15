// Sajeel Malik
// server.js for Mt. Sutro Music Company

// ########## DEPENDENCIES ##########

// imported mongoose in the case that we need to store the scraped information
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

var axios = require("axios");
var cheerio = require("cheerio");

var PORT = process.env.PORT || 8000;

// Initialize Express
var app = express();

var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));


// ########## MODELS ##########
var db = require("./models");

// Require all existing user albums 
var albums = require("./public/assets/js/albums.json");

// Connect to the Mongo DB. If deployed, use the deployed database. Otherwise use the local mtsutro database. Currently not storing.

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mtSutro";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
// Added useNewUrlParser based on current mongo version (4.0.2)
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

//set up affiliate array
var affiliates = [];

// ########## ROUTES ##########

// GET route for scraping
app.get("/", function (req, res) {
    // First, we grab the body of the html with axios
    axios.get("https://pitchfork.com/reviews/albums/")
        .then(function (response) {
            // Then, we load that into cheerio and save it to $ for a shorthand selector
            const home = "https://pitchfork.com";
            var $ = cheerio.load(response.data);
            var artists = [];

            // Iterate through each class of "review" on pitchfork to get the top upcoming artists
            $("div.review").each(function (i, element) {
                // Save an empty result object
                var result = {};

                // Add text and href of every link, and save them as properties of the result object
                result.name = $(this).find("ul.review__title-artist").children("li").text();
                result.link = home + $(this).find("a.review__link").attr("href");
                result.image = $(this).find("img").attr("src");

                if (artists.length < 49) {
                    artists.push(result);

                    //adding hard-coded albums 
                    artists.push(albums[i]);
                }

            });

            // console.log(artists); //check to see if scraping is successful

            affiliates = artists.concat(albums.slice(12));

            res.render("index", { item: affiliates });

            // Create a new Artist using the artist JSON 
            // db.Artist.insertMany(artists)
            //     // Initial attempt - works perfectly locally 
            //     .then(function (dbArtist) {
            //         // Push the added result to our array to develop our JSON - here, I attempted to redirect to /home instead of directly rendering the index as a potential solution to an asynchornicity problem
            //         console.log(dbArtist);
            //         // res.render("index", { item: dbArtist });
            //         res.redirect("/home")
            //     })
            //     .catch(function (err) {
            //         // send error to client
            //         return res.json(err);
            //     });

        })
        .catch(function (err) {
            // send error to client
            return res.json(err);
        });


});

app.get("/booking", function (req, res) {
    res.render("booking");
});

app.get("/nonprofit", function (req, res) {
    res.render("nonprofit");
});

app.get("/design", function (req, res) {
    res.render("design");
});

app.get("/jobs", function (req, res) {
    res.render("jobs");
});


// Route for getting all Artists from the db - Currently unused
app.get("/home", function (req, res) {
    // Grab every document in the Artists collection
    db.Artist.find({})
        .then(function (dbArtist) {
            // If we were able to successfully find Artists, send them back to the client
            // res.send("DOG")
            res.render("index", { item: dbArtist });
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});


// Route for getting all Artists in a json - currently unused
// app.get("/artists", function (req, res) {
//     // Grab every document in the Artists collection
//     db.Artist.find({})
//         .then(function (dbArtist) {
//             // If we were able to successfully find Artists, send them back to the client
//             res.json(dbArtist);
//         })
//         .catch(function (err) {
//             // If an error occurred, send it to the client
//             res.json(err);
//         });
// });

// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});
