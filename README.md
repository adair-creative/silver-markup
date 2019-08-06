# Silver Markup (Prototype)
Name is a WIP, feel free to give ideas

This is a prototype version of what I've codenamed "Silver Markup". This transpiled markup language is designed specifically for SilverStripe with inspirations from pug.

## Usage
Download the repository and run `compile.js` using node.

NOTE: It is currently hard-coded to use `example.sm`

## Syntax
Comments: `// My comment`

Element: `div.class.other-class#id[attr-1=value][attr-2=value]`

SilverStripe template logic: `% loop $Things`

`$` can still be used anywhere