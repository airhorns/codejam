(function() {
  var BidModel, bidCountInput, bidsDetailChart, bidsReceived, formatHlted, formatPrice, hlt, lastQuery, model, renderTimeout, renderTimer, resetHeaders, socket, stopRenderTimer, table, toBeRendered, updateTable, waitingRenderThreshold;
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
    rect: '1000 600',
    minSize: '800 400',
    anchors: 'top left right bottom',
    childViews: [
      {
        view: 'Box',
        id: 'headerBox',
        rect: '1000 40',
        background: 'theme(panel)',
        anchors: 'top left right width',
        childViews: [
          {
            view: 'Label',
            rect: '10 0 100 40',
            html: '<span style="letter-spacing: 2px; font-family: \'Lobster\', arial, serif; font-size: 30px; font-weight: bold; text-shadow: #FFF 0px 1px 1px">Dutch IPO</span>',
            anchors: "top left"
          }, {
            view: 'Label',
            rect: '200 15 100 20',
            html: '<span style="font-size: 15px;">Bids Recieved</span>',
            anchors: 'top left right width'
          }, {
            view: 'TextField',
            rect: '300 15 20 20',
            anchors: 'top left width',
            value: "0",
            id: 'bidsReceived'
          }, {
            view: 'Label',
            rect: '700 15 100 20',
            html: '<span style="font-size: 15px;">Clearing Price</span>',
            anchors: 'top left right width'
          }
        ]
      }, {
        view: 'HSplitPane',
        rect: '0 41 1000 559',
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
              placeholder: 'bidder search',
              id: 'bidderSearch'
            }, {
              view: 'Table',
              rect: '0 30 475 529',
              minSize: '0 200',
              anchors: 'left top right bottom',
              columns: [
                {
                  view: 'table.NumberColumn',
                  label: 'ID',
                  resizable: true,
                  width: 60
                }, {
                  view: 'table.CustomColumn',
                  label: 'Bidder',
                  resizable: true,
                  minWidth: 50,
                  width: 100,
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
                  minWidth: 50,
                  width: 75
                }, {
                  view: 'table.CustomColumn',
                  label: 'Time',
                  resizable: true,
                  minWidth: 100,
                  width: 150
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
        },
        rightChildViews: [
          {
            view: 'Box',
            rect: '0 0 518 100',
            anchors: 'top left right width',
            background: 'theme(panel)',
            id: 'bidFrequency'
          }, {
            view: 'Box',
            rect: '0 100 518 429',
            anchors: 'top left right width bottom',
            background: 'theme(panel)',
            id: 'bidDisplay'
          }
        ]
      }
    ]
  }).attachTo(window, '1000 600');
  bidsDetailChart = new Highcharts.Chart({
    chart: {
      renderTo: 'bidDisplay',
      marginRight: 10,
      marginTop: 10,
      reflow: false
    },
    title: {
      text: 'Bids',
      style: {
        margin: '10px 100px 0 0'
      }
    },
    xAxis: {
      type: 'datetime',
      tickPixelInterval: 150
    },
    yAxis: {
      title: {
        text: 'Value'
      },
      plotLines: [
        {
          value: 0,
          width: 1,
          color: '#808080'
        }
      ]
    },
    tooltip: {
      formatter: function() {
        return '<b>' + this.series.name + '</b><br/>' + Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x) + '<br/>' + Highcharts.numberFormat(this.y, 2);
      }
    },
    legend: {
      enabled: false
    },
    exporting: {
      enabled: false
    },
    series: [
      {
        name: 'Bids',
        type: 'scatter',
        data: []
      }
    ]
  });
  BidModel = function() {
    return Searchable.apply(this, arguments);
  };
  __extends(BidModel, Searchable);
  BidModel.prototype.init = function(data) {
    this.items = (typeof this.items !== "undefined" && this.items !== null) ? this.items : [];
    this.frequencies = {};
    return this.addItems(data);
  };
  BidModel.prototype.addItems = function(new_items) {
    var _i, _len, _ref, f, row;
    _ref = new_items;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      row = _ref[_i];
      row.searchIndex = row[1].toLowerCase();
      f = String(row[4].getMinutes());
      this.frequencies[f] = (typeof this.frequencies[f] !== "undefined" && this.frequencies[f] !== null) ? this.frequencies[f] : 0;
      this.frequencies[f] += 1;
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
    return table.find('Header').each(function() {
      var _i, _len, _ref, _result, col, header;
      header = this;
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
    });
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
  uki('#bidderSearch').bind('keyup click', function() {
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
  renderTimeout = 300;
  waitingRenderThreshold = 200;
  toBeRendered = [];
  renderTimer = false;
  bidCountInput = uki('#bidsReceived');
  bidsReceived = 0;
  setInterval(function() {
    return bidCountInput.value(bidsReceived);
  }, 1000);
  updateTable = function() {
    var _i, _len, _ref, row;
    bidsReceived += toBeRendered.length;
    model.addItems(toBeRendered);
    if (typeof bidsChart !== "undefined" && bidsChart !== null) {
      _ref = toBeRendered;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        row = _ref[_i];
        bidsChart.series[0].addPoint([row[4].getTime(), row[3]], false, false);
      }
    }
    table.data(model.items);
    return (toBeRendered = []);
  };
  stopRenderTimer = function() {
    if (renderTimer) {
      clearTimeout(renderTimer);
      return (renderTimer = false);
    }
  };
  socket = new io.Socket("localhost");
  socket.on('connect', function() {
    return console.log("Socket established.");
  });
  socket.on('message', function(data) {
    console.log(data);
    try {
      data = JSON.parse(data);
    } catch (error) {
      console.log("Error parsing a datum", error, data);
    }
    if (data.bId) {
      toBeRendered.push([data.bId, data.bidder, data.shares, data.price, new Date(data.time * 1)]);
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
  setInterval(function() {
    return bidsChart.redraw();
  }, 2000);
}).call(this);
