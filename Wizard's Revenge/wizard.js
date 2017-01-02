//SET UP STARTING OBJECTS AND AREAS.  MUCH OF THIS IS SELF-EXPLANATORY.
var pole = {
  _name:"crowbar", //Both the printed name and one of the identifiers.
  _aliases:["pole", "bar"], //Other identifiers.
  _desc:"Long and strong iron.", //Description.
  _tags:["portable"] //Tags.  Inform 7 has "it is openable, closed, lockable, and locked", Argonaut has _tags:["openable", "closed", "lockable", "locked"].  Note that none of these are official Argonaut tags yet.
}

var hallway = {
  _name:"hallway",
  _desc:"Short and nondescript, more of an entranceway than a hall.  The kitchen is to the north and stairs lead up to the second level.",
  _tags:["area"], //This tag doesn't actually mean anything to the standard rules.  We use it as a small mercy to anyone who might write an action or processor that wants to check if something is an area.
  contents:[pole, //The contents of the area.
    {
      _name:"stairs",
      _aliases:["steps", "step", "stair"],
      _desc:"Narrow wooden spiral stairs.  Very wizardish.",
      _tags:["invisible"] //Invisible means the same as Inform's scenery.
    }]
}

var kitchen = {
  _name:"kitchen",
  _desc:"You are trying to be stealthy, so <a onclick='dark()' data-area='kitchen'>darkness</a> might be helpful.  But, as you feel your way cautiously inside, the <a onclick='light()' data-area='kitchen'>light</a> switch becomes more and more tempting.",
  _tags:["area"],
  contents:[]
}

var upstairs = {
  _name:"upstairs",
  _desc:"A wall of invisible magic blocks your path.  Your human flesh is too weak to even scratch at it.",
  _tags:["area"],
  contents:[]
}


var kitchenChoicePreprocessorID;
function kitchenChoicePreprocessor(text){ //The first preprocessor.  It intercepts the text and forces you to answer 'light' or 'dark'.  Used for the choice in the kitchen.
  if(this.currentArea != kitchen) return;
  if(kitchen.visited === undefined){
    kitchen.visited = true;
    return;
  }
  switch(text){
    case "dark":
    case "darkness":
      dark();
      break;
    case "light":
    case "light switch":
      light();
      break;
    default:
      this.say("Please answer 'light' or 'dark'.");
  }
  this.stop(); //Stop further execution after this processor completes.  The processor itself is removed by both the dark() and the light() functions, so there is no fear of the player being unable to use commands after making the choice.
}

function disableLinks(area){ //A helper function that I threw together to disable links based on where the player is.  Similar to a standard rules processor that will disable links with an area corresponding to a location whenever the player leaves it.
  var links = document.querySelectorAll("[data-area=" + area + "]");
  for(var i = 0; i < links.length; i++){
    links[i].outerHTML = links[i].innerHTML;
  }
}

function dark(){
  game.say("Without light, you fail to see your enemy's magically-enhanced eagle peck your eyes out.  He'll probably be finished eating your body sometime tomorrow.");
  disableLinks("kitchen");
  input.disabled = true; //Disable the parser input as an easy way of telling the player that the game is over.
  game.removeProcessor(kitchenChoicePreprocessorID) //No need to restrict choice to light or dark anymore.
}

var kitchenPreprocessorID;
var kitchenPostprocessorID;
function light(){
  disableLinks("kitchen");
  kitchenPreprocessorID = game.addProcessor(kitchenPreprocessor, Processors.PREPROCESSOR); //Prepare processors for the eagle-crowbar puzzle.
  kitchenPostprocessorID = game.addProcessor(kitchenPostprocessor, Processors.POSTPROCESSOR);
  game.say("Blinking, you react instinctively to the shrieking.  You rush back into the hall and slam the door behind you.  You hear your enemy's magically-enhanced eagle slam against the door.  Move quickly now: he might be awake after all that noise.");
  game.currentArea = hallway; //Flee to the hallway.
  game.removeProcessor(kitchenChoicePreprocessorID)
}

var bird = {
  _name:"dead eagle",
  _aliases:["eagle", "bird", "dead bird", "corpse"],
  _desc:"Once a monarch of the skies, now the erstwhile slave of a soon-to-be-dead wizard.  Things are looking up on your mission of vengance!",
  _tags:["portable"]
}

