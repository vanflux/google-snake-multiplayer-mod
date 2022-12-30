
export class LinkerNoValueFoundException extends Error {
  constructor(public detail: any) {
    super(`Linker no value found, detail: ${JSON.stringify(detail)}`)
  }
}
