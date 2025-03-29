const  mongoose = require("mongoose");

// var  uri = process.env.oneDay || "mongodb://localhost:27017/Nxkc" 
var  uri = process.env.oneDay || "mongodb+srv://DineDeal:OqZOaoxP756hm74R@cluster.xvuzkd5.mongodb.net/Nxkc" 

const  options = {
// useNewUrlParser:  true,
// useUnifiedTopology:  true
};

mongoose.connect(uri, options).then(() => {
console.log("Database connection established!");
},
err  => {
{
console.log("Error connecting Database instance due to:", err);
}
});