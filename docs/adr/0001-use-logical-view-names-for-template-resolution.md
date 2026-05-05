# Use logical view names for template resolution

ScreamJS resolves templates from logical view names under the configured views root instead of accepting arbitrary filesystem paths. Absolute paths and parent-directory traversal are rejected, and `.scream` is the only template extension, so controllers and templates can use stable names like `home.scream` or `layouts/app.scream` without exposing filesystem escape hatches.
