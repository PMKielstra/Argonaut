const Processors = { //Tags for processors.
  PREPROCESSOR:0,
  POSTPROCESSOR:1,
  choiceProcessor:function(choice1, function1, choice2, function2){
    return function(text){
      switch(text){
        case choice1:
          function1();
          break;
        case choice2:
          function2();
          break;
        default:
          this.say("Please answer " + choice1 + " or " + choice2 + ".");
      }
      this.stop();
    }
  }
}

function Game(gameObject){
  //BEGIN: LOAD THE GAME FROM THE GAMEOBJECT PASSED TO THE CONSTRUCTOR.
  this.begin = function(){
    this.currentArea = gameObject._startArea; //The player starts in the given area.
    if(gameObject._ruleset === undefined){ //Build ruleset (actions, interruptors, postprocessors), falling back on the standard rules when the user doesn't give any.
      this.actions = standardRules.actions;
      this.processors = standardRules.processors;
    }else{
      this.actions = gameObject._ruleset.actions === undefined ? standardRules.actions : gameObject._ruleset.actions;
      this.processors = gameObject._ruleset.processors === undefined ? standardRules.processors : gameObject._ruleset.processors;
    }
    var highestID = 0; //Get the smallest number (plus one) that doesn't correspond to an interruptor ID.  We can use this for new interruptor IDs further on.
    for(var i = 0; i < this.processors.length; i++){
      if(this.processors[i].id > highestID) highestID = this.processors[i].id;
    }
    this.currentID = highestID;
    if(this.currentArea.contents === undefined) this.currentArea.contents = []; //Set up an area contents array if none exists.
    this.inventory = gameObject._inventory === undefined ? [] : gameObject._inventory; //Set up player inventory.
    this.onParseFinished = gameObject._onParseFinished === undefined ? function(){} : gameObject._onParseFinished
    if(typeof gameObject._onStart === "function") gameObject._onStart.call(this); //User-defined rules for what to do when the game starts.
  }
  //SAY: OUTPUT TEXT TO PLAYER.  CAN OPTIONALLY BE SILENCED.
  this.say = function(text){
    if(this.silent === true) return;
    this.outputText(text);
  }
  this.outputText = function(text){ //The function that actually outputs the text.  NOTE: this seperate function exists for one reason only: you can override it.  The 'say' function can be silenced, which is sometimes useful, even when the 'outputText' function has been overridden.
    console.log(text);
  }
  this.processors = []; //Any function that takes input text and does something with it is called a processor.
  this.addProcessor = function(func, type){
    this.currentID++;
    var processorObject = {id:this.currentID, enabled:true, code:func};
    switch(type){
      case Processors.PREPROCESSOR:
        this.processors.splice(0, 0, processorObject);
        break;
      case Processors.POSTPROCESSOR:
        this.processors.push(processorObject);
        break;
    }
    return this.currentID;
  }
  this.setProcessorEnabled = function(id, enabled){
    if(enabled === undefined) enabled = true; //Default to true, which makes the most sense given the function name.
    for(var i = 0; i < this.processors.length; i++){ //Iterate over processors.
      if(this.processors[i].id === id){
        this.processors[i].enabled = enabled;
        return true; //We've found the right processor.
      }
    }
    return false; //We couldn't find a processor.
  }
  this.removeProcessor = function(id){
    for(var i = 0; i < this.processors.length; i++){
      if(this.processors[i].id === id){
        this.processors.splice(i, 1)
        return true;
      }
    }
    return false;
  }
  //THE UNDO STACK: EVERY ACTION OF IMPORT IS EXPECTED TO RETURN A FUNCTION THAT TELLS HOW TO REVERSE IT.  THESE ARE SAVED ON THE UNDO STACK IN REVERSE ORDER.
  this.undoStack = [];
  //PARSE: TAKE TEXT AND DO ACTIONS
  this.parse = function(text){
    if(this.turnID === undefined){
      this.turnID = 0; //Set up turn ID for use in the undo command, and possibly other things as well if you need them.
    }else{
      this.turnID++; //Change it every time we get new input.
    }
    text = text.trim().toLowerCase(); //Case insensitivity and whitespace removal.
    var stopping = false;
    this.setText = function(newText){text = newText;}
    this.stop = function(){stopping = true;}
    for(var i = 0; i < this.processors.length; i++){
      var undoAction = this.processors[i].code.call(this, text);
      if(typeof undoAction === "function") this.undoStack.push({id:this.turnID, code:undoAction});
      if(stopping) break;
    }
    this.onParseFinished();
  }
}
