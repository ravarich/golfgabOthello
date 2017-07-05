var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
crypto = require('crypto');

app.use(express.static('assets'))


users = [];
connections = [];

server.listen(process.env.PORT || 3000);
console.log('server running...');


app.get('/', function(req, res) {
  res.sendFile(__dirname + '/oth.html');
});

var arr_room = [];



io.sockets.on('connection', function(socket) {
  connections.push(socket);
  //console.log('Conneced: %s sockets connected', connections.length);
  pass_result();

  //Dissconnect
  socket.on('disconnect', function(data) {
    connections.splice(connections.indexOf(socket), 1);
    //console.log('Dissconnected: %s sockets connected', connections.length);
    for (var i = 0; i < arr_room.length; i++) {
      if (arr_room[i].id1 == socket.id) {
        io.to(arr_room[i].room).emit('discon_socket', arr_room[i].user2);
        leave_room(arr_room[i].room);
      } else {
        if (arr_room[i].id2 == socket.id) {
          io.to(arr_room[i].room).emit('discon_socket', arr_room[i].user1);
          leave_room(arr_room[i].room);
        }
      }

    }


    //บังคับแพ้เมื่อออก
    // for (var i = 0; i < arr_room.length; i++) {
    //   if (arr_room[i].id1 == socket.id && arr_room[i].user2 == '') {
    //     clear_room(arr_room[i].room);
    //     break;
    //   }
    //   if (i == arr_room.length - 1) {
    //     for (var i = 0; i < arr_room.length; i++) {
    //       if (arr_room[i].id1 == socket.id) {
    //         io.to(arr_room[i].room).emit('discon_socket', 'P1 disconnection');
    //         update_win(arr_room[i].user2);
    //         update_lose(arr_room[i].user1);
    //         clear_room(arr_room[i].room);
    //         console.log('p1 discon');
    //         break;
    //       }
    //       if (arr_room[i].id2 == socket.id) {
    //         io.to(arr_room[i].room).emit('discon_socket', 'P2 disconnection');
    //         update_win(arr_room[i].user1);
    //         update_lose(arr_room[i].user2);
    //         clear_room(arr_room[i].room);
    //         console.log('p2 discon');
    //         break;
    //       }
    //     }
    //   }
    // }

  });

  //-----------------------------------------------------------------------------------------------------------------------//
  socket.on('win_wait', function(room, userName) {
    for (var i = 0; i < arr_room.length; i++) {
      if (arr_room[i].user1 == userName) {
        update_win(arr_room[i].user1);
        update_lose(arr_room[i].user2);
        clear_room(arr_room[i].room);
      } else {
        update_win(arr_room[i].user2);
        update_lose(arr_room[i].user1);
        clear_room(arr_room[i].room);
      }
    }
  });




  //room
  socket.on('leave_room_socket', function(room) {
    socket.leave(room);
    leave_room(room);
  });
  socket.on('join_room_socket', function(room, userName) {
    socket.join(room);
    join_room(room, userName, socket.id);
  });
  socket.on('get_room_socket', function() {
    io.emit('get_room_socket', arr_room)
  });
  socket.on('create_room_socket', function(room, userName) {
    if (arr_room.length == 0) {
      create_room(room);
      socket.join(room);
      join_room(room, userName, socket.id);
      io.emit('create_room_socket', 'yes', userName);
    } else {
      for (var i = 0; i < arr_room.length; i++) {
        if (arr_room[i].room == room) {
          console.log('same room by', userName);
          io.emit('create_room_socket', 'no', userName);
          break;
        }
        if (i == arr_room.length - 1) {
          create_room(room);
          socket.join(room);
          join_room(room, userName, socket.id);
          io.emit('create_room_socket', 'yes', userName);
          break;
        }
      }
    }
  });
  socket.on('send', function(room, data) {
    console.log(room, data);
    io.to(room).emit('massage', data);
  });

  //new after create room
  socket.on('start_game_socket', function(room) {
    console.log(room, 'game-start');
    suggest_func(room);
    io.to(room).emit('start_game_socket');
  });
  socket.on('spect_socket', function(room) {
    suggest_func(room);
  });







  socket.on('click_socket', function(room, my_turn, i, j) {
    kill_func(room, my_turn, i, j);
  });

  socket.on('register_socket', function(userName, password) {
    register_func(userName, password);
  });
  socket.on('login_socket', function(userName, password, time) {
    //console.log(userName, password);
    login_func(userName, password);
    pass_logout(userName, time);

  });
  socket.on('start_socket', function(userName) {
    arr_user.push(userName);
    io.emit('start_socket', userName, arr_user.length);
  });
  socket.on('start2_socket', function(data) {
    suggest_func();
    io.emit('start2_socket', arr_user);
  });
  socket.on('ex_wait_socket', function(userName) {
    arr_user = [];
    io.emit('ex_wait_socket', userName);
  });
  socket.on('logout_socket', function(userName, time) {
    pass_logout(userName, time);
  });
  socket.on('result_socket', function(userName, time) {
    pass_result();
  });







  //don't delete
});

