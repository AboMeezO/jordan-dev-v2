export class UnsupportedDatabaseDriverError extends Error {
  public constructor(driver: string) {
    super(
      `Database driver "${driver}" is configured but does not have an adapter implementation yet.`,
    );
    this.name = "UnsupportedDatabaseDriverError";
  }
}
