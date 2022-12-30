
export class LinkerMultipleFunctionFoundException extends Error {
  constructor(public detail: any) {
    super(`Linker multiple function found, detail: ${JSON.stringify(detail)}`)
  }
}
