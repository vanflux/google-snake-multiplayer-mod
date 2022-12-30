
export class LinkerMultipleMethodFoundException extends Error {
  constructor(public detail: any) {
    super(`Linker multiple method found, detail: ${JSON.stringify(detail)}`)
  }
}
