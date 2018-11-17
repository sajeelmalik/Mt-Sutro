// Sajeel Malik
// server.js for Mt. Sutro Music Company

// DEPENDENCIES
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

// Connect to the Mongo DB

// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
// Added useNewUrlParser based on current mongo version (4.0.2)
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, { useNewUrlParser: true });

// Require all models
var db = require("./models");

// Routes

// GET route for scraping
app.get("/", function (req, res) {
    // First, we grab the body of the html with axios
    axios.get("https://pitchfork.com/reviews/albums/")
        .then(function (response) {
            // Then, we load that into cheerio and save it to $ for a shorthand selector
            var $ = cheerio.load(response.data);

            var artists = [];

            // Iterate through each class of "product item" on the page to scrape the specific sales
            $("div.review").each(function (i, element) {
                // Save an empty result object
                var result = {};

                // Add text and href of every link, and save them as properties of the result object
                result.title = $(this).find("h3.item-heading").children("a").text();
                result.link = home + $(this).find("div.image-container").children("a").attr("href");
                result.price = $(this).find("strong.item-price").children("span.sale").text();
                if ($(this).find(".item-image").attr("src")) {
                    result.image = $(this).find(".item-image").attr("src");
                }
                else {
                    result.image = $(this).find(".item-image").attr("data-src");
                }

                artists.push(result);
            });

            // return res.send("hello"); //temporary debugging test

            // Create a new Sale using the `result` object built from scraping
            db.Sale.insertMany(artists)
                // Initial attempt - works perfectly locally 
                .then(function (dbSale) {
                    // Push the added result to our array to develop our JSON - here, I attempted to redirect to /home instead of directly rendering the index as a potential solution to an asynchornicity problem

                    // res.render("index", { item: dbSale });
                    res.redirect("/home")
                })
                .catch(function (err) {
                    // send error to client
                    return res.json(err);
                });

            //====Debugging attempt 2 - try/catch/finally
            // try {
            //     db.Sale.insertMany(artists)
            // } catch (err) {
            //     console.log(err)
            // } finally {
            //     res.redirect("/home")
            // }

            //====Debugging attempt 3 - timeout
            // setTimeout(function(){
            //     axios.get("/sales")
            //         // With that done, add the note information to the page
            //         .then(function (data) {
            //             res.render("index", { item: data });
            //         });
            // }, 5000)



        })
        //====Debugging attempt 4 - add a catch to the axios.get
        .catch(function (err) {
            // send error to client
            return res.json(err);
        });


});

// Route for getting all Sales from the db 
app.get("/home", function (req, res) {
    // Grab every document in the Sales collection
    db.Sale.find({})
        .then(function (dbSale) {
            // If we were able to successfully find Sales, send them back to the client
            res.render("index", { item: dbSale });
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});


// Route for getting all Sales from the db
app.get("/sales", function (req, res) {
    // Grab every document in the Sales collection
    db.Sale.find({})
        .then(function (dbSale) {
            // If we were able to successfully find Sales, send them back to the client
            res.json(dbSale);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

// Route for grabbing a specific Sale by id, populate it with it's note
app.get("/sales/:id", function (req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Sale.findOne({ _id: req.params.id })
        // ..and populate all of the notes associated with it
        .populate("note")
        .then(function (dbSale) {
            // If we were able to successfully find an Sale with the given id, send it back to the client
            res.json(dbSale);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

// Route for saving/updating an Sale's associated Note
app.post("/sales/:id", function (req, res) {
    // Create a new note and pass the req.body to the entry
    db.Note.create(req.body)
        .then(function (dbNote) {
            // If a Note was created successfully, find one Sale with an `_id` equal to `req.params.id`. Update the Sale to be associated with the new Note
            // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
            // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
            return db.Sale.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
        })
        .then(function (dbSale) {
            // If we were able to successfully update an Sale, send it back to the client
            res.json(dbSale);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

app.get("/saved", function (req, res) {
    db.Sale.find({ saved: true }).populate("note").then(function (data) {
        //   console.log(data)
        res.render("index", { item: data });
    }).catch(function (err) {
        res.json(err)
    })
});

// Start the server
app.listen(PORT, function () {
    console.log("App running on port " + PORT + "!");
});
