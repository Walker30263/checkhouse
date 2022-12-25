class Game {
  constructor(challenger, id, settings) {
    this.challenger = new Member(challenger.id, challenger.guest, challenger.username, challenger.profilePicture);
    this.players = [this.challenger];
    this.white = null;
    this.black = null;
    this.timer = {
      white: null,
      black: null
    }
    this.spectators = [];
    this.id = id;
    this.inProgress = false;
    this.settings = settings;
    this.playerChat = [];
    this.spectatorChat = [];
    this.position = "start";
  }

  start() {
    this.inProgress = true;
    console.log(this.settings);
  }

  hasPlayer(id) {
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i].id === id) {
        return true;
        break;
      }
    }

    return false;
  }

  getPlayerUsername(id) {
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i].id === id) {
        return this.players[i].username;
        break;
      }
    }
  }

  updateMemberId(oldId, newId) {
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i].id === oldId) {
        this.players[i].updateId(newId);
        break;
      }
    }

    for (let i = 0; i < this.spectators.length; i++) {
      if (this.spectators[i].id === oldId) {
        this.spectators[i].updateId(newId);
        break;
      }
    }
  }

  newMessage(author, message, timestamp, chat) {
    let messageData = {
      author: author,
      message: message,
      timestamp: timestamp
    }
    
    if (chat === "playerChat") {
      this.playerChat.push(messageData);
    } else if (chat === "spectatorChat") {
      this.spectatorChat.push(messageData);
    }
  }
}

class Member {
  constructor(id, guest, name, profilePicture = "default") {
    this.id = id;
    this.guest = guest;
    this.username = name;
    this.profilePicture = profilePicture;
  }

  updateId(newId) {
    this.id = newId;
  }
}

module.exports = { Game, Member }