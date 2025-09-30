const mongoose = require("mongoose");

const termRelationshipSchema = new mongoose.Schema({
  object_id: {
    type: Number,       // BIGINT
    required: true,
  },
  term_taxonomy_id: {
    type: Number,       // BIGINT
    required: true,
  },
  term_order: {
    type: Number,       // INT
    default: 0,
  },
});

// Collection name: zdkw_term_relationships (adjust if needed)
module.exports = mongoose.model("TermRelationship",termRelationshipSchema);
