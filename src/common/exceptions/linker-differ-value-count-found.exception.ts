
export class LinkerDifferValueCountFoundException extends Error {
  constructor(public detail: any) {
    super(`Linker differ value count found, detail: ${JSON.stringify(detail)}`)
  }
}
