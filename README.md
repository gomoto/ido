# ido

Common build tasks for web projects.

## Manifest files

Manifest files record how files map to their revision-hashed versions.
Specify manifest paths relative to current working directory.

It might be better to have one manifest file, but gulp-rev has issues with merging
manifest files:

https://github.com/sindresorhus/gulp-rev/issues/204

https://github.com/sindresorhus/gulp-rev/issues/205
