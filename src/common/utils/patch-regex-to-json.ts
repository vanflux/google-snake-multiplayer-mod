
export function patchRegexToJson() {
  RegExp.prototype.toJSON = function() { return this.toString() }
}
