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
	rect: '1000 1000'
	minSize: '800 400'
	anchors: 'top left right width'
	childViews: [{
		view: 'Box'
		id: 'headerBox'
		rect: '1000 100'
		background: 'theme(panel)'
		anchors: 'top left right width'
		childViews: [{
			view: 'Label'
			rect: '20 35 100 24'
			html: '<span style="letter-spacing: 2px; font-family: \'Lobster\', arial, serif; font-size: 60px; font-weight: bold; text-shadow: #FFF 0px 1px 1px">Dutch IPO</span>'
			anchors: "top left"
		},{
			view: 'Label'
			rect: '200 35 100 24'
			html: '<span style="font-size: 30px;">Bids Recieved</span>'
		},{
			view: 'Label'
			rect: '700 35 100 24'
			html: '<span style="font-size: 30px;">Clearing Price</span>'
		}]
	}, {
		# create a split pane...
    view: 'HSplitPane'
		rect: '0 101 1000 899'
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
				placeholder: 'search'
			},{
				view: 'Table'
				rect: '0 30 475 869'
				minSize: '0 200'
				anchors: 'left top right bottom'
				columns: [
					{ view: 'table.NumberColumn', label: 'ID', width: 60},
					{ view: 'table.CustomColumn', label: 'Bidder', resizable: true, minWidth: 100, width: 250, formatter: formatHlted },
					{ view: 'table.CustomColumn', label: 'Price', resizable: true, minWidth: 50, width: 75, formatter: formatPrice },
					{ view: 'table.CustomColumn', label: 'Shares', resizable: true, width: 50, width: 75}
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

		# rightChildViews:
	}]
).attachTo window, '1000 1000'


# searchable model
class BidModel extends Searchable
	init: (data) ->
		@items ?= []
		this.addItems(data)

	addItems: (new_items) ->
		for row in new_items
			row.searchIndex = row[1].toLowerCase()

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

uki('TextField').bind 'keyup click', () ->
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

socket = new io.Socket("localhost")
socket.on 'connect', () ->
	console.log("Socket established.")

renderTimeout = 300
waitingRenderThreshold = 50
toBeRendered = []
renderTimer = false

updateTable = () ->
	model.addItems(toBeRendered)
	table.data(model.items)
	# for row in toBeRendered
	# 	table.addRow(0, row) seems to be slower	
	toBeRendered = []

stopRenderTimer = () ->
	if renderTimer
		clearTimeout(renderTimer)
		renderTimer = false

socket.on 'message', (data) ->
	try
		data = JSON.parse(data)
	catch error
		console.log("Error parsing a datum", error, data)
	
	# Figure out what the message was
	if data.bId
		toBeRendered.push([data.bId, data.bidder, data.shares, data.price])
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


