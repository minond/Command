Command
=======

Vim/vi like commands for web browsers.
--------------------------------------

Usage
-----

	Command.register("alert", function (argc, argv) {
		if (argc > 1) {
			alert(argv.m || argv.message);
		}
	});

Type the following in your browser to trigger:

	:alert --message "Hello, World!"

Or:

	:alert -m "Hello, World!"