//-----------------------------------------------------------------------------------------------------------------------//
var state = [
  ["green", "green", "green", "green", "green", "green", "green", "green"],
  ["green", "green", "green", "green", "green", "green", "green", "green"],
  ["green", "green", "green", "green", "green", "green", "green", "green"],
  ["green", "green", "green", "white", "black", "green", "green", "green"],
  ["green", "green", "green", "black", "white", "green", "green", "green"],
  ["green", "green", "green", "green", "green", "green", "green", "green"],
  ["green", "green", "green", "green", "green", "green", "green", "green"],
  ["green", "green", "green", "green", "green", "green", "green", "green"]
];
//var turn = true;
// var turn_color1 = '';
// var turn_color2 = '';
// var suggest_color1 = '';
// var suggest_color2 = '';
// var count_pass = 0;
// var arr_user = [];
// var user_turn = '';
// var user_turn2 = '';
// var count_winner_function = 0;
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/othello';



//room

function create_room(room) {
  arr_room.push({
    'room': room,
    'count': 0,
    'user1': '',
    'id1': '',
    'user2': '',
    'id2': '',
    'status': ''
  });
  MongoClient.connect(url, function(err, db) {
    var insert = {
      'room': room,
      'table': state,
      'turn': true
    }
    db.collection("table").insertOne(insert, function(err, res) {
      if (err) throw err;
    });
    db.close();
  });
}

function join_room(room, userName, id) {
  for (var i = 0;; i++) {
    if (room == arr_room[i].room) {
      arr_room[i].count++;
      if (arr_room[i].status == '') {
        if (arr_room[i].count == 1) {
          arr_room[i].user1 = userName;
          arr_room[i].id1 = id;
        }
        if (arr_room[i].count == 2) {
          arr_room[i].user2 = userName;
          arr_room[i].id2 = id;
          arr_room[i].status = 'started';
        }
      } else {
        if (arr_room[i].user1 == userName) {
          arr_room[i].id1 = id;
          io.to(room).emit('reconnect_socket');
        }
        if (arr_room[i].user2 == userName) {
          arr_room[i].id2 = id;
          io.to(room).emit('reconnect_socket');
        }
      }
      console.log(arr_room[i]);
      break;
    }
  }
}

function leave_room(room) {
  console.log('leave room', room);
  for (var i = 0; i < arr_room.length; i++) {
    if (room == arr_room[i].room) {
      arr_room[i].count--;
      if (arr_room[i].count == 0) {
        arr_room.splice(i, 1);
        MongoClient.connect(url, function(err, db) {
          if (err) throw err;
          var myquery = {
            room: room
          };
          db.collection("table").deleteOne(myquery, function(err, obj) {
            if (err) throw err;
            console.log("1 document deleted");
            db.close
          });
        });
      }
      break;
    }
  }
}


clear_table();

function clear_table() {
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    db.collection("table").remove({}, function(err, obj) {
      if (err) throw err;
      db.close
    });
  });
}







