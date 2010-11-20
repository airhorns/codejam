(function() {
  var BidDatabase, db, i;
  BidDatabase = require('database');
  db = new BidDatabase();
  for (i = 0; i <= 1000000; i++) {
    db.addBid(10, i, "test");
  }
}).call(this);
