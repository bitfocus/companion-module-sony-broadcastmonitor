// Sony Broadcast Monitors

var tcp = require('../../tcp')
var instance_skel = require('../../instance_skel')
var debug
var log

function instance(system) {
	var self = this

	// Request id counter
	self.request_id = 0
	self.stash = []
	self.command = null
	
	// choices
	self.monitors = [
		{ id: 'all', label: 'All monitor types' },
		{ id: 'BVM-E', label: 'BVM-E171, BVM-E251' },
		{ id: 'BVM-X', label: 'BVM-X300' },
		{ id: 'PVM-X', label: 'PVM-X550' },
		{ id: 'PVM-A', label: 'PVM-A250, PVM-A170' },
		{ id: 'LMD-A', label: 'LMD-A240, LMD-A220, LMD-A170' },
	]
	
	self.onOffToggle = [
		{ id: 'ON', label: 'On' },
		{ id: 'OFF', label: 'Off' },
		{ id: 'TOGGLE', label: 'Toggle' },
	]
	
	self.all_buttons = [
		{ id: 'MENU', label: 'Menu' },
		{ id: 'MENUENT', label: 'Enter' },
		{ id: 'MENUUP', label: 'Up' },
		{ id: 'MENUDOWN', label: 'Down' },
		{ id: 'ENTER', label: 'Numeric Enter' },
		{ id: 'DELETE', label: 'Numeric Delete' },
		{ id: '0', label: 'Numeric 0' },
		{ id: '1', label: 'Numeric 1' },
		{ id: '2', label: 'Numeric 2' },
		{ id: '3', label: 'Numeric 3' },
		{ id: '4', label: 'Numeric 4' },
		{ id: '5', label: 'Numeric 5' },
		{ id: '6', label: 'Numeric 6' },
		{ id: '7', label: 'Numeric 7' },
		{ id: '8', label: 'Numeric 8' },
		{ id: '9', label: 'Numeric 9' },
	]
	
	self.inputs_x = [
		{ id: '1', label: 'SDI 1 4K' },
		{ id: '2', label: 'SDI 1 2K' },
		{ id: '3', label: 'SDI 2 4K' },
		{ id: '4', label: 'SDI 2 2K' },
		{ id: '5', label: 'HDMI' },
	]

	self.inputs_a = [
		{ id: '1', label: 'SDI 1' },
		{ id: '2', label: 'SDI 2' },
		{ id: '3', label: 'HDMI' },
		{ id: '4', label: 'Composite' },
	]
	
	self.status_options = [
		{ id: 'MODEL', label: 'Model Name' },
		{ id: 'SERIAL', label: 'Serial Number' },
		{ id: 'OPTIME', label: 'Operating Hours' },
		{ id: 'DEVTIME', label: 'Panel Operating Hours' },
		{ id: 'VERSION', label: 'Software Version' },
		{ id: 'SIGFORMAT', label: 'Input Signal Format' },
		{ id: 'CURRENT', label: 'Monitor States' },
	]

	// super-constructor
	instance_skel.apply(this, arguments)
	return self
}

instance.prototype.updateConfig = function(config) {
	var self = this

	self.config = config
	self.init_tcp()
	
	console.log('Using monitor type ' + self.config.monitor_type)
	self.actions()
};

instance.prototype.init = function() {
	var self = this

	debug = self.debug
	log = self.log

	self.init_tcp()

	self.update_variables()
	self.init_presets()
	self.actions()

};

instance.prototype.init_tcp = function() {
	var self = this
	var receivebuffer = Buffer.from('')

	if (self.socket !== undefined) {
		self.socket.destroy()
		delete self.socket
	}

	self.has_data = false

	if (self.config.host) {
		self.socket = new tcp(self.config.host, self.config.port)

		self.socket.on('status_change', function (status, message) {
			self.status(status, message)
		})

		self.socket.on('error', function (err) {
			console.log('Network error', err)
			self.log('error','Network error: ' + err.message)
		})

		self.socket.on('connect', function () {
			console.log('Connected')
		})

		// separate buffered stream into lines with responses
		self.socket.on('data', function (chunk) {
			self.log('debug','data received')
			console.log('Received: ' + chunk.length + ' bytes ', chunk.toString('hex').match(/../g).join(' '))
			self.socket.emit('decode', chunk)
		});

		self.socket.on('decode', function (data) {
			if (data.length > 0) {
				console.log('decoding ' + data.length + 'bytes')
			}
		})
	}
}

