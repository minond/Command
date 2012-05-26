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
					shortcut = "";
				}

				shortcut += str;
			},

			increase: function () {
				key_count++;
			},

			reset: function () {
				shortcut = "";
				key_count = 0;
			},

			at: function () {
				return key_count;
			},

			on: function () {
				this.reset();
				Command.ui.show();
				return state = 1;
			},

			off: function () {
				if (timer) {
					clearTimeout(timer);
				}

				Command.ui.hide();
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
	Command.register = function (key, action, scope) {
		return Command.registered_shortcuts.push({
			key: key,
			keys: key.split(""),
			action: action,
			ready: false,
			scope: scope || window
		});
	};

	/**
	 * @name start
	 *
	 * adds event listener 
	 */
	Command.start = function () {
		document.body.addEventListener("keyup", function (e) {
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
		var key_char = String.fromCharCode(key_code);
		var shift = e.shiftKey;
		var shortcut;

		// browser short-cuts
		if (e.ctrlKey || e.metaKey || e.altKey || e.altGraphKey || e.keyCode === 16) {
			return false;
		}

		// state setters
		if (key_code === 27) {
			Command.ui.clear();
			Command.state.off();

			return;
		}
		else if (key_code === 186 && shift) {
			Command.ui.write(":");
			Command.state.countdown();
			Command.state.on();

			return;
		}

		// lowercase
		if (!shift) {
			key_char = key_char.toLowerCase();
		}

		// state check
		if (Command.state.is()) {
			// enter key
			if (key_code === 13) {
				for (var i = 0, max = Command.registered_shortcuts.length; i < max; i++) {
					shortcut = Command.registered_shortcuts[ i ];

					if (shortcut.ready) {
						shortcut.action();
					}
				}

				// reset state
				Command.state.off();
				Command.ui.clear();
			}
			// backspace
			else if (key_code === 8) {
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

				// find matching short-cut
				for (var i = 0, max = Command.registered_shortcuts.length; i < max; i++) {
					shortcut = Command.registered_shortcuts[ i ];

					if (shortcut.key === Command.state.string()) {
						shortcut.ready = true;
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

	Command.ui = { node: null };

	Command.ui.write = function (key) {
		if (this.node) {
			this.node.innerHTML += key;
		}
	};

	Command.ui.clear = function () {
		if (this.node) {
			this.node.innerHTML = "";
		}
	};

	Command.ui.backspace = function () {
		if (this.node && this.node.innerHTML.length > 1) {
			this.node.innerHTML = this.node.innerHTML.substr(0, this.node.innerHTML.length - 1);
		};
	};

	Command.ui.hide = function () {
		if (this.node) {
			this.node.style.display = "none";
		}
	};

	Command.ui.show = function () {
		if (!this.node) {
			this.node = document.createElement("div");
			this.node.className = "Command";

			this.node.style.position = "absolute";
			this.node.style.bottom = "5px";
			this.node.style.left = "7px";
			this.node.style.font = "11px monospace";
			this.node.style.color = "blue";

			document.body.appendChild(this.node);
		}

		this.node.style.display = "";
	};
})(window);

window.onload = function () {
	Command.start();
	Command.ui.show();
};

Command.timeout = 5000;

Command.register("hi", function () {
	console.log("hi~~~");
});


