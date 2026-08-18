export type MessageSchema = {
  common: {
    confirm: string
    cancel: string
    back: string
    loading: string
    copy: string
    copied: string
    share: string
    waiting: string
    you: string
    unknown: string
    clickToClose: string
    copyLink: string
    tgShareText: string
    tgShare: string
  }
  home: {
    title: string
    subtitle: string
    createRoom: string
    joinRoom: string
    roomCodePlaceholder: string
    history: string
    creatorLabel: string
    remoteWork: string
    jobContact: string
    errorCreate: string
    errorJoin: string
    defaultPlayerName: string
  }
  lobby: {
    roomLabel: string
    playersCount: string
    waitingToJoin: string
    playersCardTitle: string
    inviteFriendCardTitle: string
    ready: string
    cancelReady: string
    entering: string
    hostTag: string
  }
  game: {
    roundN: string
    enterRoom: string
    roundStarted: string
    allReady: string
    newRound: string
    rollButton: string
    challengeButton: string
    nextRound: string
    rolling: string
    youRolled: string
    someoneRolled: string
    yourTurn: string
    waitingPlayer: string
    modeFei: string
    modeZhai: string
    bidAnnounceTemplate: string
    bidLabel: string
    noBid: string
    showDice: string
    hideDice: string
    connected: string
    disconnected: string
    systemEnterRoom: string
    dragHint: string
    turnOf: string
    punishmentMsg: string
    playerLeftMsg: string
    playersTotal: string
    waitingOthersRoll: string
    challengeCall: string
    challengeBid: string
    challengeActual: string
    challengeResult: string
    challengerCall: string
    countUnit: string
    confirmBidPrefix: string
    rolledTag: string
    myDice: string
  }
  result: {
    title: string
    bidBy: string
    challengedBy: string
    actualCount: string
    youWin: string
    youLose: string
    nextRound: string
    bidDisplayTemplate: string
  }
  history: {
    title: string
    back: string
    empty: string
    rankLabel: string
  }
  punishment: {
    // 懲罰文案：key 对应后端 Punishment.Level + index
    drink1: string
    drink2: string
    drink3: string
    truth: string
    dare: string
    overlayTitle: string
  }
  error: {
    roomNotFound: string
    roomFull: string
    gameInProgress: string
    notYourTurn: string
    invalidBid: string
    noBidToChallenge: string
    notInRollingPhase: string
    notInBiddingPhase: string
    rollFailed: string
    unknownMessageType: string
    generic: string
  }
  langSwitcher: {
    title: string
    zhHant: string
    zhHans: string
    en: string
    th: string
  }
}