// Return config fields for web config
instance.prototype.config_fields = function () {
	var self = this

	return [
		{
			type: 'text',
			id: 'info',
			width: 12,
			label: 'Information',
			value: 'This module will allow you to control Sony Broadcast Monitors.',
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'Device IP',
			width: 6,
			regex: self.REGEX_IP,
		},
		{
			type: 'textinput',
			id: 'port',
			label: 'Device Port',
			width: 6,
			default: '53484',
			regex: self.REGEX_PORT,
		},
		{
			type: 'number',
			id: 'monitor_id',
			label: 'Monitor ID',
			width: 6,
			default: '1',
			min: '1',
			max: '99',
		},
		{
			type: 'dropdown',
			id: 'monitor_type',
			label: 'Show actions applicable to',
			width: 6,
			default: 'all',
			choices: self.monitors,
		},
	]
};

// When module gets deleted
instance.prototype.destroy = function() {
	var self = this

	if (self.socket !== undefined) {
		self.socket.destroy()
	}

	debug('destroy', self.id)
};

instance.prototype.update_variables = function (system) {
	var self = this

};

instance.prototype.feedback = function(feedback, bank) {
	var self = this

};

instance.prototype.init_presets = function () {
	var self = this
	var presets = []
	var i

	console.log('Create presets')

	for (i = 0; i < self.all_buttons.length; ++i) {
		presets.push({
			category: 'Menu Controls',
			label: self.all_buttons[i].label,
			bank: {
				style: 'text',
				text: self.all_buttons[i].label,
				size: '18',
				color: 16777215,
				bgcolor: 0,
			},
			actions: [
				{
					action: 'button_press',
					options: {
						state: self.all_buttons[i].id,
					},
				},
			],
		})
	}

	self.setPresetDefinitions(presets)
};

