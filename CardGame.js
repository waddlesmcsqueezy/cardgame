HANDS = {
  PLAYER: "player1",
  DEALER: "dealer",
  POOL: "pool",
  DISCARD: "discard"
}

FACE_VALUES = {
  JACK: "JACK",
  QUEEN: "QUEEN",
  KING: "KING",
  ACE: "ACE"
}

// CORE FUNCTIONS
// ------------------------------------------

async function apiCall(url){
  let response = await fetch(url);
  let data = await response.json();
  data = JSON.stringify(data);
  data = JSON.parse(data);
  return data;
}

// BASE DECK FUNCTIONS
// ------------------------------------------

async function createDeck(){
  let url = 'https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1'
  let deck = await apiCall(url)
  return deck.deck_id
}

async function getDeck(deckId) {
  let url = 'https://deckofcardsapi.com/api/deck/' + deckId
  let deck = await apiCall(url)
  return deck
}

async function drawCards(deckId, count) {
  let url = 'https://deckofcardsapi.com/api/deck/' + deckId + '/draw/?count=' + count
  let cards = await apiCall(url)
  return cards.cards
}

async function discardFromDeck(deckId, cardId) {
  let url = 'https://deckofcardsapi.com/api/deck/' + deckId + '/pile/' + HANDS.DISCARD + '/add/?cards=' + cardId
  let response = await apiCall(url)
  return response.piles.discard
}

// BASE HAND FUNCTIONS
// ------------------------------------------

async function getHand(deckId, hand) {
  let url = 'https://deckofcardsapi.com/api/deck/' + deckId + '/pile/' + hand + '/list/'
  let response = await apiCall(url)
  let pile = response.piles[hand]
  return pile
}

async function addToHand(deckId, hand, cardId) {
  let url = 'https://deckofcardsapi.com/api/deck/' + deckId + '/pile/' + hand + '/add/?cards=' + cardId
  let response = await apiCall(url)
  return response
}

async function drawIntoHand(deckId, hand, count) {
  let cards = await drawCards(deckId, count)
  let response
  for (let i = 0; i < count; i++) {
    response = await addToHand(deckId, hand, cards[i].code)
  }

  return response
}

async function drawFromHand(deckId, hand, cardId) {
  let url = 'https://deckofcardsapi.com/api/deck/' + deckId + '/pile/' + hand + '/draw/?cards=' + cardId
  let response = await apiCall(url)
  return response.cards
}

async function discardHand(deckId, hand) {
  let tempHand = await getHand(deckId, hand)
  let discardPile
  let handSize = tempHand.cards.length
  let drawnPile = []

  for (let i = handSize - 1; i >= 0; i--) {
    card = await drawFromHand(deckId, hand, tempHand.cards[i].code)
    drawnPile.push(card[0])
  }

  for (let i = handSize - 1; i >= 0; i--) {
    discardPile = await addToHand(deckId, HANDS.DISCARD, drawnPile[i].code)
  }

  return discardPile
}

// BLACKJACK FUNCTIONS
// ------------------------------------------

async function getHandValueBlackjack(deckId, hand) {
  let tempHand = await getHand(deckId, hand)
  let aceCount = 0
  let handValue = 0
  //console.log(tempHand)
  //count all cards except aces
  for (let i = 0; i < tempHand.cards.length; i++) {
    //console.log(tempHand.cards[i].value)
    if (tempHand.cards[i].value == FACE_VALUES.JACK || tempHand.cards[i].value == FACE_VALUES.QUEEN || tempHand.cards[i].value == FACE_VALUES.KING) {
      handValue += 10
      //console.log("adding 10")
    } else if (tempHand.cards[i].value == FACE_VALUES.ACE) {
      aceCount += 1
    } else {
      handValue += parseInt(tempHand.cards[i].value)
      //console.log("adding " + tempHand.cards[i].value)
    }
  }

  if (aceCount > 0) {
    if (11 + (aceCount - 1) + handValue > 21) {
      handValue += aceCount
      //console.log("adding " + aceCount)
    } else {
      handValue += 11 + (aceCount - 1)
      //console.log("adding " + (11 + (aceCount - 1)))
    }
  }

  return handValue
}

async function isHandBustedBlackjack(deckId, hand) {
  let handValue = await getHandValueBlackjack(deckId, hand)
  return handValue > 21
}

async function drawBlackjackHand(deckId, hand) {
  let newHand = await drawIntoHand(deckId, hand, 2)
  return newHand
}

async function blackjack() {

}

// DOM FUNCTIONS
// ------------------------------------------

async function updateHand(deckId, hand) {
  let tempHand = await getHand(deckId, hand)
  let handElementId = "hand_" + hand
  let handElement = $("#" + handElementId).empty()
  handElement.append($("<h3>" + hand + "'s hand</h3>"))
  for (let i = 0; i < tempHand.cards.length; i++) {
    let cardElement = $("<img></img>").attr("id", hand + "_card_" + i)
    cardElement.attr("src", tempHand.cards[i].image)
    handElement.append(cardElement)
  }
  handElement.append($("<h3>Value: " + await getHandValueBlackjack(deckId, hand) + "</h3>"))
}

// MAIN
// ------------------------------------------

async function main() {
  let deck1 = await createDeck()
  console.log("Session deckID: " + deck1)
  await drawBlackjackHand(deck1, HANDS.PLAYER)
  await drawBlackjackHand(deck1, HANDS.DEALER)
  console.log(await getHandValueBlackjack(deck1, HANDS.PLAYER))

  while (!(await isHandBustedBlackjack(deck1, HANDS.PLAYER))) {
    console.log("Hand is not busted and worth " + await getHandValueBlackjack(deck1, HANDS.PLAYER) + ", drawing...")
    let cardDrew = await drawIntoHand(deck1, HANDS.PLAYER, 1)
    console.log("Drew")
  }

  let handValue = await getHandValueBlackjack(deck1, HANDS.PLAYER)
  console.log("Busted at " + handValue)
  console.log(await getHand(deck1, HANDS.PLAYER))

  updateHand(deck1, HANDS.PLAYER)
  updateHand(deck1, HANDS.DEALER)
}

main()
