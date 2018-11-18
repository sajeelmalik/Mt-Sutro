//Sajeel Malik
//Artist - mongoose schema

var mongoose = require("mongoose");

// Save a reference to the Schema constructor
var Schema = mongoose.Schema;

// Using the Schema constructor, create a new Artist object
var ArtistSchema = new Schema({
  // `name` is required and of type String
  name: {
    type: String,
    required: true
  },
  // `link` is required and of type String. Can make unique:true ONLY if the scraping is done independently, since otherwise the root route will always throw an erro
  link: {
    type: String,
    required: true
  },
  // `image` is required and of type String
  image: {
    type: String,
    // required: true
  },
});

// This creates our model from the above schema, using mongoose's model method
var Artist = mongoose.model("Artist", ArtistSchema);

// Export the Artist model
module.exports = Artist;
