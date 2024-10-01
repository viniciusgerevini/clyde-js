# Clyde

Clyde is a language for writing game dialogues. It supports branching dialogues, translations and interfacing with your game through variables and events.

It was heavily inspired by [Ink](https://github.com/inkle/ink), but it focuses on dialogues instead of narratives.

You can play with the online editor [here](https://viniciusgerevini.github.io/clyde/).

### Principles

- Simple to write. As close to regular writing as possible.
- File as the source of truth. No extra databases or random data is created during parsing.
- Simple API. While other dialogue solutions try to be full game engines, Clyde's goal is to handle dialogues only, providing a simple interface that can be used in different scenarios.
- Localisation in mind.


## Interpreter's interface

Even though this document is focused on the language itself, I think it's a good idea to give a basic overview of the interpreter's interface for a easier understanding. I'll use the JavaScript implementation for reference.

``` javascript
const dialogue = Interpreter(dialogueDocument);

// Start or restart the dialogue from the beginning. Optional when no block provided.
dialogue.start(blockName);

// Listen to events (variable changed, event triggered)
dialogue.on(eventName, callback);

// Remove event listener
dialogue.off(eventName, callback);

// Return next dialogue line
dialogue.getContent();

// Choose one of the available options (branch)
dialogue.choose(index);

// Set variable to be used by the dialogue
dialogue.setVariable(name, value);

// Get value of variables set in the dialogue
dialogue.getVariable(name);

// Set callback to be used when requesting external variables.
onExternalVariableFetch(callback: ((name: string) => any) | undefined): void;

// Set callback to be used when an external variable is updated in the dialogue.
onExternalVariableUpdate(callback: ((name: string, value: any) => void) | undefined): void;

// Load a dictionary with translations.
// when returning a line with line id defined, it looks first in this object
// for translation before returning the value. Useful for localisation.
dialogue.loadDictionary(dictionary);

// Return all variables and internal variables. Useful for persisting the dialogue's internal data,
// such as options already choosen and random variations states.
dialogue.getData();

// Load internal data
dialogue.loadData(data);

// clear all internal data
dialogue.clearData();
```

The main methods used are `getContent()` and `choose(int)`.

`getContent()` returns the next dialogue line. It may return one of the following types:

**line**: A simple dialogue line.
```javascript
{ type: 'line', speaker: 'Captain', text: 'Ahoy!', id: '123', tags: ["happy"] }
```

**options**: A list with options or topics the player may choose from (branches).
```javascript
{
    type: 'options',
    name: 'What do you want to talk about?',
    speaker: 'NPC',
    options: [{ label: 'Life' }, { label: 'The Universe' }, { label: 'Everything else' }]
}
```

When `options` are available, you can choose one of them by passing its index to the dialogue object. Option's index starts from 0:

```javascript
dialogue.choose(0);
```

When in an options state, any subsequent call to `getContent()` will return the same options object, until a choice is made.

**end**: This means the dialogue has reached an end. Any subsequent call to `getContent` will return an end object.
```javascript
{ type: 'end' }
```

Currently there are two interpreter implementations: a [JavaScript version](), and a [Godot's GDScript version](https://github.com/viniciusgerevini/godot-clyde-dialogue). Check the respective links for more details on how to use them. They expose similar interfaces, but there are some differences due to language standards and how each engine handles events and localisation.


## Basics


### Comments

To ignore a line you can use `--`.

```
-- this line is ignored
this line isn't
```
Output:

```javascript
// get content
{ type: "line", text: "this line isn't" }
```

### Dialogue line

Each line becomes a dialogue line:

```
This is a simple text!
This is another line.
```

Output:
```javascript
// get content
{ type: 'line', text: 'This is a simple text!' }

// get content
{ type: 'line', text: 'This is another line.' }
```

### Grouping lines

If you want to group multiple lines in one call, you just need to indent the subsequent lines. You can choose to use spaces or tabs (or even both, however, I don't recommend that):

```
This is the first dialogue line.
    This is still the first dialogue line.
But this is the second line.
```

Output:
```javascript
// get content
{ type: 'line', text: 'This is the first dialogue line. This is still the first dialogue line.' }

// get content
{ type: 'line', text: 'But this is the second line.' }
```

### Speaker

Use `:` to set a line speaker. Anything from the beginning of the line to `:`(colon) is used as speaker.

```
Hagrid: Harry, yer a wizard.
Harry Potter: I'm a what?
```

Output:
```javascript
// get content
{ type: 'line', speaker: 'Hagrid', text: 'Harry, yer a wizard.' }

// get content
{ type: 'line', speaker: 'Harry Potter', text: "I'm a what?" }
```

When defining multiple lines with same speaker, you can set the same speaker for all lines
by indenting them after the speaker:

```
Vinny:
    Multiple lines can be set with same speaker.
    You just need to indent them after the speaker line.
    Grouping lines also work this way
        by indenting the line further.
```

Output:
```javascript
// get content
{ type: 'line', speaker: 'Vinny', text: 'Multiple lines can be set with same speaker.' }
// get content
{ type: 'line', speaker: 'Vinny', text: 'You just need to indent them after the speaker line.' }
// get content
{ type: 'line', speaker: 'Vinny', text: 'Grouping lines also work this way by indenting the line further.' }
```

### Line ID

Use `$` + `[A-Za-z0-9_]` to set a line id:

```
Hagrid: Harry, yer a wizard. $line001
Harry Potter: I'm a what? $line_02
```

Output:
```javascript
// get content
{ type: 'line', id: 'line001', speaker: 'Hagrid', text: 'Harry, yer a wizard.' }

// get content
{ type: 'line', id: 'line_02', speaker: 'Harry Potter', text: "I'm a what?" }
```

IDs are useful for localisation, where you can organise your translations in files with key values (json, csv) and use them to replace dialogue lines with their translated equivalents.

#### ID suffixes

Append `&` + `[A-Za-z0-9_]` to a line id to set suffixes.

Id Suffixes aim to improve translations and dynamic lines. They allow you to use
different keys from a dictionary based on values from variables in runtime.

Here is an example. For the given dialogue:
```
Hello, sister! $line001&player_pronoun
```

If the variable `player_pronoun` is set as `F`, the translation lookup will happen in this order: `line001&F`, `line001` and then it falls back to the default line. Multiple suffixes can be set by chaining the variables: `$line001&variable_1&variable_2`.

This can also be used to simplify dialogue files. If you have a dictionary like this:
```
LINE_001;Hello, friend.
LINE_001&F;Hello, sister.
LINE_001&M;Hello, brother.
```
You could change your dialogue from this:
```
Hello, sister.  $LINE_001 { when pronoun is "F" }
Hello, brother. $LINE_002 { when pronoun is "M" }
Hello, friend.  $LINE_003 { when not pronoun }
```
To this:
```
Hello, sister. $LINE_001&pronoun
```

### Tags

Use `#` + `[A-Za-z0-9_]` to set line tags:

```
WHAT DID YOU DO! #yelling #scared
```

Output:
```javascript
// get content
{ type: 'line', text: 'WHAT DID YOU DO!', tags: ['yelling', 'scared'] }
```

Tags are useful metadata that can be used as you wish. Probably the most obvious usage would be changing dialogue bubble pictures to convey different emotions. (happy, sad, angry)

### Escaping characters

If you need to use special characters in your dialogue, you can scape them by using `\` or surrounding your text with quotes:

```
It will cost you \$100.
"This is an example: ###"
'This is another example: ###'
"You can even escape \" inside \"\""
```

Output:
```javascript
// get content
{ type: 'line', text: 'It will cost you $100.'}

// get content
{ type: 'line', text: 'This is an example: ###'}

// get content
{ type: 'line', text: 'This is another example: ###'}

// get content
{ type: 'line', text: 'You can even escape " inside ""'}
```

### Options (a.k.a branches)

To define options or branches you can use `*` (single use), `+` (sticky) or `>` (fallback).

### Simple options
```
* yes
  Let's do this!
* no
  Not this time!

continue
```

Output:
```javascript
// get content
{
    type: 'options',
    options: [
        { label: 'yes' },
        { label: 'no' },
    ]
}

// choose 0

// get content
{ type: 'line', text: "Let's do this!" }

// get content
{ type: 'line', text: 'continue'}
```

#### Your options may be single lines:

By default, option labels are not returned as content. If you want to return a label, you can
use the option display character `=`:
```
*= yes
*= no

continue
```

Output:
```javascript
// get content
{
    type: 'options',
    options: [
        { label: 'yes' },
        { label: 'no' },
    ]
}

// choose 0

// get content
{ type: 'line', text: 'yes'}

// get content
{ type: 'line', text: 'continue'}
```

### It may contain multiple lines:
```
* I need to think about that
    some line
    some other line
*= Simple option

continue
```

Output
```javascript
// get content
{
    type: 'options',
    options: [
        { label: 'I need to think about that' },
        { label: 'Simple option' },
    ]
}

// choose 0

// get content
{ type: 'line', text: 'some line'}

// get content
{ type: 'line', text: 'some other line'}

// get content
continue
```

### Nested options:

Options can be nested:

```
* Option a - has nested options
    *= Yes
    * No
        nope
*
    Option b - starts in another line
    and goes on...
        and on

continue
```

Output
```javascript
// get content
{
    type: 'options',
    options: [
        { label: 'Option a - has nested options' },
        { label: 'Option b - starts in another line' }
    ]
}

// choose 0

// get content
{
    type: 'options',
    options: [
        { label: 'Yes' },
        { label: 'No' }
    ]
}

// choose 1

// get content
{ type: 'line', text: 'Nope'}

// get content
{ type: 'line', text: 'continue'}
```

### Options list's title

Depending on how you show your dialogue, your options list may lose its context. To prevent that, you can define titles for your options list by indenting its block.

```
Do you like turtles?
    *= Yes
    *= No
```

Output
```javascript
// get content
{
    type: 'options',
    name: 'Do you like turtles?',
    options: [
        { label: 'Yes' },
        { label: 'No' }
    ]
}

// choose 0

// get content
{ type: 'line', text: 'Yes'}
```

### Sticky options

Option's default behaviour is to be removed from the list once used:

```
* Option a
    A
* Option b
    B

```

Output
```javascript
// get content
{
    type: 'options',
    options: [
        { label: 'Option a' },
        { label: 'Option b' }
    ]
}

// choose 0

// get content
{ type: 'line', text: 'A'}

// restart dialogue

// get content
{
    type: 'options',
    options: [
        { label: 'Option b' }
    ]
}
```

This is not always the desired behaviour. For that, you can use `+` for sticky options:

```
+ Option a
    A
* Option b
    B

```

Output
```javascript
// get content
{
    type: 'options',
    options: [
        { label: 'Option a' },
        { label: 'Option b' },
    ]
}

// choose 0

// get content
{ type: 'line', text: 'A'}

// restart dialogue

// get content
{
    type: 'options',
    options: [
        { label: 'Option a' },
        { label: 'Option b' },
    ]
}

```

### Fallback options

A fallback option (`>`) is an option that is executed automatically when there is no other option available. When more than one option is available, it behaves like a sticky option.

```
* Let's talk about it.
    A
> That's all for today.
    B

```

Output
```javascript
// get content
{
    type: 'options',
    options: [
        { label: "Let's talk about it." },
        { label: "That's all for today." },
    ]
}

// choose 0

// get content
{ type: 'line', text: 'A'}

// restart dialogue

// get content
{ type: 'line', text: 'B'}

```
In the example above, after the first option is used, the only option remaining is a fallback option. The next time content is requested the fallback option's content is returned without the need of selecting the option.


### Blocks and Diverts

Nesting content can get messy real quick. An alternative is to group your content in blocks `== BLOCK NAME`, and use diverts `-> BLOCK_NAME` to link them. `BLOCK_NAME` should be `[A-Za-z0-9_- ]`.

```
What do you want to talk about?
    * Life
      -> talk about life
    * The universe
      -> talk about the universe
    * Everything else...
      -> talk about everything else

== talk about life
player: I want to talk about life!
npc: Well! That's too complicated...

== talk about the universe
player: I want to talk about the universe!
npc: That's too complex!

== talk about everything else
player: What about everything else?
npc: I don't have time for this...

```

``` javascript
// get content
{
    type: 'options',
    name: 'What do you want to talk about?'
    options: [
        { label: 'Life' },
        { label: 'The universe' },
        { label: 'Everything else' }
    ]
}

// choose 1

// get content
{ type: 'line', speaker: 'player', text: 'I want to talk about the universe!' }

// get content
{ type: 'line', speaker: 'npc', text: "That's too complex!" }
```

Blocks also allow you to have multiple dialogues in the same file and run them independently from each other.

### Divert to parent

You can use `<-` to divert back to the parent block or parent option list.

By default, blocks do not return to their callers.

Because of that, in the following example, the `npc: Let's continue...` line will never be called.
```
npc: What do you want to do?

-> talk about life

npc: Let's continue with another conversation.



== talk about life
player: I want to talk about life!
npc: Well! That's too complicated...

```

To keep the progression in the main block, you should use a divert to parent `<-` inside the block.

```
npc: What do you want to do?

-> talk about life

npc: Let's continue with another conversation.


== talk about life
player: I want to talk about life!
npc: Well! That's too complicated...
<-

```

Diverts to parent can also be used in the options list, to allow the player to go through all options if they wish to.

```
What do you want to talk about?
    * Life
      -> talk about life
      <-
    * The universe
      -> talk about the universe
      <-
    * Everything else...
      -> talk about everything else
      <-
    + Nothing in special
        I don't want to talk about anything.

npc: That's all for today!

-- blocks definitions after this line

== talk about life
player: I want to talk about life!
npc: Well! That's too complicated...
<-

== talk about the universe
player: I want to talk about the universe!
npc: That's too complex!
<-

== talk about everything else
player: What about everything else?
npc: I don't have time for this...
<-
```

You can join both diverts together in the same line for a cleaner look:

```
What do you want to talk about?
    * Life
      -> talk about life <-
    * The universe
      -> talk about the universe <-
    * Everything else...
      -> talk about everything else <-
    + Nothing in special
        I don't want to talk about anything.
```

### Ending a dialogue

By default, the dialogue ends when it reaches a point with no next line available.  But you can also end a dialogue earlier by using `-> END`.

```
Do you wish to continue?
    + Yes
    + Maybe
        <-
    + No
        -> END

As I was saying...
```

The first option will continue to line `As I was saying...`. The second option will return to the options list so you can choose again. The third option will end the dialogue and ignore any subsequent line.


## Variations

In some cases, you may have a dialogue that can be repeated multiple times. To make things more interesting, you can use variations `(` `)` to show a different message every time the dialogue is executed.

```
-- simple lines

( shuffle cycle
    - Hi!
    - Hello!
    - Hey!
)

What are you doing here?

(
   -
     I thought you were travelling!
     Far abroad.
   -
     I thought you were dead!
     I know! How dark is that?.
)
```

There are a few different behaviours available for variations (`sequence`, `once`, `cycle`, `shuffle`):

**cycle**(default): This option returns each item and, when reaching the end, starts again from the beginning.

**sequence**: It will return each item once, and then it will stick to the last one.

For example, in the following block, the first time will return `Once`, the second time `Twice` and every other call after that will return `I lost count...`.

```
( sequence
   - Once
   - Twice
   - I lost count...
)
```

**once**: Return each item in sequence only once. Using the previous example, after `I lost count...` is shown, the next dialogue calls will not return any of those lines anymore, skipping straight to the next line in the dialogue.

**shuffle**: Randomize variations. Any of the previous options can be used in combination with shuffle. (`shuffle`, `shuffle sequence`, `shuffle once`, `shuffle cycle`).


The following example will show each item following a random sequence. Once all items are shown, the sequence will be randomised again, and it will return the items in a different order.

```
( shuffle cycle
   - Executor?
   - Your command?
   - What would you ask of me?
   - I hunger for battle...
)
```

As opposed to `shuffle sequence`, `shuffle cycle` and `shuffle once`, the standalone `shuffle` option will work as regular randomization with no guarantee all items will be visited.

Variations can be nested and may contain other elements, like options and diverts:

```
npc: How is the day today?
( shuffle once
   -
     npc2: Rainny
     npc: do you like rainny days?
        * yes
        * no
   -
     npc2: Sunny
     -> sunny days rambling
   -
    ( shuffle
     - not to bad
     - good
    )
)

== sunny days rambling
something something
```

## Logic, conditions, variables and events

Now that you know the basics, you can step up your branching game by using variables and conditions with logic blocks, defined by `{` and `}`.

Logic blocks may contain:


**Logical operators:**: Equals `==` or `is`, Not equals: `!=` or `isnt`, Not: `!` or `not`, Greater, Less, etc: `>`, `<`, `>=`, `<=`.

**Math operators**: sum `+`, subtract `-`,  multiply `*`, divide `/`,  power `^`,  modulo/remainder `%`.

**Assignment operators**: assign `=`, sum `+=`, subtract `-=`, multiply `*=`, divide `/=`, power `^=`, modulo `%=` and init `?=`.

**Literals**: Number (`100`, `1.5`), String (`"some text"`, `'some text'`), Boolean (`true`, `false`), Null (`null`).

**Keywords**: `set`, `trigger`, `when`.

There are three types of logic blocks: assignments, conditions, and triggers.

### Assignments

Besides setting variables using the interpreter method, you can set variables internally with assignment blocks. Assignment blocks need to start with the `set` keyword. Here are some examples:

```
-- standalone
{ set is_happy = true }

-- after line
some text here { set is_happy = true}

-- before line
{ set is_happy = true} some text here

-- both sides
{ set something = 1 } some text here { set something += 1 }

-- multiple assignments
some text here { set is_happy = true, is_naughty = false, a = b, b = 2 }
```

Regardless of the position, the assignment will always be executed when the line is returned.

The initializer assigment `?=` can be used when you wish to only set the variable if it's still unset.

```
{ set count ?= 1 } -- count will be set to 1

{ set count ?= 2 } -- count will remain 1, as it's already set
```

### Conditions

Conditions are used to control which lines should be shown. They do not require any special keyword, but you can optionally use `when` to explicitly show that the block is a condition. Examples:

```
{ set something = true }
{ set gender = "female" }

-- after line
some text here { something }

-- before line
{ not something } some text here

-- with when keyword
some text here { when not something }

-- both sides
{ something } some text here { something_else }

-- complex conditions
some text here { something and a == b or b >= c and not v }
some text here { something && a == b || b >= c && ! v }

-- with options
+ { not something } options a
* { hp < 50 } options b
* options c { when hp == 30 }

-- with variations
( cycle
    - Hello, sister. { when gender == "female" }
    - Hello, brother. { when gender == "male" }
)

-- with multiple lines
{ something }
    one line
    another line
    yet another line

```

As you may have noticed, you can't mix assignments and conditions in the same block. However, you can define multiple blocks in the same line, like this:

```
say something { when not something } { set something = true }
```

Just be aware that order matters. i.e.

```
-- Condition is checked before assignment. This line won't be returned.
say something { when something } { set something = true }

-- Condition is checked after assignment. This line will be returned.
say something { set something = true } { when something }

-- Condition is checked before assignment.  This line won't be returned.
{ when something }  say something { set something = true }

-- Condition is checked after assignment. This line will be returned.
{ set something = true } say something { when something }

```

### Triggers

There may be cases where you'd want your game to be notified that something happened in your dialogue. There are two ways to achieve that: by triggering events or by observing variable changes.

You can trigger events using the `trigger` block.

```
* allow { trigger allowed }
* deny { trigger denied }
```

Your interpreter will expose a way to listen to these events. This will vary depending on implementation. To use the JavaScript interpreter as example:

```javascript
dialogue.on(Clyde.EVENT_TRIGGERED, (eventName) => {
    if (eventName === 'allowed') {
        console.log("do something");
    }
});
```

You can also listen to variables changes, like this:

```javascript
dialogue.on(Clyde.VARIABLE_CHANGED, (name, value, previousValue) => {
    if (name === 'hp' && previousValue < value) {
        console.log("damage taken");
    }
});
```

### Using variables in text

You can use values from variables in your text by referencing them with `%` `%`.

```
{ set playerName = 'Vini' }
Hello, %playerName%! Long time no see.
```

This should print `Hello, Vini! Long time no see!`

This can be used with variables defined internally or externally.

### External variables

External variables can be accessed using the `@` prefix. They are saved outside the dialogue data and the interpreter should provide callbacks to fetch and update these variables.

They are useful when dealing with data that belongs to your game and shouldn't be persisted with the dialogue. They can be set and used in the dialogue like this:

```
-- set
{ set @hp = 10 }

-- use
{ @hp > 10 }

-- interpolation
Hello, %@player_name%!
```

Here is an example on how the callbacks to fetch and update the data can be used:

```
dialogue.onExternalVariableFetch((name: string): any => {
    return my_persistence_object[name];
});

dialogue.onExternalVariableUpdate((name: string, value: any): void => {
    my_persistence_object[name] = value;
});

```

### Special variables

#### OPTIONS_COUNT

`OPTIONS_COUNT` contains the number of options available in an option list.

For example:

```
{ set hp = 50, mp = 30 }

You have %OPTIONS_COUNT% available
    + { hp < 30 } Give me health!
    + { mp == 100 } I'm fully loaded!
    + { mp < 50 } Give me mana!
    + { OPTIONS_COUNT > 1 } I'm fine. Thanks!
Ok
```
In the example above, due to the conditional options, `OPTIONS_COUNT` is 2. If mp were between 50 and 99, `OPTIONS_COUNT` would be 1, making the last condition false, and skipping all options altogether.

## Conclusion

That's pretty much all features implemented. You can check the `/examples` folder for more examples.

All examples on this page are valid dialogues that can be run on the live [interpreter](https://viniciusgerevini.github.io/clyde/).