//login register

function pass_logout(userName, time) {
  io.emit('logout_socket', userName, time);
}
//update_win('jam');
//update_lose('golf');

//test_func();
function test_func() {
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var query = {
      userName: 'golfza'
    };

    var newvalues = {
      $set: {
        win: 0,
        lose: 0,
        score: 0
      }
    };
    db.collection("user").update(query, newvalues, function(err, res) {
      if (err) throw err;
      console.log(res.result.nModified + " record updated");
      db.close();
    });

  });
}
//test2();
function pass_result() {
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var mysort = {
      score: -1
    };
    db.collection("user").find().sort(mysort).toArray(function(err, result) {
      if (err) throw err;
      io.emit('result_socket', result);
      db.close();
    });
  });
}

function register_func(userName, password) {
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var qry = {
      userName: userName
    }
    db.collection("user").find(qry).toArray(function(err, result) {
      if (result == '') {
        const hash = crypto.createHmac('sha256', password)
          .update('I love cupcakes')
          .digest('hex');
        var insert = {
          userName: userName,
          password: hash,
          win: 0,
          lose: 0,
          score: 0
        };
        db.collection("user").insertOne(insert, function(err, res) {
          if (err) throw err;
          console.log("insert user :", userName);
          db.close();
          io.emit('check_regis_socket', 'regis success', userName);
        });
      } else {
        io.emit('check_regis_socket', 'have same userName', userName);
      }
      db.close();
    });
  });
}

function login_func(userName, password) {
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var qry = {
      'userName': userName
    }
    var login = '';
    const hash = crypto.createHmac('sha256', password)
      .update('I love cupcakes')
      .digest('hex');
    db.collection("user").findOne(qry, function(err, result) {
      if (err) throw err;
      if (result == null) {
        console.log('incorrect');
        login = 'incorrect';
        io.emit('login_socket', login, userName);
      } else {
        if (hash == result.password) {
          console.log('login by', userName);
          login = 'correct';
          io.emit('login_socket', login, userName);
        } else {
          console.log('incorrect');
          login = 'incorrect';
          io.emit('login_socket', login, userName);
        }
      }

      db.close();
    });
  });
}



//------------------------------------------------------------------------------PLAY------------------------------------------------------------------------------

function pass_table_state(room, table_state, turn) {
  io.to(room).emit('table_socket', table_state, turn);
}

function check_turn_color(turn) {
  if (turn == true) {
    var checkTurn = {
      turn_color1: 'black',
      turn_color2: 'white',
      suggest_color1: 'suggest1',
      suggest_color2: 'suggest2'
    }
  } else {
    var checkTurn = {
      turn_color1: 'white',
      turn_color2: 'black',
      suggest_color1: 'suggest2',
      suggest_color2: 'suggest1'
    }
  }
  return checkTurn;
}


function get_turn_and_table(room) {
  return new Promise((resolve, reject) => {
    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var quary = {
        'room': room
      };

      db.collection("table").find(quary).toArray(function(err, result) {
        if (err) throw err;
        db.close();
        resolve(result);
      });
    });

  });
}

function update_to_db(room, table_state, turn) {
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var query = {
      'room': room
    };
    var newvalues = {
      $set: {
        'table': table_state,
        'turn': turn
      }
    };
    db.collection("table").update(query, newvalues, function(err, res) {
      if (err) throw err;
      //console.log(res.result.nModified + " record updated");
      db.close();
    });
  });
}

function update_win(user_winner) {
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var query = {
      userName: user_winner
    };
    db.collection("user").find(query).toArray(function(err, result) {
      if (err) throw err;
      result[0].win++;
      result[0].score++;
      var newvalues = {
        $set: {
          win: result[0].win,
          score: result[0].score
        }
      };
      db.collection("user").update(query, newvalues, function(err, res) {
        if (err) throw err;
        console.log(res.result.nModified + " record updated");
        db.close();
      });
    });
  });
}

