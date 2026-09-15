package game

// BotDecision is deliberately deterministic from the room's private state.
// It never crosses the client boundary, so a player cannot inspect bot dice.
type BotDecision struct {
	Challenge bool
	Bid       *Bid
}

func DecideBotTurn(room *Room, bot *Player) BotDecision {
	prev := room.Round.CurrentBid
	if prev != nil && shouldChallenge(prev, bot.Dice, len(room.Players), room.Settings.DicePerPlayer) {
		return BotDecision{Challenge: true}
	}

	for count := 1; count <= len(room.Players)*room.Settings.DicePerPlayer; count++ {
		for face := 1; face <= 6; face++ {
			candidate := &Bid{PlayerID: bot.ID, Count: count, Face: face, Mode: "fei"}
			if ValidateBid(prev, candidate, len(room.Players), room.Settings.DicePerPlayer) == nil {
				return BotDecision{Bid: candidate}
			}
		}
	}
	return BotDecision{Challenge: true}
}

func shouldChallenge(bid *Bid, dice []int, playerCount, dicePerPlayer int) bool {
	known := 0
	for _, die := range dice {
		if die == bid.Face || (bid.Mode == "fei" && bid.Face != 1 && die == 1) {
			known++
		}
	}
	unknown := playerCount*dicePerPlayer - len(dice)
	// In fei mode a non-one face has a 2/6 chance per unknown die; in zhai
	// mode (and for ones) it is 1/6. Challenge only when a bid is beyond a
	// modestly generous expectation, keeping the bot readable rather than cruel.
	numerator := 1
	if bid.Mode == "fei" && bid.Face != 1 { numerator = 2 }
	expectedTwice := known*2 + (unknown*numerator)/3*2
	return bid.Count*2 > expectedTwice+2
}
