
export class LinkerNoFunctionFoundException extends Error {
  constructor(public detail: any) {
    super(`Linker no function found, detail: ${JSON.stringify(detail)}`)
  }
}
