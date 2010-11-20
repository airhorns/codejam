(function() {
  var BidDatabase, db, i;
  require.paths.unshift('.');
  BidDatabase = require('database').BidDatabase;
  db = new BidDatabase();
  for (i = 0; i <= 1000000; i++) {
    db.addBid(10, i, "test");
  }
}).call(this);
