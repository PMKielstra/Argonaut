# Argonaut IF

## What is it?
It's an engine for Interactive Fiction (IF) that does two things differently:
+ It's built for the modern web.  It's 100% JavaScript, no interpreters or dependencies needed.
+ It fuses parser and hypertext technologies seamlessly.  Ever wished an Inform game could launch Twine, or vice versa?  Argonaut does that, and it does it well enough that most of your code works the same way no matter if the player is using the keyboard or mouse.

## Why?
IF is suffering from a sort of polarization right now.  Those on the side of hypertext-based systems like Twine are riding along on the crest of a wave, while parser fans (TADS, anyone?) are writing blog posts like [Rescuing the interactive fiction parser from oblivion](http://notimetoplay.org/2016/12/25/rescuing-the-interactive-fiction-parser-from-oblivion/).  This all seems rather strange to me.  Computers can take input any way they want, and display output any way that makes sense on the screen.  Why couldn't you have IF written for both keyboard and mouse?  Parsers are, in my opinion, the best way to explore large worlds.  Their versatility shines when you have a series of areas in which you can take a number of actions.  Hypertext is fabulous for making short, snappy choices.  Kill him or let him live?  It's far more fun to click than to type.  Integration of the two just seemed like the next natural step.

## Why isn't it...
+ ...Inform 7?  Inform does allow a sort of "press 1, press 2"-style telephone menu, but without a specialist parser or very large and complex extensions you can't click anything.  Clicking is native for Argonaut.
+ ...Twine?  Typing is also native for Argonaut.
+ ...Quixe?  Quixe is indeed pure JavaScript, but it's an interpreter for Glulx.  You don't write for Quixe in a language native for the web.  That means that everything runs very slowly as your browser has to essentially talk to the website through a translator rather than speaking its native tongue.
+ ...Confusing and complicated?  You don't actually need to know a lot of JavaScript to use Argonaut.  It certainly doesn't hurt if you do, but defining areas and objects are both done with simple syntax that is superficially similar to that of TADS.  Movement and basic rules are implemented for you.  After that, there are maybe ten lines of code that you can learn that will handle most of your use cases.  (Besides, JavaScript is far easier to read, with practice, than some languages out there.)

## I love it!
That's great to hear.  Check out the wiki for details of how to write your first Argonaut stories.  Pull requests that don't fix bugs may not be accepted right about now; this is a fledgling project and I still want a lot of control over the directions it goes in.  Having said that, if you do have an idea, please don't hesitate to throw an implementation together.

## I hate it!
We use the GitHub issue tracker.

## I still can't decide...
It's free, easy to use, and gives you complete control over your game in an easy-to-understand package.  It's small, it's fast, and it's got no dependencies.  It's extensible, it's got a full set of features, and it's written in a modern language.  What's not to like?

## What's not to like?
Quite a lot, currently, as it turns out.  This project is still in beta.
+ Containers and supporters are not implemented yet.
+ The standard parser only supports around ten verbs.
+ Bugs, probably.

If you can fix any of these things, please send in a pull request.
