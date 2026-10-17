# Security

Please report vulnerabilities through [GitHub private vulnerability reporting](https://github.com/WebDecoy/geomcp/security/advisories/new). Do not include credentials or real customer data in public issues.

The current supported release line is 0.1.x. Include a minimal reproduction, affected version, expected boundary and observed impact. The HTTP fetcher, redirect handling, XML parser and untrusted-document handling are particularly relevant boundaries.

GEOMCP runs with the permissions of its local process. Remote fetching is restricted to public HTTP(S) targets on ports 80 and 443. It does not execute page scripts. A local MCP client may transmit results to its model provider; apply that provider's data policies when deciding what HTML to supply.
