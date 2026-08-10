export default abstract class SpotifyUri {
  public uri: string
  public abstract toURL (): string
  public abstract toURI (): string

  constructor (uri: string) {
    this.uri = uri
  }

  public static is (v: any): v is SpotifyUri {
    return Boolean(typeof v === 'object' && typeof v.uri === 'string')
  }

  public toEmbedURL (): string {
    // Spotify's legacy embed.spotify.com endpoint renders an unthemed frame in
    // some browsers. The current embed keeps the player dark and self-contained.
    return `https://open.spotify.com/embed${this.toURL()}?utm_source=generator&theme=0`
  }

  public toOpenURL (): string {
    return `https://open.spotify.com${this.toURL()}`
  }

  public toPlayURL (): string {
    return `https://play.spotify.com${this.toURL()}`
  }
}
