What the Tests Are
==================

Tests based on [Jasmine](https://jasmine.github.io/) BDD framework and cover some part of the code of extension.

How to Run the Tests
====================

To run tests you must use any webserver that can serve static files from given directory. You can use [this one](1) for example. Compiled files: [Mac OS], [Linux], [Windows]. Put the binary to `tests/local-http-server` so that it will be git-ignored.

#. Run your webserver with document root set to root directory of this project/repository.
#. Open in any browser the page `tests/SpecRunnerKeysocket.html`.

Let the webserver be running at `http://localhost:8080`. That way the path you have to navigate to
is `http://localhost:8080/tests/SpecRunnerKeysocket.html`.

[1](https://gist.github.com/feedbee/82b778b411f89c0514fa07423620c48b)
[Mac OS]: https://valera.ws/extraz/srv/src-mac
[Linux]: https://valera.ws/extraz/srv/src-linux
[Windows]: https://valera.ws/extraz/srv/src-windows