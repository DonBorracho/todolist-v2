//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');
const _ = require('lodash');
// Include process module
const process = require('process');
 
// Printing process.env property value
//  console.log(process.env.password);

main().catch(err => console.log(err));
async function main() {
  const app = express();
  app.set('view engine', 'ejs');

  app.use(bodyParser.urlencoded({extended: true}));
  app.use(express.static("public"));

  const database = "todolistDB";
  const credential = `${process.env.MONGO_USR}:${process.env.MONGO_PASS}`;
  const url = `mongodb+srv://${credential}@cluster0.nucp5uw.mongodb.net/${database}`;
  console.log(url);
  mongoose.connect(url).catch(err => console.log(err));
  
  const itemsSchema = new mongoose.Schema( {
    name: String,
  });
  const Item = new mongoose.model("Item", itemsSchema);

  const item1 = new Item({
    name: "Welcome to your new todolist!"
  });
  const item2 = new Item({
    name: "Hit + button to add an item"
  });
  const item3 = new Item({
    name: "<-- Hit this to delete the item"
  });
  const defaultItems = [item1, item2, item3];

  const listSchema = new mongoose.Schema({
    name: String,
    items: [itemsSchema]
  })
  const List = new mongoose.model("List", listSchema);
  
  const day = date.getDate();

  app.get("/", function(req, res) {
    Item.find({})
    .then(foundItems => {
      if (foundItems.length == 0) {
         Item.insertMany(defaultItems)
         .catch(err => console.log(err));
         res.redirect("/");
      }
      else res.render("list", {listTitle: day, newListItems: foundItems});
    })
    .catch(err => console.log(err));
  });

  app.post("/", function(req, res){
    const item = req.body.newItem;
    const listName = req.body.list;
    const addItem = new Item({
      name: item
    })
    if (listName === day) {
      addItem.save();
      res.redirect("/");
    } else {
      List.findOne({name: listName})
      .then(result => {
        result.items.push(addItem);
        result.save();
      })
      .catch(err => console.log(err));
      res.redirect("/" + listName);
    }
  });

  app.get("/:routes", function(req,res){
    // console.log(req.params.routes);
    const customListName  = _.capitalize(req.params.routes); 
    List.findOne({name: customListName})
    .then(result => {
      if (result) {
        res.render("list", {listTitle: result.name, newListItems: result.items});
      }
      else {
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      };
    })
    .catch(err => console.log(err));
  });

  app.get("/about", function(req, res){
    res.render("about");
  });

  app.post("/delete", function(req, res){
    // console.log(req.body.checkbox);
    const checkedItem = req.body.checkbox;
    const listName = req.body.listName;
    if (listName === day) {
      Item.findByIdAndRemove(checkedItem)
      .catch(err => console.log(err));
      res.redirect("/");
    }
    else {
      List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItem}}})
      .catch(err => console.log(err));
      res.redirect("/" + listName);
    }
  })

  app.listen(process.env.PORT || 3000, function() {
    console.log("Server started on port 3000");
  });
}