instance.prototype.actions = function() {
	var self = this
	var actions = []
	var type = self.config.monitor_type
	
	console.log('Creating actions for ' + type)

	if (type === 'all' || type === 'BVM-X') {
		actions['input_bvm-x'] = {
			label: 'BVM-X Input Select',
			options: [
				{
					type: 'dropdown',
					label: 'Input',
					id: 'state',
					default: '1',
					choices: self.inputs_x,
				}
			]
		}
	}

	if (type === 'all' || type === 'PVM-X') {
		actions['input_pvm-x'] = {
			label: 'PVM-X Input Select',
			options: [
				{
					type: 'dropdown',
					label: 'Input',
					id: 'state',
					default: '1',
					choices: self.inputs_x,
				}
			]
		}
	}

	if (type === 'all' || type === 'PVM-A') {
		actions['input_pvm-a'] = {
			label: 'PVM-A Input Select',
			options: [
				{
					type: 'dropdown',
					label: 'Input',
					id: 'state',
					default: '1',
					choices: self.inputs_a,
				}
			]
		}
	}

	if (type === 'all' || type === 'LMD-A') {
		actions['input_lmd-a'] = {
			label: 'LMD-A Input Select',
			options: [
				{
					type: 'dropdown',
					label: 'Input',
					id: 'state',
					default: '1',
					choices: self.inputs_a,
				}
			]
		}
	}

	if (type === 'all' || type === 'BVM-E' || type === 'PVM-A' || type === 'LMD-A') {
		actions['aspect'] = {
			label: 'Aspect Ratio',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: '16BY9',
					choices: [
						{ id: '4BY3', label: '4:3' },
						{ id: '16BY9', label: '16:9' },
						{ id: 'TOGGLE', label: 'Toggle' }
					]
				}
			]
		}
	}

	actions['marker'] = {
		label: 'Marker',
		options: [
			{
				type: 'dropdown',
				label: 'State',
				id: 'state',
				default: 'ON',
				choices: self.onOffToggle,
			}
		]
	}

	actions['monochr'] = {
		label: 'Monochrome',
		options: [
			{
				type: 'dropdown',
				label: 'State',
				id: 'state',
				default: 'ON',
				choices: self.onOffToggle,
			}
		]
	}

	if (type === 'all' || type === 'BVM-E' || type === 'BVM-X' || type === 'PVM-X') {
		actions['manphase'] = {
			label: 'Manual Phase',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'ON',
					choices: self.onOffToggle,
				}
			]
		}

		actions['manchr'] = {
			label: 'Manual Chroma',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'ON',
					choices: self.onOffToggle,
				}
			]
		}

		actions['mancont'] = {
			label: 'Manual Contrast',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'ON',
					choices: self.onOffToggle,
				}
			]
		}

		actions['manbrt'] = {
			label: 'Manual Brightness',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'ON',
					choices: self.onOffToggle,
				}
			]
		}
	}

	actions['blueonly'] = {
		label: 'Blue Only',
		options: [
			{
				type: 'dropdown',
				label: 'State',
				id: 'state',
				default: 'ON',
				choices: self.onOffToggle,
			}
		]
	}

	if (type === 'all' || type === 'BVM-E') {

		actions['scanmode'] = {
			label: 'Scan Mode',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'UNDER',
					choices: [
						{ id: 'UNDER', label: 'Underscan' },
						{ id: 'OVER', label: 'Overscan' },
						{ id: 'OVERMAT', label: 'Over Mat' },
						{ id: 'TOGGLE', label: 'Toggle' }
					]
				}
			]
		}

		actions['hdelay'] = {
			label: 'Horizontal Delay',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'ON',
					choices: self.onOffToggle,
				}
			]
		}

		actions['vdelay'] = {
			label: 'Vertical Delay',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'ON',
					choices: self.onOffToggle,
				}
			]
		}
	}

	if (type === 'all' || type === 'BVM-E' || type === 'BVM-X' || type === 'PVM-X') {

		actions['rcutoff'] = {
			label: 'Red Cut Off',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'ON',
					choices: self.onOffToggle,
				}
			]
		}

		actions['gcutoff'] = {
			label: 'Green Cut Off',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'ON',
					choices: self.onOffToggle,
				}
			]
		}

		actions['bcutoff'] = {
			label: 'Blue Cut Off',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'ON',
					choices: self.onOffToggle,
				}
			]
		}

		actions['aperture'] = {
			label: 'Aperture',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'ON',
					choices: self.onOffToggle,
				}
			]
		}
	}

	actions['power'] = {
		label: 'Power',
		options: [
			{
				type: 'dropdown',
				label: 'State',
				id: 'state',
				default: 'ON',
				choices: self.onOffToggle,
			}
		]
	}

	if (type === 'all' || type === 'BVM-E' || type === 'PVM-A' || type === 'LMD-A') {
		actions['chromaup'] = {
			label: 'Chroma Up Display',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'ON',
					choices: self.onOffToggle,
				}
			]
		}
	}

	if (type === 'all' || type === 'BVM-E') {
		actions['showaddr'] = {
			label: 'Show Address',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'SINGLE',
					choices: [
						{ id: 'SINGLE', label: 'Single' },
						{ id: 'GROUP', label: 'Group' }
					]
				}
			]
		}
	}

	if (type === 'all' || type === 'BVM-E' || type === 'BVM-X' || type === 'PVM-X') {
		actions['charmute'] = {
			label: 'Character Mute',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'ON',
					choices: self.onOffToggle,
				}
			]
		}
	}

	if (type === 'all' || type === 'BVM-E') {
		actions['coladj'] = {
			label: 'Manual Color Temperature',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'ON',
					choices: self.onOffToggle,
				}
			]
		}
	}

	if (type === 'all' || type === 'BVM-E' || type === 'PVM-A' || type === 'LMD-A') {
		actions['sidebyside'] = {
			label: 'Side by Side Display',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'ON',
					choices: self.onOffToggle,
				}
			]
		}

		actions['wipe'] = {
			label: 'Wipe Display',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'ON',
					choices: self.onOffToggle,
				}
			]
		}

		actions['blend'] = {
			label: 'Blend Display',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'ON',
					choices: self.onOffToggle,
				}
			]
		}
	}

	if (type === 'all' || type === 'BVM-E') {
		actions['butterfly'] = {
			label: 'Butterfly Display',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'ON',
					choices: self.onOffToggle,
				}
			]
		}

		actions['pixelzoom'] = {
			label: 'Pixel Zoom Display',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'ON',
					choices: self.onOffToggle,
				}
			]
		}
	}

	actions['nativescan'] = {
		label: 'Native Scan',
		options: [
			{
				type: 'dropdown',
				label: 'State',
				id: 'state',
				default: 'ON',
				choices: self.onOffToggle,
			}
		]
	}

	if (type === 'all' || type === 'BVM-E' || type === 'BVM-X' || type === 'PVM-X') {
		actions['markeraspect'] = {
			label: 'Aspect Marker',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'ON',
					choices: self.onOffToggle,
				}
			]
		}

		actions['markerarea1'] = {
			label: 'Layer 1 Marker',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'ON',
					choices: self.onOffToggle,
				}
			]
		}

		actions['markerarea2'] = {
			label: 'Layer 2 Marker',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'ON',
					choices: self.onOffToggle,
				}
			]
		}
	}

	if (type === 'all' || type === 'BVM-E' || type === 'BVM-X') {
		actions['ppintlc'] = {
			label: 'Interlace Display',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'ON',
					choices: self.onOffToggle,
				}
			]
		}
	}

	if (type === 'all' || type === 'BVM-E' || type === 'PVM-A' || type === 'LMD-A') {
		actions['alm'] = {
			label: 'Audio Level Meter Display',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'ON',
					choices: self.onOffToggle,
				}
			]
		}
	}

	actions['timecode'] = {
		label: 'Timecode Display',
		options: [
			{
				type: 'dropdown',
				label: 'State',
				id: 'state',
				default: 'ON',
				choices: self.onOffToggle,
			}
		]
	}

	if (type === 'all' || type === 'BVM-E') {
		actions['statusdisp'] = {
			label: 'Status Display',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'ON',
					choices: self.onOffToggle,
				}
			]
		}
	}

	if (type === 'all' || type === 'BVM-E' || type === 'BVM-X' || type === 'PVM-X') {
		actions['markeraspline'] = {
			label: 'Aspect Marker Line Display',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'ON',
					choices: self.onOffToggle,
				}
			]
		}

		actions['markerblkhalf'] = {
			label: 'Aspect Blanking Half Display',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'ON',
					choices: self.onOffToggle,
				}
			]
		}

		actions['markerblkblack'] = {
			label: 'Aspect Blanking Black Display',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'ON',
					choices: self.onOffToggle,
				}
			]
		}

		actions['markercenter'] = {
			label: 'Center Marker Display',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'ON',
					choices: self.onOffToggle,
				}
			]
		}
	}	

	if (type === 'all' || type === 'PVM-A' || type === 'LMD-A') {
		actions['hflip'] = {
			label: 'Horizonal Flip',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'ON',
					choices: self.onOffToggle,
				}
			]
		}
	}

	if (type === 'all' || type === 'BVM-E' || type === 'BVM-X'|| type === 'PVM-X'|| type === 'PVM-A') {
		actions['flickerfree'] = {
			label: 'Flicker Free',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'state',
					default: 'ON',
					choices: self.onOffToggle,
				}
			]
		}
	}

	actions['button_press'] = {
		label: 'Generic Button Press',
		options: [
			{
				type: 'dropdown',
				label: 'Simulate monitor button press',
				id: 'state',
				default: 'MENU',
				choices: self.all_buttons,
			}
		]
	}

	actions['status_request'] = {
		label: 'Status',
		options: [
			{
				type: 'dropdown',
				label: 'Request status information',
				id: 'state',
				default: 'MODEL',
				choices: self.status_options,
			}
		]
	}

	self.system.emit('instance_actions', self.id, actions);
}