function update_lose(user_loser) {
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var query = {
      userName: user_loser
    };
    db.collection("user").find(query).toArray(function(err, result) {
      if (err) throw err;
      result[0].lose++;
      result[0].score--;
      var newvalues = {
        $set: {
          lose: result[0].lose,
          score: result[0].score
        }
      };
      db.collection("user").update(query, newvalues, function(err, res) {
        if (err) throw err;
        console.log(res.result.nModified + " record updated");
        db.close();
      });
    });
  });
}









function suggest_func(room) {
  get_turn_and_table(room).then(function(res) {
    var table_state = res[0].table;
    var turn = res[0].turn;

    var checkTurn = check_turn_color(turn);
    table_state = clear_suggest(table_state, checkTurn.suggest_color2);
    for (var i = 0; i < 8; i++) {
      for (var j = 0; j < 8; j++) {
        if (table_state[i][j] == checkTurn.turn_color1) {
          table_state = suggest_top(i, j, table_state, checkTurn);
          table_state = suggest_under(i, j, table_state, checkTurn);
          table_state = suggest_left(i, j, table_state, checkTurn);
          table_state = suggest_right(i, j, table_state, checkTurn);
          table_state = suggest_top_left(i, j, table_state, checkTurn);
          table_state = suggest_top_right(i, j, table_state, checkTurn);
          table_state = suggest_under_left(i, j, table_state, checkTurn);
          table_state = suggest_under_right(i, j, table_state, checkTurn);

        }
      }
    }
    var enemy = check_enemy(table_state, checkTurn.turn_color2);
    if (enemy == 1) {
      var win = check_winner(table_state);
      console.log(win);
      for (var i = 0;; i++) {
        if (room == arr_room[i].room) {
          var user1 = arr_room[i].user1;
          var user2 = arr_room[i].user2;
          break;
        }
      }
      if (win.winner == 'black') {
        update_win(user1);
        update_lose(user2);
      }
      if (win.winner == 'white') {
        update_win(user2);
        update_lose(user1);
      }
      io.emit('winner_socket', win);
      pass_table_state(room, table_state, turn);
      clear_room(room);
      return;
    }


    var space = check_space(table_state, checkTurn.suggest_color1);
    if (space == 1) {
      var win = check_winner(table_state);
      for (var i = 0;; i++) {
        if (room == arr_room[i].room) {
          var user1 = arr_room[i].user1;
          var user2 = arr_room[i].user2;
          break;
        }
      }
      if (win.winner == 'black') {
        update_win(user1);
        update_lose(user2);
      }
      if (win.winner == 'white') {
        update_win(user2);
        update_lose(user1);
      }
      io.emit('winner_socket', win);
      pass_table_state(room, table_state, turn);
      clear_room(room);
      return;
    }
    var pass = check_pass(table_state, checkTurn.suggest_color1);
    if (pass == 1) {
      turn = !turn;
      update_to_db(room, table_state, turn);
      suggest_func(room);
      return;
    }

    pass_table_state(room, table_state, turn);
    update_to_db(room, table_state, turn);
  });
}

function check_pass(table_state, data) {
  for (var i = 0; i < 8; i++) {
    for (var j = 0; j < 8; j++) {
      if (table_state[i][j] == data) {
        return 0;
      }
    }
  }
  return 1;
}

function clear_room(room) {
  for (var i = 0;; i++) {
    if (room == arr_room[i].room) {
      console.log('delete', arr_room[i].room);
      arr_room.splice(i, 1);
      MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var myquery = {
          room: room
        };
        db.collection("table").deleteOne(myquery, function(err, obj) {
          if (err) throw err;
          console.log("deleted 1 room");
          db.close
        });
      });
    }
    break;
  }
  io.emit('get_room_socket', arr_room);
}


function check_space(table_state, data) {
  for (var i = 0; i < 8; i++) {
    for (var j = 0; j < 8; j++) {
      if (table_state[i][j] == 'green' || table_state[i][j] == data) {
        return 0;
      }
    }
  }
  return 1;
}

