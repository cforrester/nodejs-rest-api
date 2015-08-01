var inputSanitizer = {};
inputSanitizer.maxPasses = 2000;
inputSanitizer.tagBody = "(?:[^\"'>]|\"[^\"]*\"|'[^']*')*";
inputSanitizer.tagOrComment = new RegExp("<(?:" + "!--(?:(?:-*[^->])*--+|-?)" + "|script\\b" + inputSanitizer.tagBody + ">[\\s\\S]*?</script\\s*" + "|style\\b" + inputSanitizer.tagBody + ">[\\s\\S]*?</style\\s*" + "|/?[a-z]" + inputSanitizer.tagBody + ")>", "gi");
/* 
* @function
* @name clean
* @param str String the string to be sanitized
* @param ch a specific character to remove (optional)
* @returns str String the sanitized string
* @desc removes invalid tags and/or characters from a string
*/
inputSanitizer.clean = function(str, ch) {
    var ch = ch || "";
    var n;
	var c = 0;
    do {
        n = str;
        str = str.replace(this.tagOrComment, "");
        if (ch) str = str.replace(ch, "")
		c++;
    } while (str !== n && c <= inputSanitizer.maxPasses);
	str = str.replace(/[^a-z0-9:{}'" \.,_-]/gim,"").trim();
	str = str.replace(/</g, "&lt;");
    return str;
};

exports.inputSanitizer = inputSanitizer;