instance.prototype.action = function(action) {
	var self = this
	var header = '030B'
	var community = '534F4E59' // SONY
	var group = '00' // Monitor group ID
	var unit = self.padLeft(self.config.monitor_id, 2) // Monitor unit ID
	var request = '00'
	var item = 'B000'
	
	var set = 'STATset'
	var get = 'STATget'
	var button = 'INFObutton'
	
	var cmd = header + community + group + unit + request + item

	if (action.action === 'input_bvm-x' || action.action === 'input_pvm-x' || action.action === 'input_pvm-a' || action.action === 'input_lmd-a') {
		var actionStr = button + ' ' + action.options.state
	} else if (action.action === 'button_press') {
		var actionStr = button + ' ' + action.options.state
	} else if (action.action === 'status_request') {
		var actionStr = get + ' ' + action.options.state.toUpperCase()
	} else {
		var actionStr = set + ' ' + action.action.toUpperCase() + ' ' + action.options.state
	}

	console.log(actionStr)
	self.log('debug', actionStr)
	actionStrHex = self.asciiToHex(actionStr)
	cmd = cmd + self.getLength(actionStrHex) + actionStrHex
	self.log('debug', cmd)
	console.log(self.hexStringToBuffer(cmd))

	if (cmd !== undefined) {
		if (self.socket !== undefined && self.socket.connected) {
			
			self.socket.send(self.hexStringToBuffer(cmd))
		} else {
			debug('Socket not connected :(')
		}
	}
};

instance.prototype.padLeft = function(nr, n, str) {
	return Array(n-String(nr).length+1).join(str||'0')+nr
}

instance.prototype.asciiToHex = function(str) {
	var arr1 = []
	for (var n = 0, l = str.length; n < l; n ++)
	{
		var hex = Number(str.charCodeAt(n)).toString(16)
		arr1.push(hex)
	}
	return arr1.join('')
}

instance.prototype.hexStringToBuffer = function(str) {
	return Buffer.from(str, 'hex')
}

instance.prototype.getLength = function(str) {
	var self = this
	
	var length = (str.length / 2).toString(16)
	return self.padLeft(length, 4)
}

instance_skel.extendedBy(instance)
exports = module.exports = instance