function kitchenPreprocessor(){
  if(this.inventory.indexOf(pole) > -1){
    kitchen._desc = "You heft the crowbar and deliver a mighty blow to the eagle.  He falls, dead.";
  }else{
    kitchen._desc = "Better not go in there.  There's a massive eagle in there.";
  }
}
function kitchenPostprocessor(){
  if(game.currentArea === kitchen){
      if(this.inventory.indexOf(pole) > -1){
      kitchen._desc = "This was a kitchen, once.  Now it looks more like an abattoir.";
      kitchen.contents.push(bird);
      game.removeProcessor(kitchenPostprocessorID);
      game.removeProcessor(kitchenPreprocessorID);
    }else{
      game.currentArea = hallway;
    }
  }
}

hallway.directions = {north:kitchen, up:upstairs};
kitchen.directions = {south:hallway};
upstairs.directions = {down:hallway};

var upstairsPreprocessorID;
function upstairsPreprocessor(text){
  if(this.inventory.indexOf(bird) > -1){
    upstairs._desc = "An invisible wall of <a data-hypertextType='sequence' data-content='ice, diamond' data-area='upstairs'>magic</a> blocks your path.  Your human flesh is too weak to even scratch at it.  The hall is below.  You might have <a onclick='takeform()' data-area='upstairs'>something</a> that could help."
  }else{
    upstairs._desc = "An invisible wall of <a data-hypertextType='sequence' data-content='ice, diamond' data-area='upstairs'>magic</a> blocks your path.  Your human flesh is too weak to even scratch at it.  The hall is below.";
  }
}

var diamond = {
  _name:"Diamond",
  _desc:"This always deserved a capital letter.  A galaxy's worth of power flashes between the exquisitely cut facets.  It is unknown whether it comes from the natural world, or from some great magician of the past.",
  _tags:["invisible", "portable"]
}

function takeform(){
  game.say("You stare at the eagle.  This is necromorphology 101.  You speak words of power in an ancient tongue: Esperanto.  Your hands meld with the claws of the bird, as the rest of its body crumbles to dust and disperses into the aether.  No longer diamond, the wards feel like sand beneath your talons.  Soon, you are through.");
  game.inventory.splice(game.inventory.indexOf(bird), 1)
  upstairs._desc = "A small landing.  The hall is down; the Diamond's power irresistably draws you north.  (Not so irresistably that you can't go where you want, however.  It's a wizard figure of speech.)";
  disableLinks("upstairs");
  game.removeProcessor(upstairsPreprocessorID);
  upstairs.directions.north = { //Create a new room on-the-fly.
    _name:"bedroom",
    _desc:"The bedroom is sparsely furnished: a sink, a table, a bed, a Diamond.",
    _tags:["area"],
    contents:[
      {
        _name:"sink",
        _desc:"White.  No tap.  Presumeably magic comes into it somewhere.",
        _tags:["invisible"]
      },
      {
        _name:"bed",
        _desc:"Someone should be sleeping here.  On reflection, you can hear him downstairs.  Make this quick.",
        _tags:["invisible"]
      },
      {
        _name:"table",
        _desc:"A small side table.  Nothing on it.", //TODO: supporters and containers.
        _tags:["invisible"],
      },
      diamond
    ]
  }
}

var diamondPostprocessorID;
var fightChoicePreprocessorID;
function diamondPostprocessor(text){
  if(this.inventory.indexOf(diamond) > -1){
    this.say("You take the Diamond and turn to leave.  Before you can take another step, though, you see the bad guy standing in the doorway.  <a onclick='fight()' class='blockchoice' data-area='prefight'>You could fight him...</a><a onclick='run' class='blockchoice' data-area='prefight'>...or you could run.</a>");
    this.removeProcessor(diamondPostprocessorID);
    fightChoicePreprocessorID = this.addProcessor(fightChoicePreprocessor, Processors.PREPROCESSOR);
  }
}

function fightChoicePreprocessor(text){
  switch(text){
    case "fight":
      fight();
      break;
    case "run":
      run();
      break;
    default:
      this.say("Please answer fight or run.");
  }
  this.stop();
}

