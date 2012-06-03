Command
===

Vim/vi like commands for web browsers.

Usage
---

	Command.register("alert", function (argc, argv) {
		if (argc > 1) {
			alert(argv.m || argv.message);
		}
	});

	Command.register("anotherCommand", function (argc, argv) {
		console.log("Number of arguments: %i, arguments: %o", argc, argv);
	});

Type the following in your browser to trigger:

	:alert --message "Hello, World!"

Or:

	:alert -m "Hello, World!"


Initialize
---

	Command.start();
	Command.ui.show();
