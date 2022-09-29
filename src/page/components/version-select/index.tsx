import React, { useCallback, useState } from "react";
import { useQuery } from "react-query"
import { githubService } from "../../services/github-service"
import { MenuSelect } from "../menu-select";

export function VersionSelect() {
  const [tag, setTag] = useState<string>();

  const switchVersion = useCallback(() => {
    if (tag === undefined) return;
    const url = `https://github.com/vanflux/google-snake-multiplayer-mod/releases/download/${tag}/gsm-mod.js`;
    const script = document.createElement('script');
    script.src = url;
    document.body.appendChild(script);
  }, [tag]);

  const { isLoading, error, data } = useQuery(['releases'], githubService.fetchReleases);
  if (isLoading) return <span>Loading...</span>;
  if (error) return <span>{`An error has occurred: ${error}`}</span>;
  return <MenuSelect
    onChange={release => setTag(release?.tag_name)}
    items={data?.map(item => ({ name: item.tag_name, data: item }))}
  />;
}
