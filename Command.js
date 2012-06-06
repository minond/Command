(function (scope) {
	/**
	 * @name Command
	 * @namespace
	 */
	var Command = scope.Command = {};

	/**
	 * @var registered_shortcuts
	 */
	Command.registered_shortcuts = [];

	/**
	 * @var keys
	 */
	Command.keys = {
		empty: "",
		esc: 27,
		shift: 16,
		enter: 13,
		backspace: 8,
		space: { key: " ", code: 32 },
		colon: { key: ":", code: 186 },
		quote: { key: '"', code: 222 },
		dash: { key: "-", code: 189 }
	};

	/**
	 * @name real
	 * @param key_code int
	 * @return string character
	 *
	 * converts an even key code into a character.
	 * NOTE: this is not working correctly
	 */
	Command.keys.real = (function () {
		var special = "~`!@#$%^&*()_+-=<>,.?/:;\\\"'[]{}".split(this.empty);
		var special_map = {};
		var swap_char;

		for (var i = 0, max = special.length; i < max; i++)
			special_map[ special[ i ].charCodeAt(0) ] = special[ i ];

		return function (key_code) {
			switch (key_code) {
				case this.quote.code:
					swap_char = this.quote.key;
					break;

				case this.dash.code:
					swap_char = this.dash.key;
					break;

				default:
					swap_char = "";
					break;
			}

			return key_code in special_map ? special_map[ key_code ] : swap_char || String.fromCharCode(key_code);
		};
	})();

	/**
	 * @var state
	 * @method string saved string getter
	 * @method store save keys pressed
	 * @method increase increase key tracker
	 * @method reset reset key tracker
	 * @emthod at key tracker getter
	 * @method on flip state flag
	 * @method off flip state flag
	 * @method is state getter
	 * @method countdown start reset timer
	 *
	 * private state manager
	 */
	Command.state = (function () {
		var key_count = 0, state = 0, timer, shortcut;

		return {
			string: function () {
				return shortcut;
			},

			backspace: function () {
				shortcut = shortcut.substr(0, shortcut.length - 1);
			},

			store: function (str) {
				if (!shortcut) {
					shortcut = Command.keys.empty;
				}

				shortcut += str;
			},

			increase: function () {
				key_count++;
			},

			reset: function () {
				shortcut = Command.keys.empty;
				key_count = 0;
			},

			at: function () {
				return key_count;
			},

			on: function () {
				this.reset();
				return state = 1;
			},

			off: function () {
				if (timer) {
					clearTimeout(timer);
				}

				Command.ui.clear();
				this.reset();
				return state = 0;
			},

			is: function () {
				return state;
			},

			countdown: function () {
				var _this_ = this;

				if (timer) {
					clearTimeout(timer);
				}

				timer = setTimeout(function () {
					_this_.off();
				}, Command.timeout);
			}
		};
	})();

	/**
	 * @var timeout
	 *
	 * short-cut listener timeout
	 */
	Command.timeout = 2000;

	/**
	 * @name register
	 * @param string key shortcut
	 * @param function action
	 * @param mixed scope
	 * @return short-cut save index
	 *
	 * register a new keyboard short-cut and it's action.
	 */
	Command.register = function (key, action, args, scope) {
		return Command.registered_shortcuts.push({
			key: key,
			action: action,
			ready: false,
			last_command: null,
			scope: scope || window,
			args: args || []
		});
	};

	/**
	 * @name start
	 *
	 * adds event listener 
	 */
	Command.start = function () {
		document.body.addEventListener("keydown", function (e) {
			Command.trigger(e);
		});
	};

	/**
	 * @name trigger
	 * @param event object
	 *
	 * triggers a key input
	 */
	Command.trigger = function (e) {
		var key_code = e.keyCode;
		var key_char = this.keys.real(key_code);
		var shift = e.shiftKey;
		var shortcut, command;

		// browser short-cuts
		if (e.ctrlKey || e.metaKey || e.altKey || e.altGraphKey || e.keyCode === Command.keys.shift) {
			return false;
		}

		// state setters
		if (key_code === Command.keys.esc) {
			Command.ui.clear();
			Command.state.off();

			return;
		}
		else if (key_code === Command.keys.colon.code && shift && !Command.state.is()) {
			Command.ui.clear();
			Command.ui.write(Command.keys.colon.key);
			Command.state.countdown();
			Command.state.on();

			return;
		}

		// lowercase
		if (!shift) {
			key_char = key_char.toLowerCase();
		}
		// space
		if (key_code === Command.keys.space.code) {
			key_char = Command.keys.space.key;
		}

		// state check
		if (Command.state.is()) {
			if (e.preventDefault) {
				e.preventDefault();
			}

			// enter key
			if (key_code === Command.keys.enter) {
				// reset state
				Command.state.off();
				Command.ui.clear();

				for (var i = 0, max = Command.registered_shortcuts.length; i < max; i++) {
					shortcut = Command.registered_shortcuts[ i ];

					if (shortcut.ready) {
						command = Command.parse(shortcut.last_command) || [];
						shortcut.action.apply(shortcut.scope, [command[2], command[3]]);
					}
				}
			}
			// backspace
			else if (key_code === Command.keys.backspace) {
				Command.state.backspace();
				Command.ui.backspace();
			}
			// character
			else {
				// reset timer
				Command.state.countdown();

				// update keys pressed
				Command.state.store(key_char);
				Command.ui.write(key_char);

				// parse the command
				command = Command.state.string();
				command = Command.parse(command);
				command = command[0];

				// find matching short-cut
				for (var i = 0, max = Command.registered_shortcuts.length; i < max; i++) {
					shortcut = Command.registered_shortcuts[ i ];

					if (shortcut.key === command) {
						shortcut.ready = true;
						shortcut.last_command = Command.state.string();
					}
					else {
						shortcut.ready = false;
					}
				}

				// update key count
				Command.state.increase();
			}
		}
	};

	/**
	 * @name parse
	 * @param string command
	 * @return array command parts
	 *
	 * parses a command string for a command name and arguments.
	 * NOTE: not completed, arg=val not working, issues with non number/string values
	 */
	Command.parse = function (command) {
		var parts = command.split(this.keys.space.key);
		var args = parts.splice(1).join(this.keys.space.key).replace(/^\s+|\s+$/g, ''), argv = { 0: parts[0] }, argc = 1, valid = true;

		var arg_key = "-", arg_label = "--", arg_string = /'|"/, arg_number = /\d/, arg_non_number = /\D/;
		var state_arg, state_arg_key, state_arg_label, state_val, state_string;
		var ac, last = last_arg = last_val = "";

		// parse the arguments
		for (var i = 0, max = args.length; i < max; i++) {
			ac = args.charAt(i);

			// spaces
			if (ac === " ") {
				if (state_arg) {
					state_arg = false;

					if (!(last_arg in argv)) {
						argv[ last_arg ] = true;

						// string check
						if (args.charAt(i + 1)) {
							if (!args.charAt(i + 1).match(arg_string) && !args.charAt(i + 1).match(arg_number)) {
								last_arg = "";
							}
						}
					}

					continue;
				}

				if (state_string) {
					last_val += " ";
					continue;
				}

				if (state_val) {
					// number check
					if (!last_val.match(arg_non_number)) {
						last_val = +last_val;
					}

					argv[ last_arg || argc++ ] = last_val;
					last_val = "";
					state_val = false;

					continue;
				}

				if (!state_string && !state_val) {
					last_val = "";
					continue;
				}
			}

			// arg start check
			else if (ac === arg_key) {
				last_arg += ac;
				state_arg = true;
				state_arg_key = false;
				state_arg_label = false;

				// arg character
				if (last_arg === arg_key) {
					state_arg_key = true;
					state_arg_label = false;
				}

				// arg label
				else if (last_arg === arg_label) {
					state_arg_key = false;
					state_arg_label = true;
					last_arg = "";
				}
			}

			// arg check
			else if (state_arg) {
				if (state_arg_key) {
					if (last_arg !== arg_key) {
						argv[ last_arg ] = true;
					}

					last_arg = ac;
				}
				else {
					last_arg += ac;
				}
			}

			// string check start/end
			else if (ac.match(arg_string)) {
				if (state_string) {
					argv[ last_arg || argc++ ] = last_val;
					last_arg = "";
				}
				else {
					last_val = "";
				}

				state_string = !state_string;
			}
			// string character
			else if (state_string) {
				last_val += ac;
			}

			// regular value
			else {
				last_val += ac;
				state_val = true;
			}
		}

		if (last_arg && state_arg) {
			argv[ last_arg ] = true;
			state_arg = false;
		}

		if (last_val && state_val) {
			if (!last_val.match(arg_non_number)) {
				last_val = +last_val;
			}

			argv[ last_arg || argc++ ] = last_val;
			state_val = false;
		}

		// valid end state
		if (state_arg, state_val, state_string) {
			valid = false;
		}

		// arg count
		argc = 0;
		for (var i in argv) {
			argc++;
		}

		return parts.push(args, argc, argv, valid), parts;
	};

	/**
	 * @name arg
	 * @param object argument information
	 * @return object complete argument
	 *
	 * check that an anrgument has all the needed
	 * properties to be used/checked in a command.
	 */
	Command.arg = function (info) {
		info.name = info.name || "";
		info.alias = info.alias || "";
		info.value = info.value || false;
		info.description = info.description || "";
		info.usage = "usage" in info ? info.usage : true;

		return info;
	};

	/**
	 * @name usage
	 * @param command object
	 * @return void
	 *
	 * prints usage information about a command.
	 */
	Command.usage = function (command) {
		var descriptions = [], maxlabellen = 0, labelpadding;
		var argtitle, argpadding, argstring, argmax = 5;
		var arg, args = [];

		for (var i = 0, max = Command.registered_shortcuts.length; i < max; i++) {
			if (Command.registered_shortcuts[ i ].key === command) {
				command = Command.registered_shortcuts[ i ];
				args = command.args;
				argfound = true;
				break;
			}
		}

		if (!command.args.length) {
			return false;
		}

		labelpadding = function (str) {
			var leftpadding = 1, rightpadding = 2;
			var pad = maxlabellen - str.length;

			while (str += Command.keys.space.key, pad-- > 0);
			while (str = str + Command.keys.space.key, rightpadding-- > 0);
			while (str = Command.keys.space.key + str, leftpadding-- > 0);

			return str;
		};

		argtitle = "Usage: " + command.key;
		argpadding = argtitle.replace(/./g, Command.keys.space.key);

		Command.ui.clear();
		Command.ui.write(argtitle);

		for (var i = 0, max = args.length; i < max; i++) {
			arg = args[ i ];

			if (!arg.usage) {
				continue;
			}

			if (i > 1 && !(argmax % i)) {
				Command.ui.write("<br />" + argpadding);
			}

			if (arg.description) {
				descriptions.push({
					label: arg.name || arg.alias,
					text: arg.description
				});
			};
			
			argstring  = " [";
			argstring += arg.alias ? "-" + arg.alias : "";
			argstring += arg.alias && arg.name ? "|" : "";
			argstring += arg.name ? "--" + arg.name : "";
			argstring += arg.value ? "=&lt;value&gt;" : "";
			argstring += "]";

			Command.ui.write(argstring);
		}

		// descriptions
		if (descriptions.length) {
			Command.ui.write("<br /><br />");
		}

		for (var i = 0, max = descriptions.length; i < max; i++) {
			maxlabellen = Math.max(maxlabellen, descriptions[ i ].label.length);
		}

		for (var i = 0, max = descriptions.length; i < max; i++) {
			Command.ui.write(labelpadding(descriptions[ i ].label));
			Command.ui.write(descriptions[ i ].text);
			Command.ui.write("<br />");
		}
	};

	/**
	 * @var ui
	 */
	Command.ui = { node: null };

	/**
	 * @name write
	 * @param string key
	 * @return void
	 *
	 * writes to the ui output
	 */
	Command.ui.write = function (key) {
		if (this.node) {
			this.node.innerHTML += key;
		}
	};

	/**
	 * @name clear
	 * @return void
	 * 
	 * clears the ui output
	 */
	Command.ui.clear = function () {
		if (this.node) {
			this.node.innerHTML = Command.keys.empty;
		}
	};

	/**
	 * @name backspace
	 * @return void
	 *
	 * mimics a backspace character
	 */

	Command.ui.backspace = function () {
		if (this.node && this.node.innerHTML.length > 1) {
			this.node.innerHTML = this.node.innerHTML.substr(0, this.node.innerHTML.length - 1);
		};
	};

	/**
	 * @name hide
	 * @return void
	 *
	 * hides the ui output
	 */
	Command.ui.hide = function () {
		if (this.node) {
			this.node.style.display = "none";
		}
	};

	/**
	 * @name show
	 * @return void
	 *
	 * displays the ui output
	 */
	Command.ui.show = function () {
		if (!this.node) {
			this.node = document.createElement("div");
			this.node.className = "Command";

			this.node.style.position = "fixed";
			this.node.style.bottom = "5px";
			this.node.style.left = "7px";
			this.node.style.font = "11px monospace";
			this.node.style.color = "blue";
			this.node.style.whiteSpace = "pre";

			document.body.appendChild(this.node);
		}

		this.node.style.display = Command.keys.empty;
	};
})(window);
