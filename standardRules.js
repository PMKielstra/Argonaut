function getItemIndex(name, list){
  name = name.toLowerCase();
  for(var i = 0; i < list.length; i++){
    if(name === list[i]._name.toLowerCase() || (list[i]._aliases === undefined ? false : list[i]._aliases.indexOf(name) > -1)) return i;
  }
  return -1;
}

var standardRules = {};

//Rulesets are objects with two properties:
//  -An 'actions' array, made up of all the actions a player can take.  If you want the player to 'kill troll with sword', the verb 'kill' has to be in the 'actions' array.
//  -An 'interruptors' array, made up of all the interruptors that will be loaded at the beginning of the game.  Unless you want them to be deletable, don't give them ids.

standardRules.actions = [ //The standard ruleset.  These are all just JS implementations of standard verbs that IF players expect.
  { //LOOK, or L.
    regexp:/^l(?:ook)?/,
    code:function(){
      function list(visibles){
        var s = "";
        for(var i = 0; i < visibles.length; i++){
          if(i > 0) s += ", ";
          if(i == visibles.length - 2) s += "and ";
          s += (visibles[i]._article === undefined ? "a " : visibles[i].article) + visibles[i]._name.toLowerCase();
          if(i < visibles.length - 1) s += " ";
        }
        return s;
      }
      var visibles = this.currentArea.contents.filter(function(thing){return !(thing._tags.indexOf("invisible") > -1)});
      this.say(this.currentArea._desc + "\n" + (visibles.length > 0 ? "You can see " + list(visibles) + " here." : ""));
    }
  },
  { //TAKE.
    regexp:/^take +(.+)/,
    code:function(item){
      index = getItemIndex(item, this.currentArea.contents);
      if(index === -1){
        this.say("That's not here.");
        return;
      }
      object = this.currentArea.contents[index];
      if(object._tags === undefined || object._tags.indexOf("portable") == -1){
        this.say("You can't pick that up.");
        return;
      }
      this.inventory.push(object);
      this.currentArea.contents.splice(index, 1);
      this.say("Taken.");
      return function(){this.currentArea.contents.splice(index, 0, object); this.inventory.splice(this.inventory.indexOf(object), 1);};
    }
  },
  { //DROP.
    regexp:/^drop +(.+)/,
    code:function(item){
      index = getItemIndex(item, this.inventory);
      if(index === -1){
        this.say("You don't have that.");
        return;
      }
      this.currentArea.contents.push(this.inventory[index]);
      this.inventory.splice(index, 1);
      this.say("Dropped.");
      return function(){this.inventory.splice(index, 0, this.currentArea.contents.pop());}
    }
  },
  { //INVENTORY, or I.
    regexp:/^i(?:nventory)?/,
    code:function(){
      if(this.inventory.length === 0){
        this.say("You are carrying nothing.");
        return;
      }
      this.say("You are carrying:");
      for(var i = 0; i < this.inventory.length; i++){
        this.say("A " + this.inventory[i]._name);
      }
    }
  },
  { //EXAMINE, or X.
    regexp:/^(?:x|(?:examine)) +(.+)/,
    code:function(item){
      var index = getItemIndex(item, this.currentArea.contents);
      if(index === -1){
        index = getItemIndex(item, this.inventory);
        if(index === -1){
          this.say("You can't see any such thing.");
          return;
        }
        this.say(this.inventory[index]._desc);
        return;
      }
      this.say(this.currentArea.contents[index]._desc);
    }
  },
  { //Movement
    regexp:/^(?:go|walk|run|move|shimmy)? *(north|south|east|west|northeast|southeast|northwest|southwest|up|down|ne|se|nw|sw|n|s|e|w|u|d)/,
    code:function(direction){
      if(direction.length < 3){ //If this is an abbreviation, expand it.
        switch(direction){
          case "n":
            direction = "north";
            break;
          case "s":
            direction = "south";
            break;
          case "e":
            direction = "east";
            break;
          case "w":
            direction = "west";
            break;
          case "ne":
            direction = "northeast";
            break;
          case "se":
            direction = "southeast";
            break;
          case "nw":
            direction = "northwest";
            break;
          case "sw":
            direction = "southwest";
            break;
          case "u":
            direction = "up";
            break;
          case "d":
            direction = "down";
            break;
        }
      }
      if(typeof this.currentArea.directions[direction] != "object"){ //Check to see if we are allowed to go from one room to another.
        this.say("You can't go that way.");
        return;
      }
      var oldArea = this.currentArea; //Cache the old area for undoing.
      this.currentArea = this.currentArea.directions[direction];
      if(this.currentArea.contents === undefined) this.currentArea.contents = []; //Set up a contents array if one doesn't exist.
      this.parse("look"); //Quick-and-dirty way of showing the player the room when they enter it.
      return function(){this.currentArea = oldArea;};
    }
  },
  {//UNDO
    regexp:/^undo/,
    code:function(){
      if(this.undoStack.length < 1){
        this.say("Nothing to undo.");
        return;
      }
      var ID = this.undoStack[this.undoStack.length - 1].id;
      while(this.undoStack.length > 0 && ID === this.undoStack[this.undoStack.length - 1].id){
        this.undoStack.pop().code.call(this);
      }
      this.say("[Turn undone.]");
    }
  },
  {//RESTART.  This rule requires a yes/no answer, so it uses an interruptor.
    regexp:/^restart/,
    code:function(){
      this.say("Are you sure you want to restart?")
      var id = this.addProcessor(function(text){
        if(!text.match(/^y|yes|n|no$/)){
          this.say("Please answer yes or no.");
          this.stop();
        }
        if(text.startsWith("y")){
          for(var i = this.undoStack.length - 1; i >= 0; i--){ //I have implemented RESTART as repeated UNDOs.
            this.undoStack[i].code.call(this);
          }
          this.parse("look"); //Quick-and-dirty way to have the player look around 'for the first time.'
        }
        this.removeProcessor(id); //Pass the ID from the addInterruptor function into the actual function passed to addInterruptor.  Isn't JavaScript cool?
      }, Processors.PREPROCESSOR);
    }
  }
];

