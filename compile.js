class HTMLElement {
// 	toString() {
// 		return `
// <${this.tag}${this.id ? ` id=${this.id}` : ""}${this.class ? ` class="${this.class}"` : ""} ${this.attributes.map(attr => `${attr[0]}="${attr[1]}"`).join(" ")}>
// 	${this.content}
// 	${this.children.map(child => child.toString()).join("\n")}
// </${this.tag}>`
// 	}

	/**
	 * @param {string} lexicalLine
	 * @param {number} indent 
	 */
	constructor(lexicalLine, indent) {
		let inAttribute = false;
		let inContent = false;
		let selector = "";
		let content = "";

		for (let char of lexicalLine) {
			if (!inContent) {
				if (char === "[") {
					inAttribute = true;
					selector += char;
				}
				else if (char === "]") {
					inAttribute = false;
					selector += char;
				}
				else if (!inAttribute && char == " ") inContent = true;
				else selector += char;
			}
			else {
				content += char;
			}
		}

		this.indent = indent;
		this.noChildren = selector.endsWith("/");

		/** @type {[string, string][]} */
		this.attributes = (selector.match(/\[.+\]/g) || []).map(attr => {
			const [name, value] = attr.replace(/(^\[|\]$)/g, "").split("=");

			return [
				name,
				value ? value.replace(/(^["']|["']$)/g, "") : name
			];
		});

		let noAttributeSelector = selector + "";
		
		for (let attribute of (selector.match(/\[.+\]/g) || [])) {
			noAttributeSelector = noAttributeSelector.replace(attribute, "");
		}

		this.tag = (selector.match(/^[\w$/\-]+/g) || ["div"])[0];
		this.classes = (noAttributeSelector.match(/\.[\w$/\-]+/g) || []).map(c => c.slice(1));
		this.id = (selector.match(/#[\w$/\-]+/g) || [""])[0].replace("#", "");
		this.content = content || null;
	}
}

/**
 * @param {string} source 
 * @returns {string}
 */
function compile(source) {
	const lines = source.split("\n");

	/** @type {[string, number, boolean][]} */
	const openElements = [];
	let output = "";

	for (let line of lines) {
		if (line.trim().length == 0) continue;

		const lexicalLine = line.trim();
		const indent = (line.match(/^\t+/g) || [""])[0].length;

		if (lexicalLine.startsWith("//")) {
			continue;
		}
		else if (lexicalLine.startsWith("%")) {
			const content = lexicalLine.replace("%", "").trim();
			output += `${"\t".repeat(indent)}<% ${content} %>\n`;
			openElements.push([content.split(" ")[0], indent, true]);
		}
		else {
			const element = new HTMLElement(lexicalLine, indent);

			while (openElements.length > 0 && indent <= openElements[openElements.length - 1][1]) {
				const [tag, indent, isCMS] = openElements.pop();
				output += isCMS ? `${"\t".repeat(indent)}<% end_${tag} %>\n` : `${"\t".repeat(indent)}</${tag}>\n`;
			}

			output += `${"\t".repeat(indent)}<${element.tag}${element.classes.length > 0 ? ` class="${element.classes.join(" ")}"` : ""}${element.id ? ` id="${element.id}"` : ""}${element.attributes.length > 0 ? " " + element.attributes.map(attr => `${attr[0]}="${attr[1]}"`).join(" ") : ""}${element.noChildren ? "/" : ""}>\n`;

			if (!element.noChildren) {
				output += element.content ? `${"\t".repeat(indent + 1)}${element.content}\n` : "";
				openElements.push([element.tag, indent, false]);
			}
		}
	}

	for (let i = openElements.length - 1; i >= 0; i--) {
		const [tag, indent, isCMS] = openElements[i];
		output += isCMS ? `${"\t".repeat(indent)}<% end_${tag} %>\n` : `${"\t".repeat(indent)}</${tag}>\n`;
	}

	return output;
}

const fs = require("fs");
fs.writeFileSync("example.ss", compile(fs.readFileSync("example.sm").toString()));