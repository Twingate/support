
***tg***

[!Work In Progress!]

This is a command line application demonstrating various usages of the Twingate API.


**Setup**
1. Obtain an API key from the Twingate Admin Console with at least read and write permissions
2. Install [Deno](https://deno.land/#installation) for your platform.
3. At the terminal execute ``./tg.js``.

**Compilation**

This script can be compiled to a native executable binary using `deno compile --allow-net --allow-read --allow-write --allow-run --unstable ./tg.js`

Thereafter you can execute the binary without deno: ``./tg --help``

**Example - Show command usage**

``./tg.js --help``

``./tg.js groups --help``

**Example - Export Excel file**

``./tg.js export``

**Example - List resources**

``./tg.js resources list``