function check_enemy(table_state, data) {
  for (var i = 0; i < 8; i++) {
    for (var j = 0; j < 8; j++) {
      if (table_state[i][j] == data) {
        return 0;
      }
    }
  }
  return 1;
}

function check_winner(table_state) {
  var score_black = 0;
  var score_white = 0;
  for (var i = 0; i < 8; i++) {
    for (var j = 0; j < 8; j++) {
      if (table_state[i][j] == 'black') {
        score_black++;
      }
      if (table_state[i][j] == 'white') {
        score_white++;
      }
    }
  }
  if (score_black > score_white) {
    var win = {
      winner: 'black',
      score_black: score_black,
      score_white: score_white
    }
  }
  if (score_black < score_white) {
    var win = {
      win: 'white',
      score_black: score_black,
      score_white: score_white
    }
  }
  if (score_black == score_white) {
    var win = {
      winner: 'draw',
      score_black: score_black,
      score_white: score_white
    }
  }
  return win;
}




function clear_suggest(table_state, data) {
  for (var i = 0; i < 8; i++) {
    for (var j = 0; j < 8; j++) {
      if (table_state[i][j] == data) {
        table_state[i][j] = 'green';
      }
    }
  }
  return table_state;
}

function suggest_top(i, j, table_state, checkTurn) {
  var x = i - 1;
  var y = j;
  for (x; x >= 0; x--) {
    if (table_state[x][y] == checkTurn.turn_color1 || table_state[x][y] == checkTurn.suggest_color1) {
      break;
    }
    if (table_state[x][y] == 'green') {
      x++;
      if (table_state[x][y] == checkTurn.turn_color2) {
        x--;
        table_state[x][y] = checkTurn.suggest_color1;
      }
      break;
    }
  }
  return table_state;
}

function suggest_under(i, j, table_state, checkTurn) {
  var x = i + 1;
  var y = j;
  for (x; x <= 7; x++) {
    if (table_state[x][y] == checkTurn.turn_color1 || table_state[x][y] == checkTurn.suggest_color1) {
      break;
    }
    if (table_state[x][y] == 'green') {
      x--;
      if (table_state[x][y] == checkTurn.turn_color2) {
        x++;
        table_state[x][y] = checkTurn.suggest_color1;
      }
      break;
    }
  }
  return table_state;
}

function suggest_left(i, j, table_state, checkTurn) {
  var x = i;
  var y = j - 1;
  for (y; y >= 0; y--) {
    if (table_state[x][y] == checkTurn.turn_color1 || table_state[x][y] == checkTurn.suggest_color1) {
      break;
    }
    if (table_state[x][y] == 'green') {
      y++;
      if (table_state[x][y] == checkTurn.turn_color2) {
        y--;
        table_state[x][y] = checkTurn.suggest_color1;
      }
      break;
    }
  }
  return table_state;
}

function suggest_right(i, j, table_state, checkTurn) {
  var x = i;
  var y = j + 1;
  for (y; y <= 7; y++) {
    if (table_state[x][y] == checkTurn.turn_color1 || table_state[x][y] == checkTurn.suggest_color1) {
      break;
    }
    if (table_state[x][y] == 'green') {
      y--;
      if (table_state[x][y] == checkTurn.turn_color2) {
        y++;
        table_state[x][y] = checkTurn.suggest_color1;
      }
      break;
    }
  }
  return table_state;
}

function suggest_top_left(i, j, table_state, checkTurn) {
  var x = i - 1;
  var y = j - 1;
  for (x; x >= 0; x--) {
    if (y < 0) {
      break;
    }
    if (table_state[x][y] == checkTurn.turn_color1 || table_state[x][y] == checkTurn.suggest_color1) {
      break;
    }
    if (table_state[x][y] == 'green') {
      x++;
      y++;
      if (table_state[x][y] == checkTurn.turn_color2) {
        x--;
        y--;
        table_state[x][y] = checkTurn.suggest_color1;
      }
      break;
    }
    y--;
  }
  return table_state;
}