function run(){
  disableLinks("prefight");
  game.removeProcessor(fightChoicePreprocessorID);
  game.say("You grasp the Diamond as tightly as you can and focus your thoughts on the wall behind you.  Energy in its purest form races through your veins and out of the base of your spine, leaving a gaping hole where there was once stone.  You dive through it, summoning the energy again, and fly off, with his shouts still ringing in your ears: &ldquo;I will find you!&rdquo;");
  game.say("<em>You run... and keep on running.  Forever.</em>");
  input.disabled = true;
}

function fight(){
  disableLinks("prefight");
  game.removeProcessor(fightChoicePreprocessorID);
  game.say("You and he trade blows, blasts, and one particularly nasty summoned cobra.  You seem to be gaining the upper hand.  <a onclick='kill()' class='blockchoice' data-area='fight'>You could kill him outright...</a><a onclick='restraint()' class='blockchoice' data-area='fight'>...or you could show some restraint.</a>");
  killChoicePreprocessorID = game.addProcessor(Processors.choiceProcessor("kill", kill, "restraint", restraint), Processors.PREPROCESSOR);
}

var killChoicePreprocessorID;
function killChoicePreprocessor(text){
  switch(text){
    case "kill":
      kill();
      break;
    case "show restraint":
    case "restraint":
      restraint();
      break;
    default:
      this.say("Please answer kill or restraint.");
  }
}

function kill(){
  disableLinks("fight");
  game.say("You take advantage of a moment of indecision on his part and drive your new talons into his heart.  You dispassionately watch his life bleed out before leaving, with the Diamond in your grasp.");
  game.say("<em>Your master's soul, or whatever it is wizards have, may rest in peace.  Wahey!</em>");
  input.disabled = true;
}

function restraint(){
  disableLinks("fight");
  game.say("You hold back.  He does no such thing, finding a loophole in your wards that allows him to conjure an icicle directly inside your liver.  You collapse in agony.");
  game.say("<em>Congratulations!  You've found the worst ending!</em>");
}


var game = new Game({
  _startArea:hallway,
  _onStart:function(){
    this.say("For twenty years, you have trained for this.  You have watched the killer of your master go from strength to strength, always aided by the Diamond.  The Diamond!  Magic enough for a city of the greatest wizards the world had ever seen, compressed into your hand!  Your master had discovered it, painstakingly dug it out of the ground, and, with you by his side, studied it, teasing out its secrets in the hope of gaining and spreading ever greater knowledge.");
    this.say("After his death, you could think of nothing but vengance.  You learned the craft of necromorphology, that of taking on the form of something dead.  You learned how to break wards.  You learned how to fight.  And now, you stand, undetected, in the hall of a murderer.");
    this.say("(Yes, I get it's clich&eacute;.  Don't judge me.  I needed a story so that the demo made any sort of sense.)")
    kitchenChoicePreprocessorID = this.addProcessor(kitchenChoicePreprocessor, Processors.PREPROCESSOR); //EITHER you can create a custom ruleset, OR you can add your processors in _onStart.  You decide.  I didn't want to go through the hassle of a whole new ruleset, and part of the point of this demo was to show off the standard rules, so I did it this way instead.  (This is the recommended solution for when you only have one or two changes you want to make to the standard rules.  You can use splice to add to the standard actions as well.)
    upstairsPreprocessorID = this.addProcessor(upstairsPreprocessor, Processors.PREPROCESSOR);
    diamondPostprocessorID = this.addProcessor(diamondPostprocessor, Processors.POSTPROCESSOR);
    input.disabled = false; //Re-enable the input every time we start the game, because refreshing the page doesn't do it for some reason.  Stupid cache.
  },
  _onParseFinished:function(){
    input.scrollIntoView(); //Scroll down whenever we've finished parsing a command.
  }
});

var input = document.getElementById("input");
var output = document.getElementById("output");

input.onkeypress = function(e){ //Parse when enter is pressed.
  e = e || window.event;
  var charCode = e.which || e.keyCode;
  if(charCode === 13){
    game.parse(input.value);
    input.value = "";
    input.focus();
  }
}

game.outputText = function(text){ //Override the outputText function to something other than the default console.log.
  output.innerHTML += text + "<br /><br />";
}

game.begin();
