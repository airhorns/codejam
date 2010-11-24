# formatter for highlighted strings
hlt = ''
formatHlted = (t) ->
	return if hlt then (t || '').replace(hlt, '<strong>' + hlt + '</strong>') else t

formatPrice = (t) ->
	"$" + String(t || 0) + ".00"

uki(
	view: 'Box'
	rect: '1000 600'
	minSize: '800 400'
	anchors: 'top left right bottom'
	childViews: [{
		view: 'Box'
		id: 'headerBox'
		rect: '1000 60'
		background: 'theme(panel)'
		anchors: 'top left right width'
		childViews: [{
		# 	view: 'Label'
		# 	rect: '10 0 100 40'
		# 	html: '<span style="letter-spacing: 2px; font-family: \\'Lobster\\', arial, serif; font-size: 30px; font-weight: bold; text-shadow: #FFF 0px 1px 1px">Dutch IPO</span>'
		# 	anchors: "top left"
		},{
		 	view: 'Image'
			src: '/logo510x60.png'
			rect: '0 0 510 60'
			anchors: "top left"
		},{
			view: 'Label'
			rect: '600 20 100 20'
			html: '<span style="font-size: 15px;">Bids Recieved</span>'
			anchors: 'top left right width'
		},{
			view: 'TextField'
			rect: '700 15 40 30'
			anchors: 'top left'
			value: "0"
			id: 'bidsReceived'
		},{
			view: 'Label'
			rect: '800 20 100 20'
			html: '<span style="font-size: 15px;">Clearing Price</span> $'
			anchors: 'top left right width'
		},{
			view: 'TextField'
			rect: '910 15 40 30'
			anchors: 'top left'
			value: "0"
			id: 'clearingPrice'
		}]
	},{
		# create a split pane...
		view: 'HSplitPane'
		rect: '0 61 1000 559'
		anchors: 'left top right bottom'
		handlePosition: 475
		leftMin: 475
		rightMin: 400
		leftPane:
			background: '#D0D7E2'
			childViews:[{
				view: 'TextField'
				rect: '5 5 465 22'
				anchors: 'left top right'
				placeholder: 'bidder search'
				id: 'bidderSearch'
			},{
				view: 'Table'
				rect: '0 30 475 529'
				minSize: '0 200'
				anchors: 'left top right bottom'
				columns: [
					{ view: 'table.NumberColumn', label: 'ID', resizable: true, width: 60},
					{ view: 'table.CustomColumn', label: 'Bidder', resizable: true, minWidth: 50, width: 100, formatter: formatHlted },
					{ view: 'table.CustomColumn', label: 'Price', resizable: true, minWidth: 50, width: 75, formatter: formatPrice },
					{ view: 'table.CustomColumn', label: 'Shares', resizable: true, minWidth: 50, width: 75}
					{ view: 'table.CustomColumn', label: 'Time', resizable: true, minWidth: 100, width: 150}
				]
				style:
					fontSize: '11px'
					lineHeight: '11px'
			},{
				view: 'Label'
				rect: '130 280 200 60'
				anchors: 'top'
				textAlign: 'center'
				text: 'Loading...'
				id: 'loading'
				style: {fontSize: '60px', fontFamily: '\'Lobster\', arial, serif', color: '#AAA', textShadow:'#CCC 0px 1px 1px'}
			}]

		rightChildViews: [{
			# Time view of bid submissions
			view: 'Box'
			rect: '0 0 518 100'
			anchors: 'top left right width'
			id: 'bidFrequency'
		},{
			# Time view of bid submissions
			view: 'Box'
			rect: '0 100 518 398'
			anchors: 'top left right width bottom'
			id: 'bidDisplay'
			childViews: [{
				view: 'Box'
				rect: '0 0 518 259'
				anchors: 'top left right width bottom'
				background: 'theme(panel)'
				id: 'bidDetailsDisplay'
			},{
				view: 'Box'
				rect: '0 259 490 180'
				anchors: 'left right width bottom'
				id: 'bidMasterDisplay'
			}]
		}]
	}]
).attachTo window, '1000 600'

