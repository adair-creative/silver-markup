class HTMLElement {
	/**
	 * @param {string} lexicalLine 
	 */
	constructor(lexicalLine) {
		const tagRegex = /^([\w\-$]+{[\w\-$.]+}[\w\-$]+|[\w\-$]+)/;
		const idRegex = /(#[\w\-{}]+\$[\w\-.#{}]+|#[\w\-{}]+)/g;
		const attrRegex = /(\[[\w\-$."']+=.+?(?=\])\])/g;
		const classRegex = /(\.[\w\-{}]+\$[\w\-.{}]+|\.[\w\-{}]+)/g;

		let selector = "";
		let inAttr = false;
		let inContent = false;

		this.content = "";
		this.noChildren = lexicalLine.endsWith("/");

		for (let char of lexicalLine) {
			if (char === "[") inAttr = true;
			else if (char === "]") inAttr = false;
			else if (char === " " && !inAttr) inContent = true;

			if (inContent) this.content += char;
			else selector += char;
		}

		this.content = this.content.trim();
		this.id = (selector.match(idRegex) || [null])[0];

		selector = selector.replace(idRegex, "");

		this.attributes = (selector.match(attrRegex) || []).map(attribute => {
			const [name, ...valueItems] = attribute.replace(/[\[\]]/g, "").split("=");
			const value = valueItems.join("=");

			return [name, (value.match(/^["']/) === null ? "\"" : "") + value + (value.match(/["']$/) === null ? "\"" : "")];
		});

		selector = selector.replace(attrRegex, "");

		this.tag = (selector.match(tagRegex) || ["div"])[0];

		selector = selector.replace(tagRegex, "");

		this.classes = (selector.match(classRegex) || []).map(className => {
			return className.replace(/^\./g, "");
		});
	}
}

/**
 * @param {string} source
 */
function compile(source) {
	let output = "";
	let lineNumber = 1;

	/** @type {[string, number, boolean][]} */
	let closingTags = [];

	for (let line of source.split("\n")) {
		lineNumber++;

		const lexicalLine = line.trim();
		const indent = (line.match(/^\t+/) || [""])[0].length;

		if (lexicalLine.startsWith("//") || lexicalLine.length === 0) continue;

		while (closingTags.length > 0 && closingTags[closingTags.length - 1][1] >= indent) {
			const [tag, indent, isTemplate] = closingTags.pop();
			output += isTemplate ? `${"\t".repeat(indent)}<% end_${tag} %>\n` : `${"\t".repeat(indent)}</${tag}>\n`;
		}

		if (lexicalLine.startsWith("%")) {
			const content = lexicalLine.replace(/(^%|\/$)/g, "").trim();
			output += `${"\t".repeat(indent)}<% ${content} %>\n`;

			if (!lexicalLine.endsWith("/")) closingTags.push([content, indent, true]);
		}
		else {
			const element = new HTMLElement(lexicalLine);

			if (!element.noChildren) {
				closingTags.push([element.tag, indent, false]);
			}

			output += `${"\t".repeat(indent)}<${element.tag}${element.id ? ` id="${element.id}"` : ""}${element.classes.length > 0 ? ` class="${element.classes.join(" ")}"` : ""}${element.attributes.length > 0 ? " " + element.attributes.map(attr => `${attr[0]}=${attr[1]}`).join(" ") : ""}>${element.content.length > 0 ? `\n${"\t".repeat(indent + 1)}${element.content}` : ""}\n`;
		}
	}

	for (let c = closingTags.length - 1; c >= 0; c--) {
		const [tag, indent] = closingTags[c];
		output += `${"\t".repeat(indent)}</${tag}>\n`;
	}


	return output;
}

const fs = require("fs");
fs.writeFileSync("example.ss", compile(fs.readFileSync("example.sm").toString()));