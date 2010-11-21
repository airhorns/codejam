(function() {
  var BidModel, bidCountInput, bidsDetailsChart, bidsMasterChart, bidsReceived, clearingPriceInput, currentClearingPrice, drawClearingThreshold, formatHlted, formatPrice, hlt, lastQuery, model, renderTimeout, renderTimer, resetHeaders, socket, stopRenderTimer, table, toBeRendered, updateTable, waitingRenderThreshold;
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
    return hlt ? (t || '').replace(hlt, '<strong>' + hlt + '</strong>') : t;
  };
  formatPrice = function(t) {
    return "$" + String(t || 0) + ".00";
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
        rect: '1000 60',
        background: 'theme(panel)',
        anchors: 'top left right width',
        childViews: [
          {}, {
            view: 'Image',
            src: '/logo510x60.png',
            rect: '0 0 510 60',
            anchors: "top left"
          }, {
            view: 'Label',
            rect: '600 20 100 20',
            html: '<span style="font-size: 15px;">Bids Recieved</span>',
            anchors: 'top left right width'
          }, {
            view: 'TextField',
            rect: '700 15 40 30',
            anchors: 'top left',
            value: "0",
            id: 'bidsReceived'
          }, {
            view: 'Label',
            rect: '800 20 100 20',
            html: '<span style="font-size: 15px;">Clearing Price</span> $',
            anchors: 'top left right width'
          }, {
            view: 'TextField',
            rect: '910 15 40 30',
            anchors: 'top left',
            value: "0",
            id: 'clearingPrice'
          }
        ]
      }, {
        view: 'HSplitPane',
        rect: '0 61 1000 559',
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
            id: 'bidFrequency'
          }, {
            view: 'Box',
            rect: '0 100 518 398',
            anchors: 'top left right width bottom',
            id: 'bidDisplay',
            childViews: [
              {
                view: 'Box',
                rect: '0 0 518 259',
                anchors: 'top left right width bottom',
                background: 'theme(panel)',
                id: 'bidDetailsDisplay'
              }, {
                view: 'Box',
                rect: '0 259 490 180',
                anchors: 'left right width bottom',
                id: 'bidMasterDisplay'
              }
            ]
          }
        ]
      }
    ]
  }).attachTo(window, '1000 600');
  bidsDetailsChart = {};
  bidsMasterChart = new Highcharts.Chart({
    chart: {
      renderTo: 'bidMasterDisplay',
      reflow: true,
      borderWidth: 0,
      backgroundColor: null,
      marginLeft: 5,
      marginRight: 5,
      zoomType: 'x',
      events: {
        selection: function(event) {
          var _i, _len, _ref, chartExtremes, detailData, point, selectionExtremes, xAxis;
          selectionExtremes = event.xAxis[0];
          chartExtremes = event.currentTarget.xAxis[0].getExtremes();
          detailData = [];
          xAxis = this.xAxis[0];
          _ref = this.series[0].data;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            point = _ref[_i];
            if (point.x > selectionExtremes.min && point.x < selectionExtremes.max) {
              detailData.push({
                x: point.x,
                y: point.y,
                shares: point.shares,
                bidder: point.bidder
              });
            }
          }
          xAxis.removePlotBand('mask-before');
          xAxis.addPlotBand({
            id: 'mask-before',
            from: chartExtremes.min,
            to: selectionExtremes.min,
            color: (Highcharts.theme == null ? undefined : Highcharts.theme.maskColor) || 'rgba(0, 0, 0, 0.2)'
          });
          xAxis.removePlotBand('mask-after');
          xAxis.addPlotBand({
            id: 'mask-after',
            from: selectionExtremes.max,
            to: chartExtremes.max,
            color: (Highcharts.theme == null ? undefined : Highcharts.theme.maskColor) || 'rgba(0, 0, 0, 0.2)'
          });
          bidsDetailsChart.series[0].setData(detailData);
          bidsDetailsChart.series[1].setData([[selectionExtremes.min, currentClearingPrice], [selectionExtremes.max, currentClearingPrice]]);
          return false;
        }
      }
    },
    title: {
      text: null
    },
    xAxis: {
      gridLineWidth: 1,
      type: 'datetime',
      showLastTickLabel: true,
      plotBands: [
        {
          id: 'mask-before',
          color: (Highcharts.theme == null ? undefined : Highcharts.theme.maskColor) || 'rgba(0, 0, 0, 0.2)'
        }
      ],
      title: {
        text: "Submission Time"
      }
    },
    yAxis: {
      gridLineWidth: 0,
      labels: {
        enabled: false
      },
      title: {
        text: "Bid Price"
      },
      showFirstLabel: false
    },
    tooltip: {
      formatter: function() {
        return false;
      }
    },
    legend: {
      enabled: false
    },
    credits: {
      enabled: false
    },
    plotOptions: {
      scatter: {
        fillColor: {
          linearGradient: [0, 0, 0, 70],
          stops: [[0, "#4572A7"], [1, 'rgba(0,0,0,0)']]
        },
        lineWidth: 0,
        marker: {
          enabled: true,
          radius: 1
        },
        shadow: false,
        states: {
          hover: {
            lineWidth: 1
          }
        },
        enableMouseTracking: false
      }
    },
    series: [
      {
        name: "Bids",
        type: 'scatter',
        data: []
      }
    ],
    exporting: {
      enabled: false
    }
  }, function(masterChart) {
    console.log("Creating details chart");
    return (bidsDetailsChart = new Highcharts.Chart({
      chart: {
        renderTo: 'bidDetailsDisplay',
        marginRight: 10,
        marginTop: 10,
        reflow: true,
        style: {
          position: 'absolute'
        }
      },
      credits: {
        enabled: false
      },
      title: {
        text: 'Bids'
      },
      subtitle: {
        text: 'Select an area to view by dragging across the lower chart'
      },
      xAxis: {
        type: 'datetime',
        tickPixelInterval: 150,
        gridLineWidth: 1
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
      plotOptions: {
        line: {
          lineWidth: 10
        }
      },
      tooltip: {
        formatter: function() {
          return '<b>' + this.point.bidder + '</b>:<br/>' + this.point.shares + ' shares at $' + Highcharts.numberFormat(this.y, 2) + "<br/>Submitted " + Highcharts.dateFormat('%a %b %e %l:%M:%S %P', this.x);
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
        }, {
          type: 'line',
          name: 'Clearing Price',
          data: [],
          marker: {
            enabled: false
          },
          enableMouseTracking: false
        }
      ]
    }));
  });
  currentClearingPrice = false;
  drawClearingThreshold = function(price) {
    var _ref, data;
    currentClearingPrice = price;
    if (typeof bidsDetailsChart !== "undefined" && bidsDetailsChart !== null) {
      data = bidsDetailsChart.series[1].data;
      if ((typeof data !== "undefined" && data !== null) && (typeof (_ref = data[0]) !== "undefined" && _ref !== null) && (typeof (_ref = data[1]) !== "undefined" && _ref !== null)) {
        data[0][1] = price;
        data[1][1] = price;
        bidsDetailsChart.series[1].setData(data);
        return bidsDetailsChart.redraw();
      }
    }
  };
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
  bidsReceived = 0;
  bidCountInput = uki('#bidsReceived');
  clearingPriceInput = uki('#clearingPrice');
  updateTable = function() {
    var _i, _len, _ref, row;
    bidsReceived += toBeRendered.length;
    bidCountInput.value(bidsReceived);
    if (typeof bidsMasterChart !== "undefined" && bidsMasterChart !== null) {
      _ref = toBeRendered;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        row = _ref[_i];
        bidsMasterChart.series[0].addPoint({
          x: row[4].getTime(),
          y: row[3],
          shares: row[2],
          bidder: row[1]
        }, false, false);
      }
    }
    model.addItems(toBeRendered);
    table.data(model.items);
    if (toBeRendered.length === waitingRenderThreshold) {
      bidsMasterChart.animation = false;
      bidsMasterChart.redraw();
      bidsMasterChart.animation = true;
    } else {
      bidsMasterChart.redraw();
    }
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
    console.log("Socket established.");
    return uki('#loading').visible(false);
  });
  socket.on('message', function(buffer) {
    var data;
    try {
      data = JSON.parse(buffer);
    } catch (error) {
      console.log("Error parsing a datum", error, data);
      return null;
    }
    if (data.bId) {
      toBeRendered.push([data.bId, data.bidder, data.shares, data.price, new Date(parseInt(data.time))]);
      if (toBeRendered.length < waitingRenderThreshold) {
        return !(renderTimer) ? (renderTimer = setTimeout(updateTable, renderTimeout)) : null;
      } else {
        stopRenderTimer();
        return updateTable();
      }
    } else if (data.summary == null ? undefined : data.summary.clearingPrice) {
      clearingPriceInput.value(data.summary.clearingPrice);
      return drawClearingThreshold(data.summary.clearingPrice);
    }
  });
  socket.on('disconnect', function() {
    return console.log("Socket disconnected!");
  });
  socket.connect();
  setInterval(function() {
    return bidsMasterChart.redraw();
  }, 2000);
}).call(this);
