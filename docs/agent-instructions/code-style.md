# Code Style Guidelines

## Overview

Use straightforward code with explicit data flow. Refactor only when it makes the next change easier or the current code clearer.

## Rules

* Keep functions short enough to scan quickly.
* Prefer straightforward names and explicit data flow.
* Prefer early returns for branching and guard clauses.
* Avoid trailing `else` blocks after a branch that already returns, throws, or continues.
* Keep dispatch branches ordered and explicit so the main path is easy to scan.
* Avoid `as` casts unless there is no cleaner practical option.
* Do not use compile-time casts to work around missing boundary types. Parse or narrow data into a concrete type instead.
* Keep comments rare and useful.
* Refactor only when it makes the next change easier or the current code clearer.

The best design here is the one that keeps shipping speed high without making the next few changes painful.
