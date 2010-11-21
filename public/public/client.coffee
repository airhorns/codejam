# formatter for highlighted strings
hlt = ''
formatHlted = (t) ->
	return t
	return if hlt then (t || '').replace(hlt, '<strong>' + hlt + '</strong>') else t

formatPrice = (t) ->
	s = "$" + String(t || 0) + ".00"
	return if hlt then s.replace(hlt, '<strong>' + hlt + '</strong>') else s

uki(
	view: 'Box'
	rect: '1000 600'
	minSize: '800 400'
	anchors: 'top left right bottom'
	childViews: [{
		view: 'Box'
		id: 'headerBox'
		rect: '1000 40'
		background: 'theme(panel)'
		anchors: 'top left right width'
		childViews: [{
			view: 'Label'
			rect: '10 0 100 40'
			html: '<span style="letter-spacing: 2px; font-family: \'Lobster\', arial, serif; font-size: 30px; font-weight: bold; text-shadow: #FFF 0px 1px 1px">Dutch IPO</span>'
			anchors: "top left"
		},{
			view: 'Label'
			rect: '200 15 100 20'
			html: '<span style="font-size: 15px;">Bids Recieved</span>'
			anchors: 'top left right width'
		},{
			view: 'TextField'
			rect: '300 15 20 20'
			anchors: 'top left width'
			value: "0"
			id: 'bidsReceived'
		},{
			view: 'Label'
			rect: '700 15 100 20'
			html: '<span style="font-size: 15px;">Clearing Price</span>'
			anchors: 'top left right width'
		}]
	},{
		# create a split pane...
		view: 'HSplitPane'
		rect: '0 41 1000 559'
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
			background: 'theme(panel)'
			id: 'bidFrequency'
		},{
			# Time view of bid submissions
			view: 'Box'
			rect: '0 100 518 429'
			anchors: 'top left right width bottom'
			background: 'theme(panel)'
			id: 'bidDisplay'
		}]
	}]
).attachTo window, '1000 600'

bidsDetailChart = new Highcharts.Chart(
	chart:
		renderTo: 'bidDisplay'
		marginRight: 10
		marginTop: 10
		reflow: false
	title:
		text: 'Bids'
		style:
			margin: '10px 100px 0 0'
	xAxis:
		type: 'datetime'
		tickPixelInterval: 150
	yAxis:
		title:
			text: 'Value'
		plotLines: [{
			value: 0
			width: 1
			color: '#808080'
		}]
	tooltip:
		formatter: () ->
			return '<b>'+ this.series.name +'</b><br/>'+
			Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x) +'<br/>'+
			Highcharts.numberFormat(this.y, 2)
	legend:
		enabled: false
	exporting:
		enabled: false
	series: [{
		name: 'Bids'
		type: 'scatter'
		data: []
	}]
)


# searchable model
class BidModel extends Searchable
	init: (data) ->
		@items ?= []
		@frequencies = {}
		this.addItems(data)

	addItems: (new_items) ->
		for row in new_items
			row.searchIndex = row[1].toLowerCase() # corp name
			f = String(row[4].getMinutes())
			@frequencies[f] ?= 0
			@frequencies[f] += 1

		@items = @items.concat(new_items)

	matchRow: (row, iterator) ->
		return row.searchIndex.indexOf(iterator.query) > -1

# Set up the model and grab references
uki('#loading').visible(false)
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

renderTimeout = 300
waitingRenderThreshold = 200
toBeRendered = []
renderTimer = false

bidCountInput = uki('#bidsReceived')

bidsReceived = 0
setInterval(() ->
	bidCountInput.value(bidsReceived)
, 1000)

updateTable = () ->
	bidsReceived += toBeRendered.length
	model.addItems(toBeRendered)
	if bidsDetailChart?
		for row in toBeRendered
			bidsDetailChart.series[0].addPoint([row[4].getTime(), row[3]], false, false)

	table.data(model.items)
	toBeRendered = []

stopRenderTimer = () ->
	if renderTimer
		clearTimeout(renderTimer)
		renderTimer = false
socket = new io.Socket("localhost")

socket.on 'connect', () ->
	console.log("Socket established.")

socket.on 'message', (data) ->
	console.log(data)
	try
		data = JSON.parse(data)
	catch error
		console.log("Error parsing a datum", error, data)

	# Figure out what the message was
	if data.bId
		toBeRendered.push([data.bId, data.bidder, data.shares, data.price, new Date(data.time*1)])
		if toBeRendered.length < waitingRenderThreshold
			unless renderTimer
				renderTimer = setTimeout(updateTable, renderTimeout)
		else
			# Enough to render!
			stopRenderTimer()
			updateTable()

socket.on 'disconnect', () ->
	console.log("Socket disconnected!")

socket.connect()

setInterval(() ->
	bidsDetailChart.redraw()
, 2000)