bidsDetailsChart = {}
bidsMasterChart = new Highcharts.Chart({
	chart:
		renderTo: 'bidMasterDisplay'
		reflow: true
		borderWidth: 0
		backgroundColor: null
		marginLeft: 5
		marginRight: 5
		zoomType: 'x'
		events:
			# listen to the selection event on the master chart to update the 
			# extremes of the detail chart
			selection: (event) ->
				selectionExtremes = event.xAxis[0]
				chartExtremes = event.currentTarget.xAxis[0].getExtremes()
				detailData = []
				xAxis = this.xAxis[0]
									
				# reverse engineer the last part of the data
				for point in this.series[0].data
					if (point.x > selectionExtremes.min && point.x < selectionExtremes.max)
						detailData.push
							x: point.x
							y: point.y
							shares: point.shares
							bidder: point.bidder
				# move the plot bands to reflect the new detail span
				xAxis.removePlotBand('mask-before')
				xAxis.addPlotBand({
					id: 'mask-before'
					from: chartExtremes.min
					to: selectionExtremes.min
					color: Highcharts.theme?.maskColor || 'rgba(0, 0, 0, 0.2)'
				})
									
				xAxis.removePlotBand('mask-after')
				xAxis.addPlotBand({
					id: 'mask-after'
					from: selectionExtremes.max
					to: chartExtremes.max
					color: Highcharts.theme?.maskColor || 'rgba(0, 0, 0, 0.2)'
				})
									
				bidsDetailsChart.series[0].setData(detailData)
				bidsDetailsChart.series[1].setData([[selectionExtremes.min, currentClearingPrice],[selectionExtremes.max,currentClearingPrice]])
				

				return false
	title:
		text: null
	xAxis:
		gridLineWidth: 1
		type: 'datetime'
		showLastTickLabel: true
		plotBands: [{
			id: 'mask-before'
			color: Highcharts.theme?.maskColor || 'rgba(0, 0, 0, 0.2)'
		}]
		title:
			text: "Submission Time"
	yAxis:
		gridLineWidth: 0
		labels:
			enabled: false
		title:
			text: "Bid Price"
		showFirstLabel: false
	tooltip:
		formatter: () ->
			return false
	legend:
		enabled: false
	credits:
		enabled: false
	plotOptions:
		scatter:
			fillColor:
				linearGradient: [0, 0, 0, 70]
				stops: [[0, "#4572A7"],[1, 'rgba(0,0,0,0)']]
			lineWidth: 0
			marker:
				enabled: true
				radius: 1
			shadow: false
			states:
				hover:
					lineWidth: 1
			enableMouseTracking: false
	series: [{
		name: "Bids"
		type: 'scatter'
		data: []
	}]
	exporting:
		enabled: false
},(masterChart) ->
	console.log("Creating details chart")
	bidsDetailsChart = new Highcharts.Chart({
		chart:
			renderTo: 'bidDetailsDisplay'
			marginRight: 10
			marginTop: 10
			reflow: true
			style:
				position: 'absolute'
		credits:
			enabled: false
		title:
			text: 'Bids'
		subtitle:
			text: 'Select an area to view by dragging across the lower chart'
		xAxis:
			type: 'datetime'
			tickPixelInterval: 150
			gridLineWidth: 1
		yAxis:
			title:
				text: 'Value'
			plotLines: [{
				value: 0
				width: 1
				color: '#808080'
			}]
		plotOptions:
			line:
				lineWidth: 10
		tooltip:
			formatter: () ->
				return '<b>'+ this.point.bidder +'</b>:<br/>'+
                  this.point.shares + ' shares at $'+ Highcharts.numberFormat(this.y, 2)+"<br/>Submitted "+
                  Highcharts.dateFormat('%a %b %e %l:%M:%S %P', this.x)
		legend:
			enabled: false
		exporting:
			enabled: false
		series: [{
			name: 'Bids'
			type: 'scatter'
			data: []
		},{
			type: 'line',
			name: 'Clearing Price',
			data: [],
			marker:
				enabled: false
			enableMouseTracking: false
		}]
	})
)

