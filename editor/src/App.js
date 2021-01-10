import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux';

import reducer from './redux/reducers';
import MainPanelsContainer from './screens/MainPanelsContainer';

const value = `
# Pulp Fiction: Jules and Vincent first car scene.
# adapted for showing off features.

{ not introductionMade } Jules: Okay now, tell me about that. { set introductionMade =  true, europeTopicsTalked = 0 }
>> Vincent: What do you want to know? $id: 123
  * Is hash legal there? $id: 456
    -> about_hash
    <-
  { europeTopicsTalked < 4 } + Something about Europe.
    -> about_europe
    <-
  { OPTIONS_COUNT > 1 } + Nah, maybe another time
    [ shuffle
      Vincent: Alright!
      Vincent: No problem!
      Vincent: Ok!
    ]
<<
Jules: Enough talk. Let's get to work!

== about_hash
Jules: is hash legal there? $id: 678 |something,wat|
Vincent: yes, but is ain't a hundred percent legal.
         I mean you can't walk into a restaurant, roll a joint,
         and start puffin' away. You're only supposed to smoke in
         your home or certain designated places.
Jules: Those are hash bars?
Vincent: Yeah, it breaks down like this: it's legal to buy it,
         it's legal to own it and, if you're the proprietor of a
         hash bar, it's legal to sell it. It's legal to carry it,
         which doesn't really matter ' cause - get a load of this -
         if the cops stop you, it's illegal for this to search you.
         Searching you is a right that the cops in Amsterdam don't have.
Jules: That did it, man - I'm f**n' goin', that's all there is to it.
<-

== about_europe
{ europeTopicsTalked == 0 } Vincent: You know what the funniest thing about Europe is?
{ europeTopicsTalked == 0 } Jules: what?
{ europeTopicsTalked == 0 } Vincent: It's the little differences. A lotta the same sh*t we got here,
                                     they got there, but there they're a little different.
[
  Jules: Examples?
  Jules: Tell me more about Europe.
]
>> About Europe...
  * You can buy a beer in a movie theatre.
    -> europe_beer
    <-
  * You know what they call a Quarter Pounder with Cheese in Paris?
    -> europe_quarter_pound
    <-
  { quarterPounderTalkCompleted } * What do they call a Whopper?
    -> europe_whooper
    <-
  * What they put on the french fries instead of ketchup.
    -> europe_ketchup
    <-
  { OPTIONS_COUNT > 1 } + I'm suddenly not interested anymore.
    Jules: We talk about this another time.
<<
{ set europeTalkCompleted = true }
<-

== europe_beer
Vincent: Well, in Amsterdam, you can buy beer in a
         movie theatre.
Vincent: And I don't mean in a paper
         cup either. They give you a glass of beer,

{ set europeTopicsTalked += 1}
<-

== europe_quarter_pound
Vincent: You know what they call a Quarter Pounder with Cheese in Paris?
Jules: They don't call it a Quarter Pounder with Cheese?
Vincent: No, they got the metric system there, they wouldn't know what
         the f a Quarter Pounder is.
Jules: What'd they call it?
Vincent: Royale with Cheese.
Jules: Royale with cheese. What'd they call a Big Mac?
Vincent: Big Mac's a Big Mac, but they call it Le Big Mac.
{ set quarterPounderTalkCompleted = true }
{ set europeTopicsTalked += 1}
<-

== europe_whooper
Jules: What do they call a Whopper?
Vincent: I dunno, I didn't go into a Burger King.
{ set europeTopicsTalked += 1}
<-

== europe_ketchup
Vincent: You know what they put on french fries in Holland
         instead of ketchup?
Jules: What?
Vincent: Mayonnaise.
Jules: Goddamn!
Vincent: I seen 'em do it. And I don't mean a little bit
         on the side of the plate, they freakin' drown 'em in it.
Jules: Uuccch!
{ set europeTopicsTalked += 1}
{ trigger something }
<-

== something
this block is not used
-> END
`;

const store = configureStore({
  reducer,
  devTools: process.env.NODE_ENV !== 'production',
  preloadedState: loadState(),
})

function loadState() {
  return {
    interfaceConfig: {
      isEditorEnabled: true,
      isProjectTreeEnabled: true,
      isInterpreterEnabled: true
    },
    editor: {
      currentValue: value
    }
  };
}

function App() {
  return (
    <Provider store={store}>
      <MainPanelsContainer />
    </Provider>
  );
}

export default App;