function suggest_top_right(i, j, table_state, checkTurn) {
  var x = i - 1;
  var y = j + 1;
  for (x; x >= 0; x--) {
    if (y > 7) {
      break;
    }
    if (table_state[x][y] == checkTurn.turn_color1 || table_state[x][y] == checkTurn.suggest_color1) {
      break;
    }
    if (table_state[x][y] == 'green') {
      x++;
      y--;
      if (table_state[x][y] == checkTurn.turn_color2) {
        x--;
        y++;
        table_state[x][y] = checkTurn.suggest_color1;
      }
      break;
    }
    y++;
  }
  return table_state;
}

function suggest_under_left(i, j, table_state, checkTurn) {
  var x = i + 1;
  var y = j - 1;
  for (x; x <= 7; x++) {
    if (y < 0) {
      break;
    }
    if (table_state[x][y] == checkTurn.turn_color1 || table_state[x][y] == checkTurn.suggest_color1) {
      break;
    }
    if (table_state[x][y] == 'green') {
      x--;
      y++;
      if (table_state[x][y] == checkTurn.turn_color2) {
        x++;
        y--;
        table_state[x][y] = checkTurn.suggest_color1;
      }
      break;
    }
    y--;
  }
  return table_state;
}

function suggest_under_right(i, j, table_state, checkTurn) {
  var x = i + 1;
  var y = j + 1;
  for (x; x <= 7; x++) {
    if (y > 7) {
      break;
    }
    if (table_state[x][y] == checkTurn.turn_color1 || table_state[x][y] == checkTurn.suggest_color1) {
      break;
    }
    if (table_state[x][y] == 'green') {
      x--;
      y--;
      if (table_state[x][y] == checkTurn.turn_color2) {
        x++;
        y++;
        table_state[x][y] = checkTurn.suggest_color1;
      }
      break;
    }
    y++;
  }
  return table_state;
}





//------------------------------------------------------------------------------------------------------------------------






function kill_func(room, my_turn, i, j) {
  get_turn_and_table(room).then(function(res) {
    var table_state = res[0].table;
    var turn = res[0].turn;
    var checkTurn = check_turn_color(turn);
    if (table_state[i][j] == checkTurn.suggest_color1 && my_turn == checkTurn.turn_color1) {
      table_state = kill_top(i, j, table_state, checkTurn);
      table_state = kill_under(i, j, table_state, checkTurn);
      table_state = kill_left(i, j, table_state, checkTurn);
      table_state = kill_right(i, j, table_state, checkTurn);
      table_state = kill_top_left(i, j, table_state, checkTurn);
      table_state = kill_top_right(i, j, table_state, checkTurn);
      table_state = kill_under_left(i, j, table_state, checkTurn);
      table_state = kill_under_right(i, j, table_state, checkTurn);
      turn = !turn;
      update_to_db(room, table_state, turn);
      suggest_func(room);
    }
    //pass_table_state(room, table_state);
  });
}
// if (table_state[i][j] == suggest_color1 && user_turn == userName) {
//   count_pass = 0;
//   kill_top(i, j);
//   kill_under(i, j);
//   kill_left(i, j);
//   kill_right(i, j);
//   kill_top_left(i, j);
//   kill_top_right(i, j);
//   kill_under_left(i, j);
//   kill_under_right(i, j);
//   turn = !turn;
//   suggest_func();
//
// }


function kill_top(i, j, table_state, checkTurn) {
  x = i - 1;
  y = j;
  for (x; x >= 0; x--) {
    if (table_state[x][y] == 'green' || table_state[x][y] == checkTurn.suggest_color1) {
      break;
    }
    if (table_state[x][y] == checkTurn.turn_color1) {
      for (x; x <= i; x++) {
        table_state[x][y] = checkTurn.turn_color1;
      }
      break;
    }
  }
  return table_state;
}

function kill_under(i, j, table_state, checkTurn) {
  x = i + 1;
  y = j;
  for (x; x <= 7; x++) {
    if (table_state[x][y] == 'green' || table_state[x][y] == checkTurn.suggest_color1) {
      break;
    }
    if (table_state[x][y] == checkTurn.turn_color1) {
      for (x; x >= i; x--) {
        table_state[x][y] = checkTurn.turn_color1;
      }
      break;
    }
  }
  return table_state;
}