standardRules.processors = [
  { //AGAIN, or G.  This is what I call a 'meta-action', one that 'breaks the fourth wall' by requiring awareness of other commands and the nature of parser IF.  In effect, 'meta-actions' are aware that they are in a game, while standard actions ('take football') are not.  Often, these meta-actions work on text entered rather than on objects in the game world, so it makes more sense to implement them as interruptors.
    //User-defined interruptors will all have an id.  This is used to make them removable.  I do not want the user to be able to remove the AGAIN interruptor by accident, so there is no id field here.  (NOTE: don't worry about defining this.  All you need to do is pass your code to the addInterruptor function.  The system takes care of the rest.)
    enabled:true,
    code:function(text){
      if(text.match(/^g$|again/)){
        if(this.lastCommand === undefined){
          this.say("Do what again?");
          this.stop();
        }else{
          this.setText(this.lastCommand);
        }
      }else{
        this.lastCommand = text;
      }
    }
  },
  { //The actual action parser.  It is recommended that you copy this code wholesale when you make your own ruleset.  In fact, it is recommended that all rulesets are some variant on standardRules, created at runtime using array operations.
    enabled:true,
    code:function(text){
      for(var i = 0; i < this.actions.length; i++){ //Iterate over actions, looking for one that matches the input.
        var array = this.actions[i].regexp.exec(text);
        if(array !== null){
          if(array[0] !== text) this.say ("Interpreting as \"" + array[0] + "\":");
          array.splice(0, 1); //Remove the first element of the array -- it's the entire match.  We just want whatever the rule specified we should capture.
          return this.actions[i].code.apply(this, array); //I use apply here for two reasons.  One, it unrolls the array into multiple function arguments if necessary, and two, it lets us call actions from anywhere with the game as context.  Using properties of the object representing the current game is not only allowed, it is encouraged.
        }
      }
      this.say ("I couldn't understand that.  Could you rephrase it?"); //If the main for loop completes without finding an action that it can take, postprocessors don't run (although interruptors do) and we exit with an error message.  Graceful, verbose failures FTW!
      this.stop();
    }
  },
  { //Handle data-hypertextType links (cycle and fill).
    enabled:true,
    code:function(text){
      var links = document.querySelectorAll("[data-hypertextType]:not([onclick])");
      if(links.length > 0){
        for(var i = 0; i < links.length; i++){
          var content = links[i].getAttribute("data-content");
          switch(links[i].getAttribute("data-hypertextType").toLowerCase()){
            case "cycle":
              content = content.split(/, */);
              links[i].onclick = function(){
                if(this.index === undefined) this.index = 0;
                this.innerHTML = content[this.index];
                this.index = (this.index + 1) % content.length;
              }
              break;
            case "fill":
              links[i].onclick = function(){
                this.outerHTML = content;
              }
              break;
            case "sequence":
              content = content.split(/, */);
              links[i].onclick = function(){
                if(this.index === undefined) this.index = 0;
                if(this.index < content.length - 1){
                  this.innerHTML = content[this.index];
                }else{
                  this.outerHTML = content[this.index];
                }
                this.index++;
              }
          }
        }
      }
    }
  },
  { //A function to invalidate links once the player leaves that room.  As the user might reasonably want to disable this, there is an id provided.
    id:1,
    enabled:true,
    code:function(text){
      if(this.lastArea === undefined){
        this.lastArea = this.currentArea;
        return;
      }
      if(this.lastArea != this.currentArea){
        var links = document.querySelectorAll("[data-area=" + this.lastArea._name + "]");
        for(var i = 0; i < links.length; i++){
          links[i].outerHTML = links[i].innerHTML;
        }
        this.lastArea = this.currentArea;
      }
    }
  }
];
