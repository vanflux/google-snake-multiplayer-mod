
export class LinkerMultipleValueFoundException extends Error {
  constructor(public detail: any) {
    super(`Linker multiple value found, detail: ${JSON.stringify(detail)}`)
  }
}
