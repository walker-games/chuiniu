package game

import "testing"

func TestBotChallengesClearlyImpossibleBid(t *testing.T) {
	room := NewRoom("human", "Human", "")
	room.AddDefaultBot()
	room.StartRound("bot-fox")
	bot := room.GetPlayer(DefaultBotID)
	bot.Dice = []int{2, 2, 3, 4, 5}
	room.Round.CurrentBid = &Bid{PlayerID: "human", Count: 10, Face: 6, Mode: "zhai"}

	decision := DecideBotTurn(room, bot)
	if !decision.Challenge {
		t.Fatal("bot should challenge an impossible 10x6 bid with only 10 dice")
	}
}

func TestBotReturnsLegalEscalatingBid(t *testing.T) {
	room := NewRoom("human", "Human", "")
	room.AddDefaultBot()
	room.StartRound("bot-fox")
	bot := room.GetPlayer(DefaultBotID)
	bot.Dice = []int{1, 2, 3, 4, 5}
	room.Round.CurrentBid = &Bid{PlayerID: "human", Count: 1, Face: 1, Mode: "fei"}

	decision := DecideBotTurn(room, bot)
	if decision.Challenge || decision.Bid == nil {
		t.Fatal("bot should make a legal bid against a safe opening bid")
	}
	if err := ValidateBid(room.Round.CurrentBid, decision.Bid, len(room.Players), room.Settings.DicePerPlayer); err != nil {
		t.Fatalf("bot returned invalid bid: %v", err)
	}
}