currentClearingPrice = false
drawClearingThreshold = (price) ->
	currentClearingPrice = price
	if bidsDetailsChart?
		data = bidsDetailsChart.series[1].data
		if data? && data[0]? && data[1]?
			data[0][1] = price
			data[1][1] = price
			bidsDetailsChart.series[1].setData data
			bidsDetailsChart.redraw()


# searchable model
class BidModel extends Searchable
	init: (data) ->
		@items ?= []
		@frequencies = {}
		this.addItems(data)

	addItems: (new_items) ->
		for row in new_items
			row.searchIndex = row[1].toLowerCase() # corp name

		@items = @items.concat(new_items)

	matchRow: (row, iterator) ->
		return row.searchIndex.indexOf(iterator.query) > -1

# Set up the model and grab references
model = new BidModel([])
lastQuery = ''
table = uki('Table')
table.data(model.items)

# Set up the sorting headers
resetHeaders = (except) ->
	table.find('Header').each(() ->
		header = this
		for col in header.columns()
			if !except? || col != except
				col.sort('')
				header.redrawColumn(col._position)
		)

# Binding to the column clicking of the header to allow sorting
table.find('Header').bind 'columnClick', (e) ->
	header = this
	uki('#loading').visible(true)
	if e.column.sort() == 'ASC'
		e.column.sort('DESC')
	else
		e.column.sort('ASC')

	uki('#loading').visible(false)
	header.redrawColumn(e.column._position)
	resetHeaders(e.column)
	model.items = e.column.sortData(model.items)
	table.data(model.items)

# Search bindings
model.bind 'search.foundInChunk', (chunk) ->
	table.data(table.data().concat(chunk)).layout()

uki('#bidderSearch').bind 'keyup click', () ->
	return if (this.value().toLowerCase() == lastQuery)
	lastQuery = this.value().toLowerCase()
	if lastQuery.match(/\S/)
		hlt = lastQuery
		table.data([])
		model.search(lastQuery)
		resetHeaders()
	else
		hlt = ''
		table.data(model.items)

# Table rendering and updating
renderTimeout = 300
waitingRenderThreshold = 200
toBeRendered = []
renderTimer = false

bidsReceived = 0
bidCountInput = uki('#bidsReceived')
clearingPriceInput = uki('#clearingPrice')

# Function which renders out the render buffer
updateTable = () ->
	bidsReceived += toBeRendered.length
	bidCountInput.value(bidsReceived)
	
	if bidsMasterChart?
		for row in toBeRendered
			bidsMasterChart.series[0].addPoint({x:row[4].getTime(), y:row[3], shares: row[2], bidder: row[1]}, false, false)
	model.addItems(toBeRendered)
	table.data(model.items)
	# Make sure animations are off if we are in superfast highperf mode
	if toBeRendered.length == waitingRenderThreshold
		bidsMasterChart.animation = false
		bidsMasterChart.redraw()
		bidsMasterChart.animation = true
	else
		bidsMasterChart.redraw()

	toBeRendered = []

stopRenderTimer = () ->
	if renderTimer
		clearTimeout(renderTimer)
		renderTimer = false

socket = new io.Socket()

socket.on 'connect', () ->
	console.log("Socket established.")
	uki('#loading').visible(false)
	

socket.on 'message', (buffer) ->
	try
		data = JSON.parse(buffer)
	catch error
		console.log("Error parsing a datum", error, data)
		return
	# Figure out what the message was
	if data.bId
		toBeRendered.push([data.bId, data.bidder, data.shares, data.price, new Date(parseInt(data.time))])
		if toBeRendered.length < waitingRenderThreshold
			unless renderTimer
				renderTimer = setTimeout(updateTable, renderTimeout)
		else
			# Enough to render!
			stopRenderTimer()
			updateTable()
	else if data.summary?.clearingPrice
		clearingPriceInput.value(data.summary.clearingPrice)
		drawClearingThreshold(data.summary.clearingPrice)

socket.on 'disconnect', () ->
	console.log("Socket disconnected!")

socket.connect()

setInterval(() ->
	bidsMasterChart.redraw()
, 2000)