function kill_left(i, j, table_state, checkTurn) {
  x = i;
  y = j + 1;
  for (y; y <= 7; y++) {
    if (table_state[x][y] == 'green' || table_state[x][y] == checkTurn.suggest_color1) {
      break;
    }
    if (table_state[x][y] == checkTurn.turn_color1) {
      for (y; y >= j; y--) {
        table_state[x][y] = checkTurn.turn_color1;
      }
      break;
    }
  }
  return table_state;
}

function kill_right(i, j, table_state, checkTurn) {
  x = i;
  y = j - 1;
  for (y; y >= 0; y--) {
    if (table_state[x][y] == 'green' || table_state[x][y] == checkTurn.suggest_color1) {
      break;
    }
    if (table_state[x][y] == checkTurn.turn_color1) {
      for (y; y <= j; y++) {
        table_state[x][y] = checkTurn.turn_color1;
      }
      break;
    }
  }
  return table_state;
}

function kill_top_left(i, j, table_state, checkTurn) {
  x = i + 1;
  y = j + 1;
  for (x; x <= 7; x++) {
    if (y > 7) {
      break;
    }
    if (table_state[x][y] == 'green' || table_state[x][y] == checkTurn.suggest_color1) {
      break;
    }
    if (table_state[x][y] == checkTurn.turn_color1) {
      for (x; x >= i; x--) {
        table_state[x][y] = checkTurn.turn_color1;
        y--;
      }
      break;
    }
    y++;
  }
  return table_state;
}

function kill_top_right(i, j, table_state, checkTurn) {
  x = i + 1;
  y = j - 1;
  for (x; x <= 7; x++) {
    if (y < 0) {
      break;
    }
    if (table_state[x][y] == 'green' || table_state[x][y] == checkTurn.suggest_color1) {
      break;
    }
    if (table_state[x][y] == checkTurn.turn_color1) {
      for (x; x >= i; x--) {
        table_state[x][y] = checkTurn.turn_color1;
        y++;
      }
      break;
    }
    y--;
  }
  return table_state;
}

function kill_under_left(i, j, table_state, checkTurn) {
  x = i - 1;
  y = j + 1;
  for (x; x >= 0; x--) {
    if (y > 7) {
      break;
    }
    if (table_state[x][y] == 'green' || table_state[x][y] == checkTurn.suggest_color1) {
      break;
    }
    if (table_state[x][y] == checkTurn.turn_color1) {
      for (x; x <= i; x++) {
        table_state[x][y] = checkTurn.turn_color1;
        y--;
      }
      break;
    }
    y++;
  }
  return table_state;
}

function kill_under_left(i, j, table_state, checkTurn) {
  x = i - 1;
  y = j + 1;
  for (x; x >= 0; x--) {
    if (y > 7) {
      break;
    }
    if (table_state[x][y] == 'green' || table_state[x][y] == checkTurn.suggest_color1) {
      break;
    }
    if (table_state[x][y] == checkTurn.turn_color1) {
      for (x; x <= i; x++) {
        table_state[x][y] = checkTurn.turn_color1;
        y--;
      }
      break;
    }
    y++;
  }
  return table_state;
}

function kill_under_right(i, j, table_state, checkTurn) {
  x = i - 1;
  y = j - 1;
  for (x; x >= 0; x--) {
    if (y < 0) {
      break;
    }
    if (table_state[x][y] == 'green' || table_state[x][y] == checkTurn.suggest_color1) {
      break;
    }
    if (table_state[x][y] == checkTurn.turn_color1) {
      for (x; x <= i; x++) {
        table_state[x][y] = checkTurn.turn_color1;
        y++;
      }
      break;
    }
    y--;
  }
  return table_state;
}

function kill_func2(i, j, userName) {
  table_state[i][j] = turn_color1;
  turn = !turn
  count_pass = 0;
  suggest_func();
}
