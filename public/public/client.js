(function() {
  var BidModel, formatHlted, formatPrice, hlt, lastQuery, model, renderTimeout, renderTimer, resetHeaders, socket, stopRenderTimer, table, toBeRendered, updateTable, waitingRenderThreshold;
  var __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
  hlt = '';
  formatHlted = function(t) {
    return t;
    return hlt ? (t || '').replace(hlt, '<strong>' + hlt + '</strong>') : t;
  };
  formatPrice = function(t) {
    var s;
    s = "$" + String(t || 0) + ".00";
    return hlt ? s.replace(hlt, '<strong>' + hlt + '</strong>') : s;
  };
  uki({
    view: 'Box',
    rect: '1000 1000',
    minSize: '800 400',
    anchors: 'top left right width',
    childViews: [
      {
        view: 'Box',
        id: 'headerBox',
        rect: '1000 100',
        background: 'theme(panel)',
        anchors: 'top left right width',
        childViews: [
          {
            view: 'Label',
            rect: '20 35 100 24',
            html: '<span style="letter-spacing: 2px; font-family: \'Lobster\', arial, serif; font-size: 60px; font-weight: bold; text-shadow: #FFF 0px 1px 1px">Dutch IPO</span>',
            anchors: "top left"
          }, {
            view: 'Label',
            rect: '200 35 100 24',
            html: '<span style="font-size: 30px;">Bids Recieved</span>'
          }, {
            view: 'Label',
            rect: '700 35 100 24',
            html: '<span style="font-size: 30px;">Clearing Price</span>'
          }
        ]
      }, {
        view: 'HSplitPane',
        rect: '0 101 1000 899',
        anchors: 'left top right bottom',
        handlePosition: 475,
        leftMin: 475,
        rightMin: 400,
        leftPane: {
          background: '#D0D7E2',
          childViews: [
            {
              view: 'TextField',
              rect: '5 5 465 22',
              anchors: 'left top right',
              placeholder: 'search'
            }, {
              view: 'Table',
              rect: '0 30 475 869',
              minSize: '0 200',
              anchors: 'left top right bottom',
              columns: [
                {
                  view: 'table.NumberColumn',
                  label: 'ID',
                  width: 60
                }, {
                  view: 'table.CustomColumn',
                  label: 'Bidder',
                  resizable: true,
                  minWidth: 100,
                  width: 250,
                  formatter: formatHlted
                }, {
                  view: 'table.CustomColumn',
                  label: 'Price',
                  resizable: true,
                  minWidth: 50,
                  width: 75,
                  formatter: formatPrice
                }, {
                  view: 'table.CustomColumn',
                  label: 'Shares',
                  resizable: true,
                  width: 50,
                  width: 75
                }
              ],
              style: {
                fontSize: '11px',
                lineHeight: '11px'
              }
            }, {
              view: 'Label',
              rect: '130 280 200 60',
              anchors: 'top',
              textAlign: 'center',
              text: 'Loading...',
              id: 'loading',
              style: {
                fontSize: '60px',
                fontFamily: '\'Lobster\', arial, serif',
                color: '#AAA',
                textShadow: '#CCC 0px 1px 1px'
              }
            }
          ]
        }
      }
    ]
  }).attachTo(window, '1000 1000');
  BidModel = function() {
    return Searchable.apply(this, arguments);
  };
  __extends(BidModel, Searchable);
  BidModel.prototype.init = function(data) {
    this.items = (typeof this.items !== "undefined" && this.items !== null) ? this.items : [];
    return this.addItems(data);
  };
  BidModel.prototype.addItems = function(new_items) {
    var _i, _len, _ref, row;
    _ref = new_items;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      row = _ref[_i];
      row.searchIndex = row[1].toLowerCase();
    }
    return (this.items = this.items.concat(new_items));
  };
  BidModel.prototype.matchRow = function(row, iterator) {
    return row.searchIndex.indexOf(iterator.query) > -1;
  };
  uki('#loading').visible(false);
  model = new BidModel([]);
  lastQuery = '';
  table = uki('Table');
  table.data(model.items);
  resetHeaders = function(except) {
    var _i, _len, _ref, _result, col, header;
    header = table.find('Header');
    _result = []; _ref = header.columns();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      col = _ref[_i];
      _result.push((function() {
        if (!(typeof except !== "undefined" && except !== null) || col !== except) {
          col.sort('');
          return header.redrawColumn(col._position);
        }
      })());
    }
    return _result;
  };
  table.find('Header').bind('columnClick', function(e) {
    var header;
    header = this;
    uki('#loading').visible(true);
    if (e.column.sort() === 'ASC') {
      e.column.sort('DESC');
    } else {
      e.column.sort('ASC');
    }
    uki('#loading').visible(false);
    header.redrawColumn(e.column._position);
    resetHeaders(e.column);
    model.items = e.column.sortData(model.items);
    return table.data(model.items);
  });
  model.bind('search.foundInChunk', function(chunk) {
    return table.data(table.data().concat(chunk)).layout();
  });
  uki('TextField').bind('keyup click', function() {
    if (this.value().toLowerCase() === lastQuery) {
      return null;
    }
    lastQuery = this.value().toLowerCase();
    if (lastQuery.match(/\S/)) {
      hlt = lastQuery;
      table.data([]);
      model.search(lastQuery);
      return resetHeaders();
    } else {
      hlt = '';
      return table.data(model.items);
    }
  });
  socket = new io.Socket("localhost");
  socket.on('connect', function() {
    return console.log("Socket established.");
  });
  renderTimeout = 300;
  waitingRenderThreshold = 50;
  toBeRendered = [];
  renderTimer = false;
  updateTable = function() {
    model.addItems(toBeRendered);
    table.data(model.items);
    return (toBeRendered = []);
  };
  stopRenderTimer = function() {
    if (renderTimer) {
      clearTimeout(renderTimer);
      return (renderTimer = false);
    }
  };
  socket.on('message', function(data) {
    try {
      data = JSON.parse(data);
    } catch (error) {
      console.log("Error parsing a datum");
    }
    if (data.bId) {
      toBeRendered.push([data.bId, data.bidder, data.shares, data.price]);
      if (toBeRendered.length < waitingRenderThreshold) {
        return !(renderTimer) ? (renderTimer = setTimeout(updateTable, renderTimeout)) : null;
      } else {
        stopRenderTimer();
        return updateTable();
      }
    }
  });
  socket.on('disconnect', function() {
    return console.log("Socket disconnected!");
  });
  socket.connect();
}).call(this);
