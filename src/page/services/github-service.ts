
export interface ReleaseItem {
  url: string,
  html_url: string,
  assets_url: string,
  upload_url: string,
  tarball_url: string,
  zipball_url: string,
  id: number,
  node_id: string,
  tag_name: string,
  target_commitish: string,
  name: string,
  body: string,
  draft: boolean,
  prerelease: boolean,
  created_at: string,
  published_at: string,
  assets: {
    browser_download_url: string;
    name: string;
  }[],
}

class GithubService {
  async fetchReleases(): Promise<ReleaseItem[]> {
    return fetch('https://api.github.com/repos/vanflux/google-snake-multiplayer-mod/releases').then(x => x.json());
  }
}

export const githubService = new GithubService();
