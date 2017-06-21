var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
crypto = require('crypto');
var xx = '1234';

app.use(express.static('assets'))


users = [];
connections = [];

server.listen(process.env.PORT || 3000);
console.log('server running...');

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/oth.html');
});

io.sockets.on('connection', function(socket) {
  connections.push(socket);
  console.log('Conneced: %s sockets connected', connections.length);
  suggest_func();
  pass_result();

  //Dissconnect
  socket.on('disconnect', function(data) {
    connections.splice(connections.indexOf(socket), 1);
    console.log('Dissconnected: %s sockets connected', connections.length);
  });

  //-----------------------------------------------------------------------------------------------------------------------//


  socket.on('click_socket', function(i, j, userName) {
    kill_func(i, j, userName);
  });

  socket.on('userName_socket', function(userName) {


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


  socket.on('playAgain_socket', function(userName) {
    table_state = [
      ["green", "green", "green", "green", "green", "green", "green", "green"],
      ["green", "green", "green", "green", "green", "green", "green", "green"],
      ["green", "green", "green", "green", "green", "green", "green", "green"],
      ["green", "green", "green", "white", "black", "green", "green", "green"],
      ["green", "green", "green", "black", "white", "green", "green", "green"],
      ["green", "green", "green", "green", "green", "green", "green", "green"],
      ["green", "green", "green", "green", "green", "green", "green", "green"],
      ["green", "green", "green", "green", "green", "green", "green", "green"]
    ];
    turn = true;
    suggest_func();
    io.emit('playAgain_socket', turn);
  });



  //don't delete
});

//-----------------------------------------------------------------------------------------------------------------------//

//var table_state =  [, , , "green", "green", "green", "white", "black", "green", "green", "green", "green", "green", "green", "black", "white", "green", "green", "green", "green", "green", "green", "green", "green", "green", "green", "green", "green", "green", "green", "green", "green", "green", "green", "green", "green", "green", "green", "green", "green", "green", "green", "green"];

var table_state = [
  ["green", "green", "green", "green", "green", "green", "green", "green"],
  ["green", "green", "green", "green", "green", "green", "green", "green"],
  ["green", "green", "green", "green", "green", "green", "green", "green"],
  ["green", "green", "green", "white", "black", "green", "green", "green"],
  ["green", "green", "green", "black", "white", "green", "green", "green"],
  ["green", "green", "green", "green", "green", "green", "green", "green"],
  ["green", "green", "green", "green", "green", "green", "green", "green"],
  ["green", "green", "green", "green", "green", "green", "green", "green"]
];
var turn = true;
var turn_color1 = '';
var turn_color2 = '';
var suggest_color1 = '';
var suggest_color2 = '';
var arr_user = [];
var user_turn = '';
var user_turn2 = '';
var count_pass = 0;
var MongoClient = require('mongodb').MongoClient;
var url = 'mongodb://localhost:27017/othello';
var count_winner_function = 0;



function pass_logout(userName, time) {
  io.emit('logout_socket', userName, time);
}
//update_win('jam');
//update_lose('golf');
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

// db.collection("user").update(myquery, newvalues, function(err, res) {
//   if (err) throw err;
//   console.log(res.result.nModified + " record updated");
//   db.close();
// });

function register_func(userName, password) {
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var qry = {
      userName: userName
    }
    db.collection("user").find(qry).toArray(function(err, result) {
      console.log(result);
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
          console.log("1 record inserted");
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

// function register_func(userName, password) {
//   MongoClient.connect(url, function(err, db) {
//     if (err) throw err;
//     db.collection("user").find().toArray(function(err, result) {
//       //console.log(result)
//       for (var i = 0; i < result.length ; i++) {
//         if (userName == result[i].userName) {
//           io.emit('check_regis_socket', 'have same userName' , userName);
//           break;
//         }
//         if (i == result.length-1) {
//           const hash = crypto.createHmac('sha256', password)
//             .update('I love cupcakes')
//             .digest('hex');
//           var insert = {
//             userName: userName,
//             password: hash,
//             win: 0,
//             lose: 0,
//             score: 0
//           };
//           db.collection("user").insertOne(insert, function(err, res) {
//             if (err) throw err;
//             console.log("1 record inserted");
//             db.close();
//             io.emit('check_regis_socket', 'regis success' , userName);
//           });
//         }
//       }
//       db.close();
//     });
//   });
// }

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
      }else {
        if (hash == result.password) {
          console.log('correct');
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

// function login_func(userName, password) {
//   MongoClient.connect(url, function(err, db) {
//     if (err) throw err;
//     db.collection("user").find().toArray(function(err, result) {
//       //console.log(result)
//       var login = '';
//       const hash = crypto.createHmac('sha256', password)
//         .update('I love cupcakes')
//         .digest('hex');
//       for (var i = 0; i < result.length; i++) {
//         if (userName == result[i].userName) {
//           if (hash == result[i].password) {
//             console.log('correct');
//             login = 'correct';
//             io.emit('login_socket', login, userName);
//
//             break;
//           }
//         }
//         if (i == result.length - 1) {
//           console.log('incorrect');
//           login = 'incorrect';
//           io.emit('login_socket', login, userName);
//         }
//       }
//       db.close();
//     });
//   });
// }

//------------------------------------------------------------------------------PLAY------------------------------------------------------------------------------

function pass_table_state() {
  io.emit('table_socket', table_state, turn_color1, user_turn);
}

function check_turn_color() {
  if (turn == true) {
    turn_color1 = 'black';
    turn_color2 = 'white';
    suggest_color1 = 'suggest1';
    suggest_color2 = 'suggest2';
    user_turn = arr_user[0];
    user_turn2 = arr_user[1];
  } else {
    turn_color1 = 'white';
    turn_color2 = 'black';
    suggest_color1 = 'suggest2';
    suggest_color2 = 'suggest1';
    user_turn = arr_user[1];
    user_turn2 = arr_user[0];
  }
}








function suggest_func() {
  count_winner_function = 0;
  check_turn_color();
  clear_suggest();
  for (var i = 0; i < 8; i++) {
    for (var j = 0; j < 8; j++) {
      if (table_state[i][j] == turn_color1) {
        suggest_top(i, j);
        suggest_under(i, j);
        suggest_left(i, j);
        suggest_right(i, j);
        suggest_top_left(i, j);
        suggest_top_right(i, j);
        suggest_under_left(i, j);
        suggest_under_right(i, j);
      }
    }
  }
  check_space();
  if (count_pass < 2) {
    check_pass();
  }
  pass_table_state();
  if (count_winner_function == 1) {
    table_state = [
      ["green", "green", "green", "green", "green", "green", "green", "green"],
      ["green", "green", "green", "green", "green", "green", "green", "green"],
      ["green", "green", "green", "green", "green", "green", "green", "green"],
      ["green", "green", "green", "white", "black", "green", "green", "green"],
      ["green", "green", "green", "black", "white", "green", "green", "green"],
      ["green", "green", "green", "green", "green", "green", "green", "green"],
      ["green", "green", "green", "green", "green", "green", "green", "green"],
      ["green", "green", "green", "green", "green", "green", "green", "green"]
    ];
    arr_user = [];
  }
}

function clear_suggest() {
  for (var i = 0; i < 8; i++) {
    for (var j = 0; j < 8; j++) {
      if (table_state[i][j] == suggest_color2) {
        table_state[i][j] = 'green';
      }
    }
  }
}

function suggest_top(i, j) {
  var x = i - 1;
  var y = j;
  for (x; x >= 0; x--) {
    if (table_state[x][y] == turn_color1 || table_state[x][y] == suggest_color1) {
      break;
    }
    if (table_state[x][y] == 'green') {
      x++;
      if (table_state[x][y] == turn_color2) {
        x--;
        table_state[x][y] = suggest_color1;
      }
      break;
    }
  }
}

function suggest_under(i, j) {
  var x = i + 1;
  var y = j;
  for (x; x <= 7; x++) {
    if (table_state[x][y] == turn_color1 || table_state[x][y] == suggest_color1) {
      break;
    }
    if (table_state[x][y] == 'green') {
      x--;
      if (table_state[x][y] == turn_color2) {
        x++;
        table_state[x][y] = suggest_color1;
      }
      break;
    }
  }
}

function suggest_left(i, j) {
  var x = i;
  var y = j - 1;
  for (y; y >= 0; y--) {
    if (table_state[x][y] == turn_color1 || table_state[x][y] == suggest_color1) {
      break;
    }
    if (table_state[x][y] == 'green') {
      y++;
      if (table_state[x][y] == turn_color2) {
        y--;
        table_state[x][y] = suggest_color1;
      }
      break;
    }
  }
}

function suggest_right(i, j) {
  var x = i;
  var y = j + 1;
  for (y; y <= 7; y++) {
    if (table_state[x][y] == turn_color1 || table_state[x][y] == suggest_color1) {
      break;
    }
    if (table_state[x][y] == 'green') {
      y--;
      if (table_state[x][y] == turn_color2) {
        y++;
        table_state[x][y] = suggest_color1;
      }
      break;
    }
  }
}

function suggest_top_left(i, j) {
  var x = i - 1;
  var y = j - 1;
  for (x; x >= 0; x--) {
    if (y < 0) {
      break;
    }
    if (table_state[x][y] == turn_color1 || table_state[x][y] == suggest_color1) {
      break;
    }
    if (table_state[x][y] == 'green') {
      x++;
      y++;
      if (table_state[x][y] == turn_color2) {
        x--;
        y--;
        table_state[x][y] = suggest_color1;
      }
      break;
    }
    y--;
  }
}

function suggest_top_right(i, j) {
  var x = i - 1;
  var y = j + 1;
  for (x; x >= 0; x--) {
    if (y > 7) {
      break;
    }
    if (table_state[x][y] == turn_color1 || table_state[x][y] == suggest_color1) {
      break;
    }
    if (table_state[x][y] == 'green') {
      x++;
      y--;
      if (table_state[x][y] == turn_color2) {
        x--;
        y++;
        table_state[x][y] = suggest_color1;
      }
      break;
    }
    y++;
  }
}

function suggest_under_left(i, j) {
  var x = i + 1;
  var y = j - 1;
  for (x; x <= 7; x++) {
    if (y < 0) {
      break;
    }
    if (table_state[x][y] == turn_color1 || table_state[x][y] == suggest_color1) {
      break;
    }
    if (table_state[x][y] == 'green') {
      x--;
      y++;
      if (table_state[x][y] == turn_color2) {
        x++;
        y--;
        table_state[x][y] = suggest_color1;
      }
      break;
    }
    y--;
  }
}

function suggest_under_right(i, j) {
  var x = i + 1;
  var y = j + 1;
  for (x; x <= 7; x++) {
    if (y > 7) {
      break;
    }
    if (table_state[x][y] == turn_color1 || table_state[x][y] == suggest_color1) {
      break;
    }
    if (table_state[x][y] == 'green') {
      x--;
      y--;
      if (table_state[x][y] == turn_color2) {
        x++;
        y++;
        table_state[x][y] = suggest_color1;
      }
      break;
    }
    y++;
  }
}

function check_pass() {
  var count = 0;
  for (var i = 0; i < 8; i++) {
    for (var j = 0; j < 8; j++) {
      if (table_state[i][j] == suggest_color1) {
        count++;
      }
    }
  }
  if (count == 0) {
    console.log("-------------pass-------------");
    count_pass++;
    if (count_pass == 2) {
      check_winner();
    }
    turn = !turn;
    suggest_func();
  }
}

function check_space() {
  var count = 0;
  for (var i = 0; i < 8; i++) {
    for (var j = 0; j < 8; j++) {
      if (table_state[i][j] == 'green' || table_state[i][j] == suggest_color1) {
        count++;
      }
    }
  }
  if (count == 0) {
    check_winner();
    count_pass = 2;
  }
}

function check_winner() {
  count_winner_function++;
  var winner = '';
  var user_winner = '';
  var user_loser = '';
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
    console.log(score_black);
    console.log(score_white);
    console.log('winner is black');
    user_winner = arr_user[0];
    user_loser = arr_user[1];
    winner = 'black';
    update_win(user_winner);
    update_lose(user_loser);
    io.emit('winner_socket', score_black, score_white, winner);
  }
  if (score_white > score_black) {
    console.log(score_black);
    console.log(score_white);
    console.log('winner is white');
    user_winner = arr_user[1];
    user_loser = arr_user[0];
    winner = 'white';
    update_win(user_winner);
    update_lose(user_loser);
    io.emit('winner_socket', score_black, score_white, winner);
  }
  if (score_black == score_white) {
    console.log(score_black);
    console.log(score_white);
    console.log('draw');
    winner = 'draw';
    io.emit('winner_socket', score_black, score_white, winner);
  }

}







function kill_func(i, j, userName) {
  if (table_state[i][j] == suggest_color1 && user_turn == userName) {
    count_pass = 0;
    kill_top(i, j);
    kill_under(i, j);
    kill_left(i, j);
    kill_right(i, j);
    kill_top_left(i, j);
    kill_top_right(i, j);
    kill_under_left(i, j);
    kill_under_right(i, j);
    turn = !turn;
    suggest_func();

  }
}

function kill_top(i, j) {
  x = i - 1;
  y = j;
  for (x; x >= 0; x--) {
    if (table_state[x][y] == 'green' || table_state[x][y] == suggest_color1) {
      break;
    }
    if (table_state[x][y] == turn_color1) {
      for (x; x <= i; x++) {
        table_state[x][y] = turn_color1;
      }
      break;
    }
  }
}

function kill_under(i, j) {
  x = i + 1;
  y = j;
  for (x; x <= 7; x++) {
    if (table_state[x][y] == 'green' || table_state[x][y] == suggest_color1) {
      break;
    }
    if (table_state[x][y] == turn_color1) {
      for (x; x >= i; x--) {
        table_state[x][y] = turn_color1;
      }
      break;
    }
  }
}

function kill_left(i, j) {
  x = i;
  y = j + 1;
  for (y; y <= 7; y++) {
    if (table_state[x][y] == 'green' || table_state[x][y] == suggest_color1) {
      break;
    }
    if (table_state[x][y] == turn_color1) {
      for (y; y >= j; y--) {
        table_state[x][y] = turn_color1;
      }
      break;
    }
  }
}

function kill_right(i, j) {
  x = i;
  y = j - 1;
  for (y; y >= 0; y--) {
    if (table_state[x][y] == 'green' || table_state[x][y] == suggest_color1) {
      break;
    }
    if (table_state[x][y] == turn_color1) {
      for (y; y <= j; y++) {
        table_state[x][y] = turn_color1;
      }
      break;
    }
  }
}

function kill_top_left(i, j) {
  x = i + 1;
  y = j + 1;
  for (x; x <= 7; x++) {
    if (y > 7) {
      break;
    }
    if (table_state[x][y] == 'green' || table_state[x][y] == suggest_color1) {
      break;
    }
    if (table_state[x][y] == turn_color1) {
      for (x; x >= i; x--) {
        table_state[x][y] = turn_color1;
        y--;
      }
      break;
    }
    y++;
  }
}

function kill_top_right(i, j) {
  x = i + 1;
  y = j - 1;
  for (x; x <= 7; x++) {
    if (y < 0) {
      break;
    }
    if (table_state[x][y] == 'green' || table_state[x][y] == suggest_color1) {
      break;
    }
    if (table_state[x][y] == turn_color1) {
      for (x; x >= i; x--) {
        table_state[x][y] = turn_color1;
        y++;
      }
      break;
    }
    y--;
  }
}

function kill_under_left(i, j) {
  x = i - 1;
  y = j + 1;
  for (x; x >= 0; x--) {
    if (y > 7) {
      break;
    }
    if (table_state[x][y] == 'green' || table_state[x][y] == suggest_color1) {
      break;
    }
    if (table_state[x][y] == turn_color1) {
      for (x; x <= i; x++) {
        table_state[x][y] = turn_color1;
        y--;
      }
      break;
    }
    y++;
  }
}

function kill_under_left(i, j) {
  x = i - 1;
  y = j + 1;
  for (x; x >= 0; x--) {
    if (y > 7) {
      break;
    }
    if (table_state[x][y] == 'green' || table_state[x][y] == suggest_color1) {
      break;
    }
    if (table_state[x][y] == turn_color1) {
      for (x; x <= i; x++) {
        table_state[x][y] = turn_color1;
        y--;
      }
      break;
    }
    y++;
  }
}

function kill_under_right(i, j) {
  x = i - 1;
  y = j - 1;
  for (x; x >= 0; x--) {
    if (y < 0) {
      break;
    }
    if (table_state[x][y] == 'green' || table_state[x][y] == suggest_color1) {
      break;
    }
    if (table_state[x][y] == turn_color1) {
      for (x; x <= i; x++) {
        table_state[x][y] = turn_color1;
        y++;
      }
      break;
    }
    y--;
  }
}

function kill_func2(i, j, userName) {
  table_state[i][j] = turn_color1;
  turn = !turn
  count_pass = 0;
  suggest_func();
}
